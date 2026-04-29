# ml/credit_pipeline.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, f1_score
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import warnings
warnings.filterwarnings("ignore")

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.feature_engineering import build_credit_features
from ml.model_store import save_model, load_model

from config import COLLECTIONS

FEATURES = [
    "creditAmount",       # known at issue time
    "issuedDayOfWeek",    # known at issue time
    "issuedMonth",        # known at issue time
    "festivalPeriod",     # known at issue time
    "salaryWeek",         # known at issue time
    "paymentCount",       # behavior signal (partial info)
    "daysToFirstPayment", # first payment behavior
    "repaymentRatio",     # how much paid so far
    "creditUtil",         # utilisation so far
]

def _risk_label(score: float) -> str:
    if score >= 0.65:   return "HIGH"
    elif score >= 0.35: return "MEDIUM"
    return "LOW"

# async def train_credit_model(branch_code: str = None):
#     from database import get_db
#     db    = get_db()
#     query = {}
#     if branch_code:
#         query["branch_code"] = branch_code

#     records = await db[COLLECTIONS["credit"]].find(
#         query, {"_id": 0}
#     ).to_list(length=50000)
    
#     df = build_credit_features(records)

    

#     X = df[FEATURES].values
#     y = df["wasDefault"].values

#     # ── Proper train/test split BEFORE SMOTE ─────────────────
#     # SMOTE is applied only on training set, never on test set
#     X_train, X_test, y_train, y_test = train_test_split(
#         X, y, test_size=0.2, random_state=42, stratify=y
#     )

#     # SMOTE only on training data
#     smote            = SMOTE(random_state=42)
#     X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

#     # Scale — fit on training only, transform both
#     scaler       = StandardScaler()
#     X_train_sc   = scaler.fit_transform(X_train_res)
#     X_test_sc    = scaler.transform(X_test)          # no leakage

#     model = XGBClassifier(
#         n_estimators=300, max_depth=4,
#         learning_rate=0.05, subsample=0.8,
#         colsample_bytree=0.8,
#         eval_metric="logloss",
#         random_state=42, verbosity=0
#     )
#     model.fit(X_train_sc, y_train_res)

#     # ── Evaluate on HELD-OUT test set ────────────────────────
#     preds  = model.predict(X_test_sc)
#     probas = model.predict_proba(X_test_sc)[:, 1]

#     roc  = round(float(roc_auc_score(y_test, probas)), 4)
#     f1   = round(float(f1_score(y_test, preds, zero_division=0)), 4)

#     # ── 5-fold cross validation for reliability ──────────────
#     # CV on original unbalanced data for honest estimate
#     scaler_cv  = StandardScaler()
#     X_sc_full  = scaler_cv.fit_transform(X)
#     cv_model   = XGBClassifier(
#         n_estimators=300, max_depth=4,
#         learning_rate=0.05, subsample=0.8,
#         colsample_bytree=0.8,
#         eval_metric="logloss",
#         random_state=42, verbosity=0
#     )
#     cv_scores = cross_val_score(
#         cv_model, X_sc_full, y,
#         cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
#         scoring="roc_auc"
#     )

#     metrics = {
#         "ROC_AUC_holdout":  roc,
#         "F1_holdout":       f1,
#         "CV_ROC_AUC_mean":  round(float(cv_scores.mean()), 4),
#         "CV_ROC_AUC_std":   round(float(cv_scores.std()),  4),
#         "default_rate_%":   round(float(y.mean() * 100), 2),
#         "train_size":       len(X_train),
#         "test_size":        len(X_test),
#     }

#     print(f"[Credit] Holdout ROC-AUC : {roc}")
#     print(f"[Credit] Holdout F1      : {f1}")
#     print(f"[Credit] CV ROC-AUC      : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

#     feat_imp = dict(zip(FEATURES, model.feature_importances_.tolist()))

#     bundle = {
#         "model":    model,
#         "scaler":   scaler,
#         "features": FEATURES,
#         "feat_imp": feat_imp,
#     }
#     model_name = f"credit_model_{branch_code}" if branch_code else "credit_model"
#     await save_model(model_name, bundle, metrics)
#     return metrics

