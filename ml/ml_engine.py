import sys
import json
import numpy as np

# Suppress warnings for clean output
import warnings
warnings.filterwarnings("ignore")

try:
    import pandas as pd
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.linear_model import LinearRegression
    from sklearn.tree import DecisionTreeClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

def run_category_prediction(query):
    # Fallback default map in case of errors
    default_pred = "Shopping"
    default_probs = {"Groceries": 0.15, "Transport": 0.15, "Entertainment": 0.15, "Bills": 0.15, "Shopping": 0.25, "Food": 0.15}

    if not SKLEARN_AVAILABLE:
        # Static fuzzy matching fallback if sklearn is not installed yet
        q_lower = query.lower()
        if any(w in q_lower for w in ["mcdonald", "cafe", "starbuck", "food", "burger", "pizza", "restaurant", "swiggy", "zomato"]):
            return "Food", {"Food": 0.8, "Groceries": 0.1, "Shopping": 0.1}
        if any(w in q_lower for w in ["grocery", "supermarket", "walmart", "target", "tesco", "kroger", "costco"]):
            return "Groceries", {"Groceries": 0.85, "Food": 0.1, "Shopping": 0.05}
        if any(w in q_lower for w in ["uber", "taxi", "cab", "metro", "shell", "gas", "train", "bus"]):
            return "Transport", {"Transport": 0.9, "Bills": 0.05, "Shopping": 0.05}
        if any(w in q_lower for w in ["netflix", "spotify", "disney", "cinema", "ticket", "game", "show"]):
            return "Entertainment", {"Entertainment": 0.8, "Shopping": 0.1, "Groceries": 0.1}
        if any(w in q_lower for w in ["electric", "power", "water", "utility", "gas bill", "internet", "bill", "rent"]):
            return "Bills", {"Bills": 0.9, "Transport": 0.05, "Shopping": 0.05}
        return default_pred, default_probs

    try:
        training_data = [
            ("McDonalds", "Food"), ("Burger King", "Food"), ("Starbucks", "Food"), ("Cafe Coffee Day", "Food"), ("Domino's Pizza", "Food"), ("Subway", "Food"), ("Pizza Hut", "Food"), ("KFC", "Food"), ("Swiggy Restaurant", "Food"), ("Zomato Delivery", "Food"), ("Chipotle Mexican", "Food"), ("Dunkin Donuts", "Food"),
            ("Walmart Grocery", "Groceries"), ("Target Supermarket", "Groceries"), ("Whole Foods Market", "Groceries"), ("Tesco Grocery", "Groceries"), ("Carrefour Store", "Groceries"), ("Kroger", "Groceries"), ("Costco Wholesale", "Groceries"), ("Fresh Foods Store", "Groceries"), ("Aldi Market", "Groceries"), ("Spencer's Supermarket", "Groceries"), ("Trader Joe's", "Groceries"),
            ("Uber Ride", "Transport"), ("Lyft Ride", "Transport"), ("Yellow Cab Taxi", "Transport"), ("Metro Transit Fare", "Transport"), ("Shell Gas Station", "Transport"), ("Chevron Gas", "Transport"), ("ExxonMobil Fuel", "Transport"), ("Train Ticket Booking", "Transport"), ("Bus Fare Ticket", "Transport"), ("Subway Pass", "Transport"), ("Bharat Petroleum BPCL", "Transport"),
            ("Netflix Subscription", "Entertainment"), ("Spotify Music Premium", "Entertainment"), ("Disney Plus Video", "Entertainment"), ("Cinema Tickets Movie", "Entertainment"), ("IMAX Theater Cinema", "Entertainment"), ("Concert Tickets Show", "Entertainment"), ("Bowling Alley Arena", "Entertainment"), ("Steam Games Wallet", "Entertainment"), ("PlayStation Store Network", "Entertainment"),
            ("Electric Bill Utility", "Bills"), ("Water Utility Corporation", "Bills"), ("Gas Connection Bill", "Bills"), ("Comcast Internet Service", "Bills"), ("Verizon Wireless Mobile", "Bills"), ("AT&T Mobile Bill", "Bills"), ("Rent Payment Landlord", "Bills"), ("Insurance Premium Monthly", "Bills"), ("Trash Collection Waste", "Bills"),
            ("Zara Clothing Apparel", "Shopping"), ("H&M Store Fashion", "Shopping"), ("Amazon Online Shop", "Shopping"), ("Nike Shoes Store", "Shopping"), ("Adidas Store Sports", "Shopping"), ("Macy's Department Store", "Shopping"), ("Best Buy Tech Store", "Shopping"), ("IKEA Home Furniture", "Shopping"), ("Decathlon Sports Goods", "Shopping"), ("Flipkart Electronics", "Shopping")
        ]
        
        texts, labels = zip(*training_data)
        vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5))
        X_train = vectorizer.fit_transform(texts)
        clf = MultinomialNB(alpha=0.1)
        clf.fit(X_train, np.array(labels))

        X_test = vectorizer.transform([query])
        pred = str(clf.predict(X_test)[0])
        probs = clf.predict_proba(X_test)[0]
        classes = clf.classes_
        prob_map = {str(classes[i]): float(probs[i]) for i in range(len(classes))}
        return pred, prob_map
    except Exception as e:
        return default_pred, default_probs

