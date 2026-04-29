# ml/demand_pipeline.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error
import warnings
warnings.filterwarnings("ignore")

from ml.feature_engineering import build_demand_features, SEASON_MAP
from ml.model_store import save_model, load_model
from database import get_db
from config import COLLECTIONS

FEATURES = [
    "dayofweek", "month", "week_of_year", "season",
    "is_weekend", "is_festival", "is_salary_wk",
    "lag7", "lag14", "rolling7_mean", "rolling14_mean",
]

def _add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add lag and rolling features per product+branch group."""
    df = df.sort_values("ds")
    grp = df.groupby(["product_code", "branch_code"])
    df["lag7"]          = grp["y"].shift(7)
    df["lag14"]         = grp["y"].shift(14)
    df["rolling7_mean"] = grp["y"].shift(1).transform(
                              lambda x: x.rolling(7,  min_periods=1).mean())
    df["rolling14_mean"]= grp["y"].shift(1).transform(
                              lambda x: x.rolling(14, min_periods=1).mean())
    return df.dropna(subset=["lag7", "lag14"])

async def train_demand_model(branch_code: str = None):
    """
    Fetches all sales from MongoDB, trains a GBM demand model,
    stores it in MongoDB. Returns metrics dict.
    """
    db = get_db()

    # Filter by branch if provided
    query = {}
    if branch_code:
        query["branch_code"] = branch_code

    records = await db[COLLECTIONS["sales"]].find(
        query,
        {"_id": 0, "product_code": 1, "branch_code": 1,
         "saleDate": 1, "quantitySold": 1,
         "festivalPeriod": 1, "salaryWeek": 1}
    ).to_list(length=50000)

    df = build_demand_features(records)
    df = _add_lag_features(df)

    # Train / test split — last 14 days as test
    cutoff    = df["ds"].max() - timedelta(days=14)
    train_df  = df[df["ds"] <= cutoff]
    test_df   = df[df["ds"] >  cutoff]

    scaler  = StandardScaler()
    X_train = scaler.fit_transform(train_df[FEATURES])
    y_train = train_df["y"].values
    X_test  = scaler.transform(test_df[FEATURES])
    y_test  = test_df["y"].values

    model = GradientBoostingRegressor(
        n_estimators=300, max_depth=4,
        learning_rate=0.05, subsample=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Metrics
    preds  = model.predict(X_test).clip(min=0)
    mae    = round(float(mean_absolute_error(y_test, preds)), 4)
    mape   = round(float(np.mean(np.abs(
                 (y_test - preds) / np.where(y_test == 0, 1, y_test)
             )) * 100), 2)

    metrics = {"MAE": mae, "MAPE(%)": mape,
               "train_size": len(train_df), "test_size": len(test_df)}

    # Store model bundle (model + scaler + feature stats)
    bundle = {
        "model":    model,
        "scaler":   scaler,
        "features": FEATURES,
        # Per-product rolling stats for inference
        "product_stats": (
            df.groupby(["product_code", "branch_code"])["y"]
              .agg(["mean", "std", "count"])
              .reset_index()
              .to_dict("records")
        ),
    }
    model_name = f"demand_model_{branch_code}" if branch_code else "demand_model"
    await save_model(model_name, bundle, metrics)
    return metrics

async def predict_restock(days: int = 7, branch_code: str = None):
    """
    Returns a restock recommendation list for the next `days` days.
    Each item: product_code, branch, predicted_total_demand,
               current_avg_stock, restock_needed (bool), urgency.
    """
    model_name   = f"demand_model_{branch_code}" if branch_code else "demand_model"
    bundle, meta = await load_model(model_name)
    if bundle is None:
        raise RuntimeError(f"No trained model for branch {branch_code}. "
            f"Call POST /demand/train?branch_code={branch_code} first.")

    model   = bundle["model"]
    scaler  = bundle["scaler"]
    stats   = pd.DataFrame(bundle["product_stats"])

    # Build inference rows for each product+branch for next `days` days
    today     = datetime.utcnow()
    rows      = []
    combos    = stats[["product_code", "branch_code"]].values

    if branch_code:
        combos = [(p, b) for p, b in combos if b == branch_code]

    for product, branch in combos:
        for d in range(1, days + 1):
            future_dt = today + timedelta(days=d)
            month     = future_dt.month
            rows.append({
                "product_code":  product,
                "branch_code":   branch,
                "dayofweek":     future_dt.weekday(),
                "month":         month,
                "week_of_year":  int(future_dt.isocalendar()[1]),
                "season":        SEASON_MAP[month],
                "is_weekend":    int(future_dt.weekday() >= 5),
                "is_festival":   int(month in [3, 10, 11, 12]),
                "is_salary_wk":  int(future_dt.day <= 7 or future_dt.day >= 24),
            })

    inf_df = pd.DataFrame(rows)

    # Fill lag features with product-level historical means
    stat_lookup = {(r["product_code"], r["branch_code"]): r
                   for r in bundle["product_stats"]}
    for feat in ["lag7", "lag14", "rolling7_mean", "rolling14_mean"]:
        inf_df[feat] = inf_df.apply(
            lambda r: stat_lookup.get(
                (r["product_code"], r["branch_code"]), {}
            ).get("mean", 10),
            axis=1
        )

    X       = scaler.transform(inf_df[FEATURES])
    inf_df["predicted_demand"] = model.predict(X).clip(min=0)

    # Aggregate per product+branch
    summary = (
        inf_df.groupby(["product_code", "branch_code"])
              .agg(total_predicted=("predicted_demand", "sum"),
                   avg_daily=("predicted_demand", "mean"))
              .reset_index()
    )

    # Fetch latest stock levels
    db       = get_db()
    pipeline = [
        {"$sort":  {"saleDate": -1}},
        {"$group": {"_id":   {"product": "$product_code",
                               "branch":  "$branch_code"},
                    "stock": {"$first": "$stockAfterSale"}}},
    ]
    stock_cursor = db[COLLECTIONS["sales"]].aggregate(pipeline)
    stock_docs   = await stock_cursor.to_list(length=1000)
    stock_map    = {(d["_id"]["product"], d["_id"]["branch"]): d["stock"]
                    for d in stock_docs}

    results = []
    for _, row in summary.iterrows():
        key           = (row["product_code"], row["branch_code"])
        current_stock = stock_map.get(key, 0)
        predicted     = round(row["total_predicted"], 1)
        gap           = predicted - current_stock
        restock_qty   = max(0, round(gap * 1.2))  # 20% safety buffer

        if gap > predicted * 0.7:    urgency = "HIGH"
        elif gap > predicted * 0.3:  urgency = "MEDIUM"
        else:                        urgency = "LOW"

        results.append({
            "product_code":     row["product_code"],
            "branch_code":      row["branch_code"],
            "predicted_demand": predicted,
            "current_stock":    current_stock,
            "restock_qty":      restock_qty,
            "restock_needed":   gap > 0,
            "urgency":          urgency,
        })

    # Sort by urgency then by gap descending
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    results.sort(key=lambda x: (order[x["urgency"]],
                                -x["restock_qty"]))
    return {"days_horizon": days, "recommendations": results,
            "model_meta": {"trained_at": str(meta["trained_at"]),
                           "metrics": meta["metrics"]}}