async def train_credit_model(branch_code: str = None):
    from database import get_db
    db    = get_db()
    query = {}
    if branch_code:
        query["branch_code"] = branch_code

    records = await db[COLLECTIONS["credit"]].find(
        query, {"_id": 0}
    ).to_list(length=50000)
    
    df = build_credit_features(records)

    X = df[FEATURES].values
    y = df["wasDefault"].values

    n_samples   = len(X)
    n_defaults  = int(y.sum())
    n_majority  = n_samples - n_defaults

    print(f"[Credit] Total samples: {n_samples}, defaults: {n_defaults}, non-defaults: {n_majority}")

    if n_samples < 10:
        raise ValueError(f"Not enough data to train. Got {n_samples} records, need at least 10.")
    if n_defaults < 2:
        raise ValueError(f"Not enough default examples to train. Got {n_defaults}, need at least 2.")

    # ── Adaptive train/test split ─────────────────────────────
    # Use smaller test size when data is limited
    test_size = 0.2 if n_samples >= 50 else 0.15 if n_samples >= 20 else 0.1
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    # ── Adaptive SMOTE ────────────────────────────────────────
    # k_neighbors must be < minority class count in training set
    n_minority_train = int(y_train.sum())
    if n_minority_train >= 2:
        k = min(5, n_minority_train - 1)
        smote = SMOTE(random_state=42, k_neighbors=k)
        X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    else:
        # Too few minority samples even for SMOTE — train as-is
        print("[Credit] Warning: too few default samples for SMOTE, skipping resampling.")
        X_train_res, y_train_res = X_train, y_train

    # Scale — fit on training only, transform both
    scaler     = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train_res)
    X_test_sc  = scaler.transform(X_test)

    model = XGBClassifier(
        n_estimators=300, max_depth=4,
        learning_rate=0.05, subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        random_state=42, verbosity=0
    )
    model.fit(X_train_sc, y_train_res)

    # ── Evaluate on held-out test set ─────────────────────────
    preds  = model.predict(X_test_sc)
    probas = model.predict_proba(X_test_sc)[:, 1]

    # ROC-AUC needs both classes present in test set
    try:
        roc = round(float(roc_auc_score(y_test, probas)), 4)
    except ValueError:
        roc = None
        print("[Credit] Warning: only one class in test set, ROC-AUC skipped.")

    f1 = round(float(f1_score(y_test, preds, zero_division=0)), 4)

    # ── Adaptive cross validation ─────────────────────────────
    # n_splits must be <= smallest class count
    n_splits = min(5, n_defaults, n_majority)
    if n_splits >= 2:
        scaler_cv = StandardScaler()
        X_sc_full = scaler_cv.fit_transform(X)
        cv_model  = XGBClassifier(
            n_estimators=300, max_depth=4,
            learning_rate=0.05, subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=42, verbosity=0
        )
        cv_scores = cross_val_score(
            cv_model, X_sc_full, y,
            cv=StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42),
            scoring="roc_auc"
        )
        cv_mean = round(float(cv_scores.mean()), 4)
        cv_std  = round(float(cv_scores.std()),  4)
        print(f"[Credit] CV ROC-AUC ({n_splits}-fold): {cv_mean:.4f} ± {cv_std:.4f}")
    else:
        cv_mean = None
        cv_std  = None
        print("[Credit] Warning: too few samples for cross validation, skipped.")

    metrics = {
        "ROC_AUC_holdout": roc,
        "F1_holdout":      f1,
        "CV_ROC_AUC_mean": cv_mean,
        "CV_ROC_AUC_std":  cv_std,
        "default_rate_%":  round(float(y.mean() * 100), 2),
        "train_size":      len(X_train),
        "test_size":       len(X_test),
        "n_cv_folds":      n_splits if n_splits >= 2 else 0,
        "warning":         "Low sample count — retrain with more data for reliable metrics." if n_samples < 100 else None
    }

    print(f"[Credit] Holdout ROC-AUC : {roc}")
    print(f"[Credit] Holdout F1      : {f1}")

    feat_imp = dict(zip(FEATURES, model.feature_importances_.tolist()))

    bundle = {
        "model":    model,
        "scaler":   scaler,
        "features": FEATURES,
        "feat_imp": feat_imp,
    }
    model_name = f"credit_model_{branch_code}" if branch_code else "credit_model"
    await save_model(model_name, bundle, metrics)
    return metrics

