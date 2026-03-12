import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { FileText, Download, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export const Reports = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/financial-statements?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [period]);

  const downloadPDF = async (type: string, filename: string) => {
    try {
      const response = await fetch(`/api/report/pdf?type=${type}&filename=${filename}&period=${period}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading reports...</div>;
  if (!data || data.error) return <div className="p-8 text-center text-red-500 dark:text-red-400">Failed to load reports data. Please try again later.</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Profit & Loss, Balance Sheet, and Tax Computation</p>
        </div>
        <div className="relative">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 pl-10 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">All Time</option>
            <option value="q1">Q1 (Apr - Jun)</option>
            <option value="q2">Q2 (Jul - Sep)</option>
            <option value="q3">Q3 (Oct - Dec)</option>
            <option value="q4">Q4 (Jan - Mar)</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
            <option value="custom">Custom Date</option>
          </select>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profit & Loss Statement */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Profit & Loss
                </h2>
                <button 
                  onClick={() => downloadPDF('pnl', `Profit_Loss_${new Date().getFullYear()}.pdf`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                  <span className="font-medium text-green-600 dark:text-green-400">+ LKR {data.pl.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Employment Income</span>
                  <span className="font-medium text-green-600 dark:text-green-400">+ LKR {data.pl.annualSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Expenses</span>
                  <span className="font-medium text-red-600 dark:text-red-400">- LKR {data.pl.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Net Profit</span>
                  <span className={`font-bold ${data.pl.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                    LKR {data.pl.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Balance Sheet Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Balance Sheet
                </h2>
                <button 
                  onClick={() => downloadPDF('bs', `Balance_Sheet_${new Date().getFullYear()}.pdf`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Assets</span>
                  <span className="font-medium text-gray-900 dark:text-white">LKR {data.balanceSheet.totalAssets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Liabilities</span>
                  <span className="font-medium text-gray-900 dark:text-white">LKR {data.balanceSheet.totalLiabilities.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Total Equity</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    LKR {data.balanceSheet.equity.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tax Computation Report Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-indigo-900 dark:bg-indigo-950 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-300" />
                Tax Computation Report
              </h3>
              <p className="text-indigo-200 text-sm max-w-md">
                Download your full tax liability breakdown and computation tailored for the year.
              </p>
            </div>
            <button 
              onClick={() => downloadPDF('tax', `Tax_Computation_${new Date().getFullYear()}.pdf`)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-5 h-5" />
              Download Tax Report
            </button>
          </motion.div>

          {/* Detailed Breakdown */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">Recent Transactions in Period</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Description</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.pl.revenue.concat(data.pl.expenses).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{t.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{t.description || t.vendor}</td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${t.type === 'revenue' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'revenue' ? '+' : '-'} {t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Slips & Receipts */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Slips & Receipts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Download merged PDFs of all uploaded receipts and slips for the selected period.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => downloadPDF('revenue_slips', `Revenue_Slips_${new Date().getFullYear()}.pdf`)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
              >
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Revenue Slips</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">All merged revenue receipts</p>
                </div>
                <Download className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </button>

              <button 
                onClick={() => downloadPDF('expense_slips', `Expense_Slips_${new Date().getFullYear()}.pdf`)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
              >
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Expenses Slips</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">All merged expense receipts</p>
                </div>
                <Download className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </button>
            </div>
          </motion.div>

          {/* Official IRD Forms */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Official IRD Forms
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Download the official Inland Revenue Department offline forms for submission or record keeping.
            </p>
            
            <div className="space-y-3">
              <a 
                href="/forms/SET_2025_2026_E.pdf"
                download="SET_2025_2026_E.pdf"
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
              >
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">SET 2025/2026</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Statement of Estimated Tax</p>
                </div>
                <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </a>

              <a 
                href="/forms/SET_Schedule_25_26(Tax_Credit)_E.pdf"
                download="SET_Schedule_25_26(Tax_Credit)_E.pdf"
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
              >
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">SET Schedule (Credits)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tax Credit Declaration</p>
                </div>
                <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

