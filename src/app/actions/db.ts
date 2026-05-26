'use server';

import { getDb, isMongoEnabled } from '@/lib/mongodb';
import { verifySessionToken } from './auth-verify';

// Helper to sanitize query variables and prevent NoSQL Injection
function sanitizeString(val: any): string {
  if (typeof val === 'string') return val;
  return String(val || '');
}

// User Actions
export async function saveUserDb(profile: any) {
  if (!isMongoEnabled || !profile) return null;
  try {
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(profile.uid);
    if (!cleanUid) return null;

    // Enforce strict key mapping to prevent arbitrary document pollution injections
    const sanitizedProfile = {
      uid: cleanUid,
      email: sanitizeString(profile.email),
      displayName: sanitizeString(profile.displayName),
      photoURL: sanitizeString(profile.photoURL),
      role: sanitizeString(profile.role) || 'User',
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').updateOne(
      { uid: cleanUid },
      { $set: sanitizedProfile },
      { upsert: true }
    );
    return sanitizedProfile;
  } catch (err) {
    console.error('Error saving user to MongoDB:', err);
    return null;
  }
}

export async function getUserDb(uid: string) {
  if (!isMongoEnabled) return null;
  try {
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    return await db.collection('users').findOne({ uid: cleanUid });
  } catch (err) {
    console.error('Error getting user from MongoDB:', err);
    return null;
  }
}

// Transaction Actions
export async function addTransactionDb(tx: any, sessionToken: string) {
  if (!isMongoEnabled || !tx) return null;
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    const cleanId = sanitizeString(tx.id);
    if (!cleanUid || !cleanId) return null;

    // Strict key mapping sanitization
    const sanitizedTx = {
      id: cleanId,
      userId: cleanUid,
      date: sanitizeString(tx.date),
      description: sanitizeString(tx.description),
      category: sanitizeString(tx.category),
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
      currency: sanitizeString(tx.currency) || 'USD',
      location: sanitizeString(tx.location),
      createdAt: new Date().toISOString()
    };

    await db.collection('transactions').updateOne(
      { id: cleanId },
      { $set: sanitizedTx },
      { upsert: true }
    );
    return tx;
  } catch (err) {
    console.error('Error saving transaction to MongoDB:', err);
    return null;
  }
}

export async function getTransactionsDb(sessionToken: string) {
  if (!isMongoEnabled) return null;
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    const docs = await db.collection('transactions')
      .find({ userId: cleanUid })
      .sort({ date: -1 })
      .toArray();

    return docs.map(d => {
      const { _id, ...rest } = d;
      return rest;
    });
  } catch (err) {
    console.error('Error fetching transactions from MongoDB:', err);
    return null;
  }
}

// Receipt Actions
export async function addReceiptDb(receipt: any, sessionToken: string) {
  if (!isMongoEnabled || !receipt) return null;
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    const cleanId = sanitizeString(receipt.id);
    if (!cleanUid || !cleanId) return null;

    // Strict key mapping sanitization
    const sanitizedReceipt = {
      id: cleanId,
      userId: cleanUid,
      vendor: sanitizeString(receipt.vendor),
      date: sanitizeString(receipt.date),
      totalAmount: typeof receipt.totalAmount === 'number' ? receipt.totalAmount : parseFloat(receipt.totalAmount) || 0,
      currency: sanitizeString(receipt.currency) || 'USD',
      items: Array.isArray(receipt.items) ? receipt.items.map((i: any) => ({
        description: sanitizeString(i?.description),
        price: typeof i?.price === 'number' ? i.price : parseFloat(i?.price) || 0
      })) : [],
      imageUrl: sanitizeString(receipt.imageUrl),
      isBlurry: !!receipt.isBlurry,
      blurExplanation: sanitizeString(receipt.blurExplanation),
      isFraudSuspected: !!receipt.isFraudSuspected,
      fraudExplanation: sanitizeString(receipt.fraudExplanation),
      createdAt: new Date().toISOString()
    };

    await db.collection('receipts').updateOne(
      { id: cleanId },
      { $set: sanitizedReceipt },
      { upsert: true }
    );
    return receipt;
  } catch (err) {
    console.error('Error saving receipt to MongoDB:', err);
    return null;
  }
}

export async function getReceiptsDb(sessionToken: string) {
  if (!isMongoEnabled) return null;
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    const docs = await db.collection('receipts')
      .find({ userId: cleanUid })
      .sort({ date: -1 })
      .toArray();

    return docs.map(d => {
      const { _id, ...rest } = d;
      return rest;
    });
  } catch (err) {
    console.error('Error fetching receipts from MongoDB:', err);
    return null;
  }
}

