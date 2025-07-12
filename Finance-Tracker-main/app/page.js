'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PlusCircle, DollarSign, TrendingUp, Calendar, LogOut, Wallet, PieChart as PieChartIcon, Activity } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const COLORS = ['#00e5ff', '#ff3366', '#00ff88', '#ffaa00', '#aa88ff', '#ff6600', '#88ff00'];

export default function FinTracker() {
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('fintracker_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadCategories();
      loadDashboardData();
      loadExpenses();
    }
  }, [user, selectedMonth, selectedYear]);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/verify?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('fintracker_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('fintracker_token');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('fintracker_token', data.token);
        setUser(data.user);
        setLoginForm({ username: '', password: '' });
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fintracker_token');
    setUser(null);
    setExpenses([]);
    setDashboardData(null);
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/categories`);
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/dashboard?userId=${user.username}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/expenses?userId=${user.username}&month=${selectedMonth}&year=${selectedYear}`);
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          userId: user.username
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setExpenseForm({
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setShowAddExpense(false);
        loadExpenses();
        loadDashboardData();
      } else {
        alert(data.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Add expense error:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Login Page
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-950 border-gray-800 shadow-2xl">
          <CardHeader className="text-center pb-6">
            {/* FinTracker Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 p-3 rounded-xl shadow-lg">
                  <Wallet className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">
                    FinTracker
                  </h1>
                  <p className="text-sm text-gray-400">Personal Finance Manager</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="username" className="text-gray-300 text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white mt-1 focus:border-cyan-400 focus:ring-cyan-400"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white mt-1 focus:border-cyan-400 focus:ring-cyan-400"
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold py-3"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-300 mb-3 font-medium">Demo Accounts:</p>
              <div className="text-xs text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Username:</span> 
                  <span className="text-cyan-400 font-mono">Sarthak_Pawnar_03</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span> 
                  <span className="text-cyan-400 font-mono">finance</span>
                </div>
                <hr className="border-gray-700 my-2"/>
                <div className="flex justify-between">
                  <span>Username:</span> 
                  <span className="text-cyan-400 font-mono">John Doe</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span> 
                  <span className="text-cyan-400 font-mono">Fullstackdev</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 p-2 rounded-lg shadow-lg">
              <Wallet className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">
                FinTracker
              </h1>
              <p className="text-sm text-gray-400">Welcome back, {user.name}</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-950 border-gray-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">This Month's Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(dashboardData.totalThisMonth)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Active Categories</CardTitle>
                <PieChartIcon className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {Object.keys(dashboardData.categoryBreakdown).length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Recent Transactions</CardTitle>
                <Activity className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {dashboardData.recentExpenses.length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Trend Chart */}
            <Card className="bg-gray-950 border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-300">Monthly Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#000000', 
                        border: '1px solid #1f2937',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#00e5ff" 
                      strokeWidth={3}
                      dot={{ fill: '#00e5ff', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#00e5ff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown Chart */}
            <Card className="bg-gray-950 border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-300">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(dashboardData.categoryBreakdown).map(([category, amount]) => ({
                        name: category,
                        value: amount
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(dashboardData.categoryBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#000000', 
                        border: '1px solid #1f2937',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32 bg-gray-950 border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800">
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleDateString('en-US', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24 bg-gray-950 border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800">
                {Array.from({ length: 5 }, (_, i) => (
                  <SelectItem key={2020 + i} value={(2020 + i).toString()}>
                    {2020 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => setShowAddExpense(true)}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <Card className="bg-gray-950 border-gray-800 mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-300">Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-gray-300">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white mt-1 focus:border-cyan-400"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-gray-300">Category</Label>
                  <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({...expenseForm, category: value})}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-gray-800">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Input
                    id="description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white mt-1 focus:border-cyan-400"
                    placeholder="Optional description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date" className="text-gray-300">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white mt-1 focus:border-cyan-400"
                    required
                  />
                </div>
                
                <div className="md:col-span-4 flex space-x-2">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Expense'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddExpense(false)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Expenses List */}
        <Card className="bg-gray-950 border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-300">
              Expenses for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No expenses found for this month.</p>
                <p className="text-sm">Start by adding your first expense!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-400 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"></div>
                      <div>
                        <h3 className="font-medium text-white">
                          {expense.description || 'Unnamed Expense'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {formatDate(expense.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">
                        {formatCurrency(expense.amount)}
                      </div>
                      <Badge variant="secondary" className="text-xs bg-cyan-400 text-black font-medium">
                        {expense.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}