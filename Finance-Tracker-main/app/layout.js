import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FinTracker - Personal Finance & Expense Tracker',
  description: 'Track your expenses, analyze spending patterns, and take control of your finances with FinTracker.',
  keywords: 'finance, expense tracker, budget, money management, personal finance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-gray-900 text-white`}>
        {children}
      </body>
    </html>
  );
}