async def assess_credit_risk(credit_code: str):
    from database import get_db
    bundle, meta = await load_model("credit_model")
    if bundle is None:
        raise RuntimeError("Credit model not trained yet. Call /credit/train first.")

    db  = get_db()
    doc = await db[COLLECTIONS["credit"]].find_one(
        {"credit_code": credit_code}, {"_id": 0}
    )
    if not doc:
        raise ValueError(f"credit_code '{credit_code}' not found.")

    df   = build_credit_features([doc])
    if 'creditUtil' not in df.columns:
        df['creditUtil'] = (df['remainingAmount'] / df['creditAmount'].replace(0, 1)).fillna(1.0)
    X    = bundle["scaler"].transform(df[FEATURES].values)
    prob = float(bundle["model"].predict_proba(X)[0][1])

    return {
        "credit_code":   credit_code,
        "risk_score":    round(prob, 4),
        "risk_label":    _risk_label(prob),
        "creditAmount":  doc.get("creditAmount"),
        "paymentStatus": doc.get("paymentStatus"),
        "delayDays":     doc.get("delayDays"),
        "model_meta": {
            "trained_at": str(meta["trained_at"]),
            "metrics":    meta["metrics"],
        },
    }


async def get_high_risk_credits(threshold: float = 0.65, branch_code: str = None):
    from database import get_db
    bundle, meta = await load_model("credit_model")
    if bundle is None:
        raise RuntimeError("Credit model not trained yet.")

    db = get_db()

    # Build query — filter by branch if provided
    query = {"paymentStatus": {"$in": ["UNPAID", "PARTIAL"]}}
    if branch_code:
        query["branch_code"] = branch_code

    records = await db[COLLECTIONS["credit"]].find(
        query, {"_id": 0}
    ).to_list(length=50000)

    if not records:
        return {
            "branch_code":       branch_code or "ALL",
            "threshold":         threshold,
            "high_risk_credits": [],
            "count":             0
        }

    df    = build_credit_features(records)
    if 'creditUtil' not in df.columns:
        df['creditUtil'] = (df['remainingAmount'] / df['creditAmount'].replace(0, 1)).fillna(1.0)
    X     = bundle["scaler"].transform(df[FEATURES].values)
    probs = bundle["model"].predict_proba(X)[:, 1]

    results = []
    for i, rec in enumerate(records):
        score = round(float(probs[i]), 4)
        if score >= threshold:
            results.append({
                "credit_code":    rec.get("credit_code", ""),
                "phoneNumber":    str(rec.get("phoneNumber", "")),
                "branch_code":    rec.get("branch_code", ""),
                "creditAmount":   rec.get("creditAmount", 0),
                "remainingAmount":rec.get("remainingAmount", 0),
                "delayDays":      rec.get("delayDays", 0),
                "risk_score":     score,
                "risk_label":     _risk_label(score),
            })

    results.sort(key=lambda x: -x["risk_score"])

    return {
        "branch_code":       branch_code or "ALL",
        "threshold":         threshold,
        "high_risk_credits": results[:100],
        "count":             len(results),
    }

# async def train_credit_model(branch_code: str = None):
#     db    = get_db()
#     query = {}
#     if branch_code:
#         query["branch_code"] = branch_code

#     records = await db[COLLECTIONS["credit"]].find(
#         query, {"_id": 0}
#     ).to_list(length=50000)

#     # ... training stays the same ...

#     model_name = f"credit_model_{branch_code}" if branch_code else "credit_model"
#     await save_model(model_name, bundle, metrics)
#     return metrics

# Add precheck function at the bottom
# async def precheck_credit_risk(payload: dict):
    
#     """
#     Score a customer BEFORE issuing credit.
#     Looks up their full credit history to build behavioral features.
#     Accepts phoneNumber OR customer_code to identify the customer.
#     """
#     from datetime import datetime
#     from database import get_db

#     branch_code   = payload.get("branch_code")
#     phone_number  = payload.get("phoneNumber")
#     customer_code = payload.get("customer_code")
#     credit_amount = float(payload.get("creditAmount", 0))

#     print(f"[DEBUG] branch_code={branch_code}")
#     print(f"[DEBUG] phone_number={phone_number} type={type(phone_number)}")
#     print(f"[DEBUG] customer_code={customer_code}")
#     print(f"[DEBUG] credit_amount={credit_amount}")

