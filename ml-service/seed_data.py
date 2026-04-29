# seed_data.py
# Run once: python seed_data.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random
import numpy as np
from config import MONGO_URI, DB_NAME, COLLECTIONS

PRODUCTS = [
    "doritos10", "lays20", "maggi10", "colgate50",
    "dettol100", "tata_salt", "aashirvaad_atta", "boost200",
    "parle_g", "britannia_marie"
]
BRANCHES  = ["SUD1-BR-1", "SUD1-BR-2", "SUD1-BR-3"]
BUSINESS  = "SUD1"
CUSTOMERS = [f"CUST-{i:04d}" for i in range(1, 101)]  # 100 customers

SEASON_MAP = {1:"WINTER",2:"WINTER",3:"SUMMER",4:"SUMMER",
              5:"SUMMER",6:"MONSOON",7:"MONSOON",8:"MONSOON",
              9:"AUTUMN",10:"AUTUMN",11:"WINTER",12:"WINTER"}

FESTIVAL_MONTHS = [3, 10, 11, 12]

def week_of_month(dt):
    return (dt.day - 1) // 7 + 1

def is_salary_week(dt):
    # 1st and last week of month
    return dt.day <= 7 or dt.day >= 24

async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]

    # ── CLEAR existing test data ──────────────────────────────
    await db[COLLECTIONS["sales"]].delete_many({"_seeded": True})
    await db[COLLECTIONS["credit"]].delete_many({"_seeded": True})
    print("Cleared previous seeded data.")

    # ─────────────────────────────────────────────────────────
    # SALES DATA — 2000 records
    # Each product+branch gets a realistic demand curve
    # ─────────────────────────────────────────────────────────
    sales_docs = []
    base_date  = datetime.now() - timedelta(days=180)  # 6 months history

    product_base_demand = {p: random.randint(5, 40) for p in PRODUCTS}
    product_stock       = {(p, b): random.randint(100, 300)
                           for p in PRODUCTS for b in BRANCHES}

    for i in range(2000):
        dt          = base_date + timedelta(days=random.randint(0, 175))
        product     = random.choice(PRODUCTS)
        branch      = random.choice(BRANCHES)
        dow         = dt.weekday()          # 0=Mon, 6=Sun
        month       = dt.month
        is_weekend  = dow >= 5
        is_festival = month in FESTIVAL_MONTHS
        salary_wk   = is_salary_week(dt)

        # Demand logic — mirrors your Rossmann notebook
        base   = product_base_demand[product]
        demand = base
        if is_weekend:  demand = int(demand * random.uniform(1.2, 1.5))
        if is_festival: demand = int(demand * random.uniform(1.3, 1.8))
        if salary_wk:   demand = int(demand * random.uniform(1.1, 1.3))
        demand = max(1, demand + random.randint(-3, 3))

        unit_price  = round(random.choice([10, 20, 25, 50, 100, 200]) *
                            random.uniform(0.9, 1.1), 2)
        stock_key   = (product, branch)
        stock_before = max(demand + random.randint(5, 50),
                           product_stock.get(stock_key, 50))
        stock_after  = stock_before - demand
        product_stock[stock_key] = max(0, stock_after)

        sales_docs.append({
            "product_code":    product,
            "branch_code":     branch,
            "business_code":   BUSINESS,
            "quantitySold":    demand,
            "unitPrice":       unit_price,
            "totalSaleAmount": round(demand * unit_price, 2),
            "stockBeforeSale": stock_before,
            "stockAfterSale":  max(0, stock_after),
            "saleDate":        dt,
            "dayOfWeek":       dow,
            "weekOfMonth":     week_of_month(dt),
            "month":           month,
            "season":          SEASON_MAP[month],
            "isWeekend":       is_weekend,
            "festivalPeriod":  is_festival,
            "salaryWeek":      salary_wk,
            "createdAt":       dt,
            "_seeded":         True,          # tag for easy cleanup
        })

    await db[COLLECTIONS["sales"]].insert_many(sales_docs)
    print(f"✅ Inserted {len(sales_docs)} sale records.")

    # ─────────────────────────────────────────────────────────
    # CREDIT DATA — 500 records
    # ─────────────────────────────────────────────────────────
    # ─────────────────────────────────────────────────────────
    # CREDIT DATA — 500 records (with realistic noise)
    # ─────────────────────────────────────────────────────────
    credit_docs = []
    base_date   = datetime.now() - timedelta(days=180)

    for i in range(500):
        customer    = random.choice(CUSTOMERS)
        branch      = random.choice(BRANCHES)
        issued_dt   = base_date + timedelta(days=random.randint(0, 165))
        due_dt      = issued_dt + timedelta(days=15)
        dow         = issued_dt.weekday()
        month       = issued_dt.month
        is_festival = month in FESTIVAL_MONTHS
        salary_wk   = is_salary_week(issued_dt)

        credit_amt  = round(random.choice([
            random.uniform(50,   500),
            random.uniform(500,  2000),
            random.uniform(2000, 5000),
        ]), 2)

        # Payment probability
        pay_prob = 0.60
        if salary_wk:         pay_prob += 0.10
        if dow < 5:           pay_prob += 0.03
        if credit_amt < 500:  pay_prob += 0.07
        if is_festival:       pay_prob -= 0.08
        if credit_amt > 2000: pay_prob -= 0.10
        if credit_amt > 4000: pay_prob -= 0.08
        pay_prob = max(0.15, min(0.85, pay_prob))

        # Add genuine randomness — some high-prob people still default
        # and some low-prob people still pay. This is real life.
        pay_prob += random.uniform(-0.15, 0.15)
        pay_prob  = max(0.10, min(0.90, pay_prob))

        fully_paid = random.random() < pay_prob
        now        = datetime.now()

        if fully_paid:
            days_to_repay      = random.randint(1, 25)
            amount_paid        = credit_amt * random.uniform(0.95, 1.0)
            remaining          = max(0, credit_amt - amount_paid)
            payment_status     = "PAID"
            payment_count      = random.randint(1, 5)
            days_first_payment = random.randint(1, max(2, days_to_repay))
            delay_days         = max(0, days_to_repay - 15)
            was_late           = delay_days > 0
            # 5% mislabel noise
            was_default        = random.random() < 0.05
        else:
            paid_ratio         = random.uniform(0, 0.80)
            amount_paid        = round(credit_amt * paid_ratio, 2)
            remaining          = round(credit_amt - amount_paid, 2)
            payment_status     = "UNPAID" if paid_ratio < 0.05 else "PARTIAL"
            payment_count      = 0 if paid_ratio < 0.05 else random.randint(1, 4)
            days_first_payment = None if paid_ratio < 0.05 else random.randint(3, 35)
            days_to_repay      = None
            elapsed            = (now - issued_dt).days
            delay_days         = max(0, elapsed - 15) + random.randint(0, 10)
            was_late           = True
            # 8% mislabel noise for non-payers too
            was_default        = random.random() > 0.08

        # Noise on numeric fields
        credit_amt  = max(10,  credit_amt * random.uniform(0.95, 1.05))
        amount_paid = max(0,   min(credit_amt,
                          amount_paid * random.uniform(0.92, 1.08)))
        remaining   = max(0,   credit_amt - amount_paid)
        repayment_ratio = round(
            np.clip(amount_paid / credit_amt + random.uniform(-0.04, 0.04),
                    0, 1), 4)
        credit_util = round(
            np.clip(remaining / credit_amt + random.uniform(-0.03, 0.03),
                    0, 1), 4)

        credit_code = f"CRED-{customer}-{issued_dt.strftime('%d%m%Y')}-{i}"

        credit_docs.append({
            "credit_code":        credit_code,
            "phoneNumber":        int(f"9{random.randint(100000000,999999999)}"),
            "branch_code":        branch,
            "business_code":      BUSINESS,
            "creditAmount":       round(credit_amt, 2),
            "amountPaid":         round(amount_paid, 2),
            "remainingAmount":    round(remaining, 2),
            "creditIssuedDate":   issued_dt,
            "dueDate":            due_dt,
            "paymentStatus":      payment_status,
            "paymentCount":       payment_count,
            "daysToFirstPayment": days_first_payment,
            "totalDaysToRepay":   days_to_repay,
            "delayDays":          delay_days,
            "wasLate":            was_late,
            "wasDefault":         was_default,
            "issuedDayOfWeek":    dow,
            "issuedMonth":        month,
            "festivalPeriod":     is_festival,
            "salaryWeek":         salary_wk,
            "repaymentRatio":     repayment_ratio,
            "creditUtilisation":  credit_util,
            "createdAt":          issued_dt,
            "_seeded":            True,
        })

    await db[COLLECTIONS["credit"]].insert_many(credit_docs)
    print(f"✅ Inserted {len(credit_docs)} credit records.")

    # ── Summary ───────────────────────────────────────────────
    sales_count  = await db[COLLECTIONS["sales"]].count_documents({})
    credit_count = await db[COLLECTIONS["credit"]].count_documents({})
    default_rate = sum(1 for d in credit_docs if d["wasDefault"]) / len(credit_docs)
    print(f"\n── DB Summary ──────────────────────────")
    print(f"Total sales  : {sales_count}")
    print(f"Total credits: {credit_count}")
    print(f"Default rate : {default_rate*100:.1f}%")
    print(f"Products     : {PRODUCTS}")
    print(f"Branches     : {BRANCHES}")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())