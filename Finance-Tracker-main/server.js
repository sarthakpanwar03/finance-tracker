const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// MongoDB setup
const client = new MongoClient(process.env.MONGO_URL);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'fintracker');
    console.log('✅ Connected to MongoDB');
  }
  return db;
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', process.env.NEXT_PUBLIC_BASE_URL],
  credentials: true
}));
app.use(express.json());

// Predefined users as requested
const USERS = {
  'Sarthak_Pawnar_03': { password: 'finance', name: 'Sarthak Pawnar' },
  'John Doe': { password: 'Fullstackdev', name: 'John Doe' }
};

// Expense categories
const CATEGORIES = ['food', 'travel', 'rent', 'utilities', 'entertainment', 'healthcare', 'other'];

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'FinTracker Backend is running' });
});

// Auth routes
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (USERS[username] && USERS[username].password === password) {
      // Simple token for demo (in production, use proper JWT)
      res.json({ 
        success: true, 
        token: username,
        user: { username, name: USERS[username].name }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/auth/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const username = Object.keys(USERS).find(user => user === token);
    if (username) {
      res.json({ 
        success: true, 
        user: { username, name: USERS[username].name } 
      });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories route
app.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

// Expense routes
app.get('/expenses', async (req, res) => {
  try {
    const database = await connectDB();
    const { userId, month, year } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    let query = { userId };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate.toISOString(), $lte: endDate.toISOString() };
    }

    const expenses = await database.collection('expenses').find(query).sort({ date: -1 }).toArray();
    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/expenses', async (req, res) => {
  try {
    const database = await connectDB();
    const expenseData = req.body;
    
    const expense = {
      id: uuidv4(),
      userId: expenseData.userId,
      amount: parseFloat(expenseData.amount),
      category: expenseData.category,
      description: expenseData.description || '',
      date: expenseData.date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await database.collection('expenses').insertOne(expense);
    res.json({ success: true, expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/expenses/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const { id } = req.params;
    const updateData = req.body;
    
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }
    
    updateData.updatedAt = new Date().toISOString();

    const result = await database.collection('expenses').updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/expenses/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const { id } = req.params;

    const result = await database.collection('expenses').deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard route
app.get('/dashboard', async (req, res) => {
  try {
    const database = await connectDB();
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Monthly expenses for current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const monthlyExpenses = await database.collection('expenses').find({
      userId,
      date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
    }).toArray();

    // Category breakdown
    const categoryBreakdown = {};
    monthlyExpenses.forEach(expense => {
      categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
    });

    // Last 6 months data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      const monthExpenses = await database.collection('expenses').find({
        userId,
        date: { $gte: monthStart.toISOString(), $lte: monthEnd.toISOString() }
      }).toArray();
      
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: total
      });
    }

    const totalThisMonth = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    res.json({
      totalThisMonth,
      categoryBreakdown,
      monthlyData,
      recentExpenses: monthlyExpenses.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 FinTracker Backend running on port ${PORT}`);
  await connectDB();
});