#     if not branch_code:
#         raise ValueError("branch_code is required.")
#     if not phone_number and not customer_code:
#         raise ValueError("Either phoneNumber or customer_code is required.")
#     if phone_number:
#         try:
#             phone_number = int(phone_number)
#         except (TypeError,ValueError):
#             phone_number = None
#     model_name   = f"credit_model_{branch_code}" if branch_code else "credit_model"
#     bundle, meta = await load_model(model_name)
#     if bundle is None:
#         raise RuntimeError(
#             f"No trained credit model for branch {branch_code}. Train first."
#         )

#     # ── Fetch customer's credit history ──────────────────────
#     # ── Fetch customer's credit history ──────────────────────
#     print(f"[DEBUG] query being built: branch={branch_code} phone={phone_number}")
#     db    = get_db()
#     query = {"branch_code": branch_code}
#     if phone_number:
#         from bson import Int64
#         query["phoneNumber"] = {"$in": [phone_number, Int64(phone_number)]}   # already converted to int above
#     elif customer_code:
#         query["credit_code"] = {"$regex": f"{customer_code}"} 

#     history = await db[COLLECTIONS["credit"]].find(
#         query, {"_id": 0}
#     ).sort("creditIssuedDate", -1).to_list(length=200)

#     for h in history:
#         if "creditUtilisation" in h and "creditUtil" not in h:
#             h["creditUtil"] = h["creditUtilisation"]

        
        

#     print(f"[DEBUG] history count={len(history)}")
#     if history:
#         print(f"[DEBUG] sample record keys={list(history[0].keys())}")
#         print(f"[DEBUG] sample daysToFirstPayment={history[0].get('daysToFirstPayment')}")
#         print(f"[DEBUG] sample totalDaysToRepay={history[0].get('totalDaysToRepay')}")
#         print(f"[DEBUG] sample delayDays={history[0].get('delayDays')}")
#         print(f"[DEBUG] sample paymentCount={history[0].get('paymentCount')}")
#         print(f"[DEBUG] sample phoneNumber={history[0].get('phoneNumber')}")
#         print(f"[DEBUG] sample credit_code={history[0].get('credit_code')}")
#         print(f"[DEBUG] sample branch_Code={history[0].get('branch_code')}")
#         print(f"[DEBUG] sample creditUtil={history[0].get('creditUtil')}")
        

#     month      = payload.get("issuedMonth") or datetime.utcnow().month
#     is_festival = int(month in [3, 10, 11, 12])
#     issued_dow  = int(payload.get("issuedDayOfWeek",
#                                    datetime.utcnow().weekday()))
#     salary_wk   = int(payload.get("salaryWeek", False))

#     # ── No history → REVIEW with explanation ─────────────────
#     if not history:
#         return {
#             "decision":       "REVIEW",
#             "risk_score":     0.5,
#             "risk_label":     "MEDIUM",
#             "customer_found": False,
#             "history_count":  0,
#             "creditAmount":   credit_amount,
#             "branch_code":    branch_code,
#             "identifier":     phone_number or customer_code,
#             "recommendation": (
#                 "New customer with no credit history. "
#                 "Manual review recommended before issuing credit."
#             ),
#             "model_meta": {
#                 "trained_at": str(meta["trained_at"]),
#                 "metrics":    meta["metrics"],
#             }
#         }

#     # ── Build behavioral features from history ────────────────
# # ── Build behavioral features from history ────────────────
#     total_credits   = len(history)
#     total_issued    = sum(float(h.get("creditAmount") or 0)   for h in history)
#     total_paid      = sum(float(h.get("amountPaid") or 0)     for h in history)
#     total_remaining = sum(float(h.get("remainingAmount") or 0) for h in history)
#     total_defaults  = sum(1 for h in history if h.get("wasDefault") is True)
#     total_late      = sum(1 for h in history if h.get("wasLate") is True)

#     paid_credits    = [h for h in history
#                        if h.get("paymentStatus") == "PAID"]

#     # Null-safe avg days to repay
#     valid_repay     = [float(h["totalDaysToRepay"])
#                        for h in paid_credits
#                        if h.get("totalDaysToRepay") is not None
#                        and h["totalDaysToRepay"] > 0]
#     avg_days_repay  = sum(valid_repay) / max(len(valid_repay), 1)