def run_expense_prediction(transactions):
    monthly_data = {}
    if transactions:
        for tx in transactions:
            try:
                date_str = tx.get('date', '')
                if len(date_str) >= 7:
                    year_month = date_str[:7]
                    amount = float(tx.get('amount', 0.0))
                    if amount > 0: # Outflows only
                        monthly_data[year_month] = monthly_data.get(year_month, 0.0) + amount
            except:
                pass

    month_names_map = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
        "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
    }

    sorted_months = sorted(monthly_data.keys())
    last_months = sorted_months[-6:]

    # Pad if less than 6 months
    while len(last_months) < 6:
        if not last_months:
            last_months.append("2026-05")
        else:
            first_m = last_months[0]
            try:
                parts = first_m.split('-')
                y = int(parts[0])
                m = int(parts[1]) - 1
                if m == 0:
                    m = 12
                    y -= 1
                prev_m = f"{y:04d}-{m:02d}"
                last_months.insert(0, prev_m)
            except:
                last_months.insert(0, "2026-01")

    spends = [monthly_data.get(m, 0.0) for m in last_months]
    past_months = []
    for m in last_months:
        try:
            code = m.split('-')[1]
            past_months.append(month_names_map.get(code, "Jan"))
        except:
            past_months.append("Jan")

    # Predict next month name
    try:
        last_m = last_months[-1]
        parts = last_m.split('-')
        next_y = int(parts[0])
        next_m_num = int(parts[1]) + 1
        if next_m_num == 13:
            next_m_num = 1
            next_y += 1
        next_month_code = f"{next_m_num:02d}"
        next_month = month_names_map.get(next_month_code, "Jan")
    except:
        next_month = "Aug"

    # Fit regression
    n = len(spends)
    x = list(range(1, n + 1))
    x_mean = sum(x) / n
    y_mean = sum(spends) / n
    num = sum((x[i] - x_mean) * (spends[i] - y_mean) for i in range(n))
    den = sum((x[i] - x_mean) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0.0
    intercept = y_mean - slope * x_mean
    pred = max(0.0, slope * (n + 1) + intercept)

    return round(pred, 2), [round(s, 2) for s in spends], past_months, next_month

def run_budget_forecasting(transactions, income=75000.0):
    pred_expense, past_expenses, past_months, next_month = run_expense_prediction(transactions)
    
    n = len(past_expenses)
    slope = 100.0
    if n > 1:
        slope = (past_expenses[-1] - past_expenses[0]) / (n - 1)
        
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    try:
        next_month_index = month_names.index(next_month)
    except:
        next_month_index = 7 # default Aug
        
    forecasts = []
    for i in range(3):
        m_idx = (next_month_index + i) % 12
        m_name = month_names[m_idx]
        exp = max(0.0, past_expenses[-1] + slope * (1 + i))
        savings = max(0.0, income - exp)
        forecasts.append({
            "month": m_name,
            "predictedExpense": round(exp, 2),
            "predictedSavings": round(savings, 2)
        })
    return forecasts

def run_investment_prediction(risk_level, monthly_amount, age):
    # Allocate SIP portfolio distribution across 4 asset classes:
    # 1. Large Cap Mutual Funds
    # 2. Mid/Small Cap Mutual Funds
    # 3. Debt/Bonds
    # 4. Liquid/Cash
    
    # We use a Decision Tree classifier trained on financial rules
    # Features: [RiskNumeric, MonthlyAmount, Age]
    # RiskNumeric: Low=0, Medium=1, High=2
    
    default_alloc = {"LargeCap": 40.0, "MidCap": 30.0, "Debt": 20.0, "Liquid": 10.0}
    
    # Map Risk
    risk_map = {"low": 0, "medium": 1, "high": 2}
    r_val = risk_map.get(risk_level.lower(), 1)
    
    if not SKLEARN_AVAILABLE:
        # Fallback allocation logic
        if r_val == 0: # Low Risk
            return {"LargeCap": 30.0, "MidCap": 10.0, "Debt": 45.0, "Liquid": 15.0}
        elif r_val == 2: # High Risk
            if age < 35:
                return {"LargeCap": 25.0, "MidCap": 55.0, "Debt": 15.0, "Liquid": 5.0}
            else:
                return {"LargeCap": 40.0, "MidCap": 35.0, "Debt": 20.0, "Liquid": 5.0}
        else: # Medium Risk
            return default_alloc

    try:
        # Train decision tree on synthetic allocation profiles
        # Format: [RiskLevel, MonthlyAmount, Age] -> Allocation index
        # Allocations catalog:
        allocations = [
            {"LargeCap": 30.0, "MidCap": 10.0, "Debt": 45.0, "Liquid": 15.0}, # 0: Conservative
            {"LargeCap": 40.0, "MidCap": 30.0, "Debt": 20.0, "Liquid": 10.0}, # 1: Moderate
            {"LargeCap": 25.0, "MidCap": 55.0, "Debt": 15.0, "Liquid": 5.0},  # 2: Aggressive (Young)
            {"LargeCap": 45.0, "MidCap": 35.0, "Debt": 15.0, "Liquid": 5.0}   # 3: Aggressive (Mature)
        ]
        
        # Training dataset
        # X: [RiskLevel(0-2), MonthlyAmount, Age]
        X_train = np.array([
            [0, 5000, 25], [0, 10000, 45], [0, 20000, 60], # Conservative
            [1, 5000, 28], [1, 15000, 38], [1, 25000, 50], # Moderate
            [2, 3000, 22], [2, 10000, 29], [2, 15000, 32], # Aggressive (Young)
            [2, 25000, 40], [2, 50000, 48], [2, 100000, 55] # Aggressive (Mature)
        ])
        y_train = np.array([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3])
        
        clf = DecisionTreeClassifier(max_depth=3)
        clf.fit(X_train, y_train)
        
        test_sample = np.array([[r_val, monthly_amount, age]])
        alloc_idx = int(clf.predict(test_sample)[0])
        return allocations[alloc_idx]
    except Exception as e:
        return default_alloc

def main():
    try:
        # Read from stdin
        input_data = json.loads(sys.stdin.read())
        task = input_data.get('task')
        
        output = {}
        if task == 'category_prediction':
            query = input_data.get('query', '')
            pred, prob_map = run_category_prediction(query)
            output = {
                "status": "success",
                "predictedCategory": pred,
                "probabilities": prob_map
            }
        elif task == 'expense_prediction':
            txs = input_data.get('transactions', [])
            pred, past, past_months, next_month = run_expense_prediction(txs)
            output = {
                "status": "success",
                "predictedExpense": pred,
                "pastExpenses": past,
                "pastMonths": past_months,
                "nextMonth": next_month
            }
        elif task == 'budget_forecasting':
            txs = input_data.get('transactions', [])
            inc = float(input_data.get('income', 75000.0))
            forecasts = run_budget_forecasting(txs, inc)
            output = {
                "status": "success",
                "forecasts": forecasts
            }
        elif task == 'investment_prediction':
            rl = input_data.get('riskLevel', 'medium')
            ma = float(input_data.get('monthlyAmount', 10000.0))
            age = int(input_data.get('age', 30))
            alloc = run_investment_prediction(rl, ma, age)
            output = {
                "status": "success",
                "allocations": alloc
            }
        else:
            output = {"status": "error", "message": "Unknown task"}
            
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == '__main__':
    main()