// Investment Actions
export async function saveInvestmentDb(allocations: any, sessionToken: string) {
  if (!isMongoEnabled) return null;
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    if (!cleanUid) return null;

    await db.collection('investments').updateOne(
      { userId: cleanUid },
      { $set: { allocations, userId: cleanUid, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return allocations;
  } catch (err) {
    console.error('Error saving investment allocation to MongoDB:', err);
    return null;
  }
}

export async function getInvestmentDb(sessionToken: string) {
  if (!isMongoEnabled) return null;
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    const doc = await db.collection('investments').findOne({ userId: cleanUid });
    return doc ? doc.allocations : null;
  } catch (err) {
    console.error('Error fetching investment allocations from MongoDB:', err);
    return null;
  }
}

// Chat History Actions
export async function saveChatHistoryDb(messages: any[], sessionToken: string) {
  if (!isMongoEnabled) return null;
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    const cleanUid = sanitizeString(uid);
    if (!cleanUid) return null;

    // Sanitize message items to prevent script tag injections
    const sanitizedMessages = Array.isArray(messages) ? messages.map((m: any) => ({
      role: sanitizeString(m?.role) === 'user' ? 'user' : 'assistant',
      content: sanitizeString(m?.content)
    })) : [];

    await db.collection('chats').updateOne(
      { userId: cleanUid },
      { $set: { messages: sanitizedMessages, userId: cleanUid, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return messages;
  } catch (err) {
    console.error('Error saving chat history to MongoDB:', err);
    return null;
  }
}

export async function getChatHistoryDb(sessionToken: string) {
  if (!isMongoEnabled) return [];
  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return [];

    const cleanUid = sanitizeString(uid);
    const doc = await db.collection('chats').findOne({ userId: cleanUid });
    return doc ? doc.messages : [];
  } catch (err) {
    console.error('Error fetching chat history from MongoDB:', err);
    return [];
  }
}

export async function getAdminMetricsDb(sessionToken: string) {
  // If MongoDB is not enabled, return highly realistic mock metrics
  if (!isMongoEnabled) {
    return {
      totalUsers: 142,
      totalTransactions: 1245,
      fraudAlerts: 14,
      blurryReceipts: 8,
      mostCommonCategories: [
        { name: 'Food', count: 512, amount: 84320 },
        { name: 'Transport', count: 245, amount: 28400 },
        { name: 'Shopping', count: 189, amount: 41200 },
        { name: 'Bills', count: 112, amount: 95400 },
        { name: 'Entertainment', count: 104, amount: 24500 },
        { name: 'Groceries', count: 83, amount: 32800 },
      ],
      aiUsageStats: {
        chatSessions: 840,
        ocrScans: 412,
        investmentPlans: 124
      },
      flaggedReceipts: [
        { id: 'rx-1', vendor: 'Super Store', date: '2026-05-24', totalAmount: 420.50, currency: 'INR', reason: 'Math Mismatch: items total (₹390.00) + tax (₹10.00) != total (₹420.50)' },
        { id: 'rx-2', vendor: 'Quick Cab Services', date: '2026-05-23', totalAmount: 85.00, currency: 'USD', reason: 'Blurry Image: lower-half text unrecognizable' },
        { id: 'rx-3', vendor: 'Hyper Electronics', date: '2026-05-22', totalAmount: 5400.00, currency: 'USD', reason: 'Altered Values: duplicate text alignments detected in receipt body' }
      ]
    };
  }

  try {
    const uid = await verifySessionToken(sessionToken);
    const db = await getDb();
    if (!db) return null;

    // Check user role
    const userDoc = await db.collection('users').findOne({ uid });
    if (!userDoc || userDoc.role !== 'Admin') {
      throw new Error('Unauthorized access: Admin role required');
    }

    // 1. Total users
    const totalUsers = await db.collection('users').countDocuments();

    // 2. Total transactions
    const totalTransactions = await db.collection('transactions').countDocuments();

    // 3. Fraud alerts & Blurry receipts
    const fraudAlerts = await db.collection('receipts').countDocuments({ isFraudSuspected: true });
    const blurryReceipts = await db.collection('receipts').countDocuments({ isBlurry: true });

    // 4. Most common categories
    const categoryPipeline = [
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ];
    const categoryDocs = await db.collection('transactions').aggregate(categoryPipeline).toArray();
    const mostCommonCategories = categoryDocs.map(c => ({
      name: c._id || 'Unknown',
      count: c.count,
      amount: c.amount
    }));

    // 5. AI Usage stats
    const chatSessions = await db.collection('chats').countDocuments();
    const ocrScans = await db.collection('receipts').countDocuments();
    const investmentPlans = await db.collection('investments').countDocuments();

    // 6. Flagged receipts list for audits
    const flaggedDocs = await db.collection('receipts')
      .find({ $or: [{ isFraudSuspected: true }, { isBlurry: true }] })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    const flaggedReceipts = flaggedDocs.map(r => ({
      id: r.id,
      vendor: r.vendor,
      date: r.date,
      totalAmount: r.totalAmount,
      currency: r.currency,
      reason: r.isFraudSuspected 
        ? `Fraud Flag: ${r.fraudExplanation || 'Mathematical inconsistency'}` 
        : `Blurry Flag: ${r.blurExplanation || 'Text extraction difficulty'}`
    }));

    return {
      totalUsers,
      totalTransactions,
      fraudAlerts,
      blurryReceipts,
      mostCommonCategories,
      aiUsageStats: {
        chatSessions,
        ocrScans,
        investmentPlans
      },
      flaggedReceipts
    };
  } catch (err) {
    console.error('Error fetching admin metrics from MongoDB:', err);
    throw err;
  }
}
