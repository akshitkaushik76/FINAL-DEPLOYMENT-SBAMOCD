# ml/feature_engineering.py
import pandas as pd
import numpy as np
from datetime import datetime

SEASON_MAP = {1:0, 2:0, 3:1, 4:1, 5:1,
              6:2, 7:2, 8:2, 9:3, 10:3, 11:0, 12:0}

def build_demand_features(records: list) -> pd.DataFrame:
    """
    Converts raw MongoDB sale documents into a feature DataFrame.
    One row per (product_code, branch_code, saleDate).
    """
    if not records:
        raise ValueError("No sales records found in DB.")

    df = pd.DataFrame(records)
    df["ds"] = pd.to_datetime(df["saleDate"])
    df["y"]  = df["quantitySold"].astype(float)

    # Temporal features
    df["dayofweek"]    = df["ds"].dt.dayofweek
    df["month"]        = df["ds"].dt.month
    df["week_of_year"] = df["ds"].dt.isocalendar().week.astype(int)
    df["season"]       = df["month"].map(SEASON_MAP)
    df["is_weekend"]   = (df["dayofweek"] >= 5).astype(int)
    df["is_festival"]  = df["festivalPeriod"].astype(int)
    df["is_salary_wk"] = df["salaryWeek"].astype(int)

    return df

def build_credit_features(records: list) -> pd.DataFrame:
    """
    Converts raw MongoDB credit documents into a feature DataFrame.
    """
    if not records:
        raise ValueError("No credit records found in DB.")

    df = pd.DataFrame(records)
    df["creditAmount"]       = df["creditAmount"].astype(float)
    df["amountPaid"]         = df["amountPaid"].astype(float)
    df["remainingAmount"]    = df["remainingAmount"].astype(float)
    df["delayDays"]          = df["delayDays"].fillna(0).astype(float)
    df["paymentCount"]       = df["paymentCount"].fillna(0).astype(float)
    df["daysToFirstPayment"] = df["daysToFirstPayment"].fillna(-1).astype(float)
    df["totalDaysToRepay"]   = df["totalDaysToRepay"].fillna(-1).astype(float)
    df["wasLate"]            = df["wasLate"].astype(int)
    df["festivalPeriod"]     = df["festivalPeriod"].astype(int)
    df["salaryWeek"]         = df["salaryWeek"].astype(int)

    # Engineered ratios
    df["repaymentRatio"]   = (df["amountPaid"] /
                              df["creditAmount"].replace(0, np.nan)).fillna(0).clip(0, 1)
    df["creditUtil"]       = (df["remainingAmount"] /
                              df["creditAmount"].replace(0, np.nan)).fillna(0).clip(0, 1)

    df["wasDefault"] = df["wasDefault"].astype(int)
    return df