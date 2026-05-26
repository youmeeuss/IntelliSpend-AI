'use server';

import { spawn } from 'child_process';
import path from 'path';
import { headers } from 'next/headers';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // 15 requests per minute

interface MLInput {
  task: 'category_prediction' | 'expense_prediction' | 'budget_forecasting' | 'investment_prediction';
  query?: string;
  transactions?: any[];
  income?: number;
  riskLevel?: string;
  monthlyAmount?: number;
  age?: number;
}

export async function runMLPrediction(input: MLInput): Promise<any> {
  // Rate Limiting Check based on client IP
  let clientIp = '127.0.0.1';
  try {
    const headersList = await headers();
    clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  } catch (e) {
    // Ignore headers access outside active request context
  }

  const now = Date.now();
  const limitInfo = rateLimitMap.get(clientIp);

  if (!limitInfo) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    if (now > limitInfo.resetTime) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
      limitInfo.count += 1;
      if (limitInfo.count > MAX_REQUESTS_PER_WINDOW) {
        console.warn(`Rate limit exceeded for client IP: ${clientIp}`);
        return {
          status: 'error',
          message: 'Too many requests. Prediction API rate limit exceeded. Please try again in 1 minute.'
        };
      }
    }
  }

  const apiUrl = process.env.ML_API_URL || process.env.NEXT_PUBLIC_ML_API_URL;
  
  if (apiUrl) {
    try {
      const url = `${apiUrl.replace(/\/$/, '')}/predict`;
      console.log(`Connecting to remote ML API: ${url}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        console.error(`Remote ML service returned error: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error('Failed to communicate with remote ML API. Falling back to local spawn...', err);
    }
  }

  return new Promise((resolve) => {
    try {
      const scriptPath = path.join(process.cwd(), 'ml', 'ml_engine.py');
      const pyProcess = spawn('python3', [scriptPath]);

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python ML script exited with code ${code}. Stderr: ${stderrData}`);
          resolve(runFallbackJS(input));
          return;
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          if (parsed.status === 'error') {
            console.error('Python ML engine reported error:', parsed.message);
            resolve(runFallbackJS(input));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          console.error('Failed to parse Python stdout JSON:', e, 'Raw output:', stdoutData);
          resolve(runFallbackJS(input));
        }
      });

      // Write input to Python process stdin
      pyProcess.stdin.write(JSON.stringify(input));
      pyProcess.stdin.end();
    } catch (err) {
      console.error('Failed to spawn Python process:', err);
      resolve(runFallbackJS(input));
    }
  });
}

// Fallback calculations in pure TypeScript/JS in case Python is missing
function runFallbackJS(input: MLInput): any {
  console.log(`Executing TypeScript/JS fallback for task: ${input.task}`);
  
  if (input.task === 'category_prediction') {
    const q = (input.query || '').toLowerCase();
    let pred = 'Shopping';
    if (/food|mcdonald|cafe|pizza|burger|starbuck|restaurant|swiggy|zomato/i.test(q)) pred = 'Food';
    else if (/grocery|supermarket|walmart|target|tesco|kroger|costco/i.test(q)) pred = 'Groceries';
    else if (/uber|taxi|cab|metro|shell|gas|train|bus/i.test(q)) pred = 'Transport';
    else if (/netflix|spotify|disney|cinema|ticket|game|show/i.test(q)) pred = 'Entertainment';
    else if (/electric|water|utility|bill|rent|internet/i.test(q)) pred = 'Bills';

    return {
      status: "success",
      predictedCategory: pred,
      probabilities: {
        "Food": pred === "Food" ? 0.8 : 0.04,
        "Groceries": pred === "Groceries" ? 0.8 : 0.04,
        "Transport": pred === "Transport" ? 0.8 : 0.04,
        "Entertainment": pred === "Entertainment" ? 0.8 : 0.04,
        "Bills": pred === "Bills" ? 0.8 : 0.04,
        "Shopping": pred === "Shopping" ? 0.8 : 0.04,
      }
    };
  }

  if (input.task === 'expense_prediction') {
    const txs = input.transactions || [];
    if (txs.length === 0) {
      return {
        status: "success",
        predictedExpense: 0,
        pastExpenses: [0, 0, 0, 0, 0, 0],
        pastMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        nextMonth: "Jul"
      };
    }

    // Group transactions by YYYY-MM
    const monthlyData: Record<string, number> = {};
    txs.forEach((tx: any) => {
      try {
        const dateStr = tx.date || '';
        if (dateStr.length >= 7) {
          const yearMonth = dateStr.substring(0, 7); // YYYY-MM
          const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0;
          if (amount > 0) { // Outflows only
            monthlyData[yearMonth] = (monthlyData[yearMonth] || 0) + amount;
          }
        }
      } catch (e) {}
    });

    const monthNamesMap: Record<string, string> = {
      "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
      "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
    };

    const sortedMonths = Object.keys(monthlyData).sort();
    const lastMonths = sortedMonths.slice(-6);

    // Pad if less than 6
    while (lastMonths.length < 6) {
      if (lastMonths.length === 0) {
        lastMonths.push("2026-05"); // default starting point
      } else {
        const firstM = lastMonths[0];
        const parts = firstM.split('-');
        let y = parseInt(parts[0]);
        let m = parseInt(parts[1]);
        m -= 1;
        if (m === 0) {
          m = 12;
          y -= 1;
        }
        const prevM = `${y}-${m.toString().padStart(2, '0')}`;
        lastMonths.unshift(prevM);
      }
    }

    const pastExpenses = lastMonths.map(m => monthlyData[m] || 0);
    const pastMonths = lastMonths.map(m => {
      const parts = m.split('-');
      const monthCode = parts[1] || '01';
      return monthNamesMap[monthCode] || 'Jan';
    });

    // Predict next month name
    const lastM = lastMonths[lastMonths.length - 1];
    const parts = lastM.split('-');
    let nextY = parseInt(parts[0]);
    let nextMNum = parseInt(parts[1]) + 1;
    if (nextMNum === 13) {
      nextMNum = 1;
      nextY += 1;
    }
    const nextMonthCode = nextMNum.toString().padStart(2, '0');
    const nextMonth = monthNamesMap[nextMonthCode] || 'Jan';

    // Linear regression
    const n = pastExpenses.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = pastExpenses.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - xMean) * (pastExpenses[i] - yMean);
      den += Math.pow(x[i] - xMean, 2);
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = yMean - slope * xMean;
    const pred = Math.max(0.0, slope * (n + 1) + intercept);

    return {
      status: "success",
      predictedExpense: parseFloat(pred.toFixed(2)),
      pastExpenses: pastExpenses.map(s => parseFloat(s.toFixed(2))),
      pastMonths,
      nextMonth
    };
  }

  if (input.task === 'budget_forecasting') {
    const inc = input.income || 75000.0;
    const expResult = runFallbackJS({ task: 'expense_prediction', transactions: input.transactions });
    const pastExpenses = expResult.pastExpenses;
    
    // Fit simple linear step from past expenses
    const n = pastExpenses.length;
    let slope = 100; // default step
    if (n > 1) {
      slope = (pastExpenses[n - 1] - pastExpenses[0]) / (n - 1);
    }
    
    // Determine the next 3 months names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let nextMonthIndex = monthNames.indexOf(expResult.nextMonth);
    if (nextMonthIndex === -1) nextMonthIndex = 7; // default Aug
    
    const forecasts = Array.from({ length: 3 }).map((_, idx) => {
      const mIdx = (nextMonthIndex + idx) % 12;
      const mName = monthNames[mIdx];
      const exp = Math.max(0, pastExpenses[pastExpenses.length - 1] + slope * (1 + idx));
      const savings = Math.max(0, inc - exp);
      
      return {
        month: mName,
        predictedExpense: parseFloat(exp.toFixed(2)),
        predictedSavings: parseFloat(savings.toFixed(2))
      };
    });

    return {
      status: "success",
      forecasts
    };
  }

  if (input.task === 'investment_prediction') {
    const risk = (input.riskLevel || 'medium').toLowerCase();
    let alloc = { LargeCap: 40.0, MidCap: 30.0, Debt: 20.0, Liquid: 10.0 };
    if (risk === 'low') {
      alloc = { LargeCap: 30.0, MidCap: 10.0, Debt: 45.0, Liquid: 15.0 };
    } else if (risk === 'high') {
      const age = input.age || 30;
      if (age < 35) {
        alloc = { LargeCap: 25.0, MidCap: 55.0, Debt: 15.0, Liquid: 5.0 };
      } else {
        alloc = { LargeCap: 40.0, MidCap: 35.0, Debt: 20.0, Liquid: 5.0 };
      }
    }
    return {
      status: "success",
      allocations: alloc
    };
  }

  return { status: "error", message: "Unknown task" };
}