#     # Null-safe avg delay
#     valid_delay     = [float(h["delayDays"])
#                        for h in history
#                        if h.get("delayDays") is not None]
#     avg_delay       = sum(valid_delay) / max(len(valid_delay), 1)

#     overall_repay_ratio = total_paid / max(total_issued, 1)
#     overall_util        = total_remaining / max(total_issued, 1)

#     # Null-safe avg payment count
#     valid_pcount    = [int(h["paymentCount"])
#                        for h in history
#                        if h.get("paymentCount") is not None]
#     payment_count_avg = sum(valid_pcount) / max(len(valid_pcount), 1)

#     # Null-safe avg days to first payment
#     valid_first     = [float(h["daysToFirstPayment"])
#                        for h in history
#                        if h.get("daysToFirstPayment") is not None
#                        and h["daysToFirstPayment"] > 0]
#     days_first_avg  = sum(valid_first) / max(len(valid_first), 1)

#     # ── Build feature row ─────────────────────────────────────
#     row = {
#         "creditAmount":       float(credit_amount),
#         "amountPaid":         total_paid / max(total_credits, 1),
#         "remainingAmount":    float(credit_amount) * (1 - overall_repay_ratio),
#         "paymentCount":       float(round(payment_count_avg)),
#         "daysToFirstPayment": float(round(days_first_avg)) if days_first_avg > 0 else -1.0,
#         "totalDaysToRepay":   float(round(avg_days_repay)) if avg_days_repay > 0 else -1.0,
#         "delayDays":          float(round(avg_delay)),
#         "wasLate":            float(int(total_late > 0)),
#         "issuedDayOfWeek":    float(issued_dow),
#         "issuedMonth":        float(int(month)),
#         "festivalPeriod":     float(is_festival),
#         "salaryWeek":         float(salary_wk),
#         "repaymentRatio":     float(round(min(overall_repay_ratio, 1.0), 4)),
#         "creditUtil":         float(round(min(overall_util, 1.0), 4)),
#     }
#     print(f"[DEBUG] row built: {row}")
#     import pandas as pd
#     df   = pd.DataFrame([row])

#     print(f"[DEBUG] df shape={df.shape} columns={df.columns.tolist()}")
#     print(f"[DEBUG] FEATURES expected={FEATURES}")
#     print(f"[DEBUG] df values={df[FEATURES].values}")

#     X    = bundle["scaler"].transform(df[FEATURES].values)
#     prob = float(bundle["model"].predict_proba(X)[0][1])

#     if prob >= 0.65:   decision = "DENY"
#     elif prob >= 0.35: decision = "REVIEW"
#     else:              decision = "APPROVE"

#     recommendation_text = {
#         "APPROVE": (
#             f"Low risk. Customer has {total_credits} credit(s), "
#             f"{total_defaults} default(s). Safe to issue."
#         ),
#         "REVIEW":  (
#             f"Medium risk. Customer has {total_credits} credit(s), "
#             f"{total_defaults} default(s). Manual review recommended."
#         ),
#         "DENY":    (
#             f"High risk. Customer has {total_credits} credit(s), "
#             f"{total_defaults} default(s). Do not issue credit."
#         ),
#     }[decision]

#     return {
#         "decision":       decision,
#         "risk_score":     round(prob, 4),
#         "risk_label":     _risk_label(prob),
#         "customer_found": True,
#         "identifier":     phone_number or customer_code,
#         "creditAmount":   credit_amount,
#         "branch_code":    branch_code,
#         "history_summary": {
#             "total_credits":     total_credits,
#             "total_defaults":    total_defaults,
#             "total_late":        total_late,
#             "repayment_ratio":   round(overall_repay_ratio, 4),
#             "avg_delay_days":    round(avg_delay, 1),
#             "outstanding_amount": round(total_remaining, 2),
#         },
#         "recommendation": recommendation_text,
#         "model_meta": {
#             "trained_at": str(meta["trained_at"]),
#             "metrics":    meta["metrics"],
#         }
#     }

