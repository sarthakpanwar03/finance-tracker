import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 8000;
const SECRET = 'fintracker_secret';

app.use(cors());
app.use(bodyParser.json());

// Demo users
const users = [
  { username: 'Sarthak_Pawnar_03', password: 'finance', name: 'Sarthak Pawnar' },
  { username: 'John Doe', password: 'Fullstackdev', name: 'John Doe' }
];

// Demo categories
const categories = ['food', 'travel', 'shopping', 'utilities', 'entertainment', 'other'];

// Demo expenses storage (in-memory)
let expenses = [];

// Auth: Login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, user });
  } else {
    res.json({ success: false, error: 'Invalid credentials' });
  }
});

// Auth: Verify
app.get('/auth/verify', (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = users.find(u => u.username === decoded.username);
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch {
    res.status(401).json({ error: 'Token verification failed' });
  }
});

// Get categories
app.get('/categories', (req, res) => {
  res.json({ categories });
});

// Add expense
app.post('/expenses', (req, res) => {
  const { userId, amount, category, description, date } = req.body;
  if (!userId || !amount || !category || !date) {
    return res.json({ success: false, error: 'Missing fields' });
  }
  const expense = {
    id: expenses.length + 1,
    userId,
    amount: parseFloat(amount),
    category,
    description,
    date
  };
  expenses.push(expense);
  res.json({ success: true, expense });
});

// Get expenses
app.get('/expenses', (req, res) => {
  const { userId, month, year } = req.query;
  const filtered = expenses.filter(e =>
    e.userId === userId &&
    new Date(e.date).getMonth() + 1 === parseInt(month) &&
    new Date(e.date).getFullYear() === parseInt(year)
  );
  res.json({ expenses: filtered });
});

// Dashboard data
app.get('/dashboard', (req, res) => {
  const { userId } = req.query;
  const userExpenses = expenses.filter(e => e.userId === userId);

  // This Month
  const now = new Date();
  const thisMonthExpenses = userExpenses.filter(e =>
    new Date(e.date).getMonth() === now.getMonth() &&
    new Date(e.date).getFullYear() === now.getFullYear()
  );
  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category Breakdown
  const categoryBreakdown = {};
  userExpenses.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
  });

  // Monthly Data (last 12 months)
  const monthlyData = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthExpenses = userExpenses.filter(e =>
      new Date(e.date).getMonth() === d.getMonth() &&
      new Date(e.date).getFullYear() === d.getFullYear()
    );
    monthlyData.unshift({
      month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      amount: monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    });
  }

  // Recent Expenses
  const recentExpenses = userExpenses.slice(-5).reverse();

  res.json({
    totalThisMonth,
    categoryBreakdown,
    monthlyData,
    recentExpenses
  });
});

app.listen(PORT, () => {
  console.log(`Node.js backend running on http://localhost:${PORT}`);
});