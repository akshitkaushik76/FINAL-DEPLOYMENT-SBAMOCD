# # routes/credit.py
# from fastapi import APIRouter, Query, HTTPException
# from pydantic import BaseModel
# from services.credit_service import train, assess, high_risk

# router = APIRouter()

# class AssessRequest(BaseModel):
#     credit_code: str

# @router.post("/train")
# async def train_credit():
#     """Train credit risk model on all credit transactions in MongoDB."""
#     try:
#         return await train()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.post("/assess")
# async def assess_credit(req: AssessRequest):
#     """Get risk score for a single credit transaction."""
#     try:
#         return await assess(req.credit_code)
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))
#     except RuntimeError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/high-risk")
# async def high_risk_credits(
#     threshold:   float = Query(default=0.65, ge=0.0, le=1.0,
#                                description="Risk score threshold"),
#     branch_code: str   = Query(default=None,
#                                description="Filter by branch code"),
# ):
#     try:
#         return await high_risk(threshold, branch_code)
#     except RuntimeError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# routes/credit.py
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.credit_service import train, assess, high_risk, precheck, get_status

router = APIRouter()

class AssessRequest(BaseModel):
    credit_code: str

class PrecheckRequest(BaseModel):
    branch_code:     str
    creditAmount:    float
    phoneNumber:     Optional[int]   = None
    customer_code:   Optional[str]   = None
    issuedDayOfWeek: Optional[int]   = None
    issuedMonth:     Optional[int]   = None
    festivalPeriod:  Optional[bool]  = False
    salaryWeek:      Optional[bool]  = False

@router.post("/train")
async def train_credit(
    branch_code:   str = Query(...,  description="Branch code"),
    business_code: str = Query(None, description="Business code"),
):
    try:
        return await train(branch_code=branch_code, business_code=business_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assess")
async def assess_credit(req: AssessRequest):
    try:
        return await assess(req.credit_code)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @router.post("/precheck")
# async def precheck_credit(req: PrecheckRequest):
#     """Score a customer BEFORE issuing credit. Returns APPROVE/REVIEW/DENY."""
#     try:
#         return await precheck(req.dict())
#     except RuntimeError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@router.post("/precheck")
async def precheck_credit(req: PrecheckRequest):
    """Score a customer BEFORE issuing credit. Returns APPROVE/REVIEW/DENY."""
    try:
        payload = req.dict()
        print(f"[DEBUG precheck] payload received: {payload}")  # ← add this
        return await precheck(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/high-risk")
async def high_risk_credits(
    branch_code: str   = Query(...,          description="Branch code"),
    threshold:   float = Query(default=0.65, ge=0.0, le=1.0),
):
    try:
        return await high_risk(threshold, branch_code)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def status(branch_code: str = Query(...)):
    try:
        return await get_status(branch_code=branch_code, model_type="credit")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))