async def precheck_credit_risk(payload: dict):
    """
    Score a customer BEFORE issuing credit.
    Looks up their full credit history to build behavioral features.
    Accepts phoneNumber OR customer_code to identify the customer.
    """
    import traceback
    from datetime import datetime
    from database import get_db

    branch_code   = payload.get("branch_code")
    phone_number  = payload.get("phoneNumber")
    customer_code = payload.get("customer_code")
    credit_amount = float(payload.get("creditAmount", 0))

    print(f"[DEBUG] branch_code={branch_code}")
    print(f"[DEBUG] phone_number={phone_number} type={type(phone_number)}")
    print(f"[DEBUG] customer_code={customer_code}")
    print(f"[DEBUG] credit_amount={credit_amount}")

    if not branch_code:
        raise ValueError("branch_code is required.")
    if not phone_number and not customer_code:
        raise ValueError("Either phoneNumber or customer_code is required.")

    # ── Safe phone number conversion ──────────────────────────
    if phone_number is not None:
        try:
            phone_number = int(phone_number)
        except (TypeError, ValueError):
            phone_number = None

    # ── Safe scalar payload fields ────────────────────────────
    try:
        month = int(payload.get("issuedMonth") or datetime.utcnow().month)
    except (TypeError, ValueError):
        month = datetime.utcnow().month

    try:
        issued_dow = int(payload.get("issuedDayOfWeek") or datetime.utcnow().weekday())
    except (TypeError, ValueError):
        issued_dow = datetime.utcnow().weekday()

    try:
        salary_wk = int(bool(payload.get("salaryWeek") or False))
    except (TypeError, ValueError):
        salary_wk = 0

    is_festival = int(month in [3, 10, 11, 12])

    # ── Load model ────────────────────────────────────────────
    model_name   = f"credit_model_{branch_code}" if branch_code else "credit_model"
    bundle, meta = await load_model(model_name)
    if bundle is None:
        raise RuntimeError(
            f"No trained credit model for branch {branch_code}. Train first."
        )

    # ── Fetch customer's credit history ──────────────────────
    print(f"[DEBUG] query being built: branch={branch_code} phone={phone_number}")
    db    = get_db()
    query = {"branch_code": branch_code}
    if phone_number:
        from bson import Int64
        query["phoneNumber"] = {"$in": [phone_number, Int64(phone_number)]}
    elif customer_code:
        query["credit_code"] = {"$regex": f"{customer_code}"}

    try:
        history = await db[COLLECTIONS["credit"]].find(
            query, {"_id": 0}
        ).sort("creditIssuedDate", -1).to_list(length=200)
    except Exception as e:
        traceback.print_exc()
        raise RuntimeError(f"DB fetch failed: {e}")

    # ── Normalise field name inconsistency (creditUtilisation → creditUtil) ──
    for h in history:
        if "creditUtil" not in h:
            h["creditUtil"] = h.get("creditUtilisation", 0.0) or 0.0

    print(f"[DEBUG] history count={len(history)}")
    if history:
        print(f"[DEBUG] sample keys        = {list(history[0].keys())}")
        print(f"[DEBUG] paymentCount       = {history[0].get('paymentCount')}")
        print(f"[DEBUG] daysToFirstPayment = {history[0].get('daysToFirstPayment')}")
        print(f"[DEBUG] totalDaysToRepay   = {history[0].get('totalDaysToRepay')}")
        print(f"[DEBUG] delayDays          = {history[0].get('delayDays')}")
        print(f"[DEBUG] creditUtil         = {history[0].get('creditUtil')}")

    # ── No history → REVIEW ───────────────────────────────────
    if not history:
        return {
            "decision":       "REVIEW",
            "risk_score":     0.5,
            "risk_label":     "MEDIUM",
            "customer_found": False,
            "history_count":  0,
            "creditAmount":   credit_amount,
            "branch_code":    branch_code,
            "identifier":     phone_number or customer_code,
            "recommendation": (
                "New customer with no credit history. "
                "Manual review recommended before issuing credit."
            ),
            "model_meta": {
                "trained_at": str(meta["trained_at"]),
                "metrics":    meta["metrics"],
            },
        }

    # ── Build behavioral features from history ────────────────
    try:
        total_credits   = len(history)
        total_issued    = sum(float(h.get("creditAmount")    or 0) for h in history)
        total_paid      = sum(float(h.get("amountPaid")      or 0) for h in history)
        total_remaining = sum(float(h.get("remainingAmount") or 0) for h in history)
        total_defaults  = sum(1 for h in history if h.get("wasDefault") is True)
        total_late      = sum(1 for h in history if h.get("wasLate")    is True)

        paid_credits = [h for h in history if h.get("paymentStatus") == "PAID"]

        # avg days to repay (paid credits only, positive values only)
        valid_repay = []
        for h in paid_credits:
            v = h.get("totalDaysToRepay")
            try:
                v = float(v)
                if v > 0:
                    valid_repay.append(v)
            except (TypeError, ValueError):
                pass
        avg_days_repay = sum(valid_repay) / max(len(valid_repay), 1)

        # avg delay days
        valid_delay = []
        for h in history:
            v = h.get("delayDays")
            try:
                valid_delay.append(float(v))
            except (TypeError, ValueError):
                pass
        avg_delay = sum(valid_delay) / max(len(valid_delay), 1)

        overall_repay_ratio = total_paid      / max(total_issued, 1)
        overall_util        = total_remaining / max(total_issued, 1)

        # avg payment count
        valid_pcount = []
        for h in history:
            v = h.get("paymentCount")
            try:
                valid_pcount.append(int(v))
            except (TypeError, ValueError):
                pass
        payment_count_avg = sum(valid_pcount) / max(len(valid_pcount), 1)

        # avg days to first payment
        valid_first = []
        for h in history:
            v = h.get("daysToFirstPayment")
            try:
                v = float(v)
                if v > 0:
                    valid_first.append(v)
            except (TypeError, ValueError):
                pass
        days_first_avg = sum(valid_first) / max(len(valid_first), 1)

    except Exception as e:
        traceback.print_exc()
        raise RuntimeError(f"Feature aggregation failed: {e}")

    # ── Build feature row ─────────────────────────────────────
    try:
        row = {
            "creditAmount":       float(credit_amount),
            "issuedDayOfWeek":    float(issued_dow),
            "issuedMonth":        float(month),
            "festivalPeriod":     float(is_festival),
            "salaryWeek":         float(salary_wk),
            "paymentCount":       float(round(payment_count_avg)),
            "daysToFirstPayment": float(round(days_first_avg)) if days_first_avg > 0 else -1.0,
            "repaymentRatio":     float(round(min(overall_repay_ratio, 1.0), 4)),
            "creditUtil":         float(round(min(overall_util, 1.0), 4)),
        }

        print(f"[DEBUG] row built: {row}")

        import pandas as pd
        df = pd.DataFrame([row])

        print(f"[DEBUG] df columns  = {df.columns.tolist()}")
        print(f"[DEBUG] FEATURES    = {FEATURES}")
        print(f"[DEBUG] df[FEATURES]= {df[FEATURES].values}")

        X    = bundle["scaler"].transform(df[FEATURES].values)
        prob = float(bundle["model"].predict_proba(X)[0][1])

    except Exception as e:
        traceback.print_exc()
        raise RuntimeError(f"Scoring failed: {e}")

    # ── Decision ──────────────────────────────────────────────
    if   prob >= 0.65: decision = "DENY"
    elif prob >= 0.35: decision = "REVIEW"
    else:              decision = "APPROVE"

    recommendation_text = {
        "APPROVE": (
            f"Low risk. Customer has {total_credits} credit(s), "
            f"{total_defaults} default(s). Safe to issue."
        ),
        "REVIEW": (
            f"Medium risk. Customer has {total_credits} credit(s), "
            f"{total_defaults} default(s). Manual review recommended."
        ),
        "DENY": (
            f"High risk. Customer has {total_credits} credit(s), "
            f"{total_defaults} default(s). Do not issue credit."
        ),
    }[decision]

    return {
        "decision":       decision,
        "risk_score":     round(prob, 4),
        "risk_label":     _risk_label(prob),
        "customer_found": True,
        "identifier":     phone_number or customer_code,
        "creditAmount":   credit_amount,
        "branch_code":    branch_code,
        "history_summary": {
            "total_credits":      total_credits,
            "total_defaults":     total_defaults,
            "total_late":         total_late,
            "repayment_ratio":    round(overall_repay_ratio, 4),
            "avg_delay_days":     round(avg_delay, 1),
            "outstanding_amount": round(total_remaining, 2),
        },
        "recommendation": recommendation_text,
        "model_meta": {
            "trained_at": str(meta["trained_at"]),
            "metrics":    meta["metrics"],
        },
    }