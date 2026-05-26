from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import sys
import os

# Ensure the current directory is in the import path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import ml_engine

app = FastAPI(
    title="IntelliSpend AI ML Engine", 
    description="REST API for Scikit-learn Linear Regression, Decision Tree, and Naive Bayes models"
)

# Enable CORS for Next.js server requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MLInput(BaseModel):
    task: str
    query: Optional[str] = None
    transactions: Optional[List[Any]] = None
    income: Optional[float] = None
    riskLevel: Optional[str] = None
    monthlyAmount: Optional[float] = None
    age: Optional[int] = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "IntelliSpend ML Engine",
        "sklearn_available": ml_engine.SKLEARN_AVAILABLE
    }

@app.post("/predict")
def predict(data: MLInput):
    try:
        task = data.task
        
        if task == 'category_prediction':
            query = data.query or ''
            pred, prob_map = ml_engine.run_category_prediction(query)
            return {
                "status": "success",
                "predictedCategory": pred,
                "probabilities": prob_map
            }
            
        elif task == 'expense_prediction':
            txs = data.transactions or []
            pred, past = ml_engine.run_expense_prediction(txs)
            return {
                "status": "success",
                "predictedExpense": pred,
                "pastExpenses": past
            }
            
        elif task == 'budget_forecasting':
            txs = data.transactions or []
            inc = data.income if data.income is not None else 75000.0
            forecasts = ml_engine.run_budget_forecasting(txs, inc)
            return {
                "status": "success",
                "forecasts": forecasts
            }
            
        elif task == 'investment_prediction':
            rl = data.riskLevel or 'medium'
            ma = data.monthlyAmount if data.monthlyAmount is not None else 10000.0
            age = data.age if data.age is not None else 30
            alloc = ml_engine.run_investment_prediction(rl, ma, age)
            return {
                "status": "success",
                "allocations": alloc
            }
            
        else:
            raise HTTPException(status_code=400, detail=f"Unknown task type: '{task}'")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
