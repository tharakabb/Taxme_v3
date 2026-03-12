import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Calendar, Info, Clock, FileText } from 'lucide-react';
import { FinancialCharts } from '../components/FinancialCharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tax-summary')
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading dashboard...</div>;
  if (!summary || summary.error) return <div className="p-8 text-center text-red-500 dark:text-red-400">Failed to load dashboard data. Please try again later.</div>;

  const isBusiness = user?.user_type !== 'personal';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isBusiness ? 'Business Overview' : 'Tax Health Summary'}
        </h1>
        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium capitalize">
          YA 2025/2026
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Income/Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                LKR {(summary.revenue + summary.assetIncome + (summary.salaryIncome || 0)).toLocaleString()}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Expenses</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                LKR {summary.expenses.toLocaleString()}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Net Profit / Taxable</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                LKR {summary.netProfit.toLocaleString()}
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Financial Charts */}
      <FinancialCharts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Liability Section */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-violet-950 rounded-3xl p-8 text-white relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Estimated Tax Liability</h2>
                <p className="text-indigo-200 dark:text-indigo-300">Based on current financial data for YA 2025/2026</p>
                
                <div className="mt-6 flex items-center gap-4">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg">
                    <span className="text-sm text-indigo-200 dark:text-indigo-300 block">Effective Rate</span>
                    <span className="text-xl font-bold">{summary.tax.effectiveRate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg">
                    <span className="text-sm text-indigo-200 dark:text-indigo-300 block">Relief Used</span>
                    <span className="text-xl font-bold">
                      {user?.user_type === 'pvt_ltd' ? 'N/A' : 'LKR 1.8M'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center md:text-right bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                <p className="text-sm text-indigo-200 dark:text-indigo-300 font-medium mb-1">Total Tax Due</p>
                <h3 className="text-4xl font-bold tracking-tight">
                  LKR {summary.tax.taxLiability.toLocaleString()}
                </h3>
              </div>
            </div>
            
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl" />
          </motion.div>

          {/* Installment Breakdown */}
          {summary.tax.taxLiability > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Quarterly Installment Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summary.installments.map((inst: any, idx: number) => (
                  <div key={idx} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">{inst.period}</p>
                    <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">LKR {inst.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Installments are due on the 15th of August, November, February, and May.
              </p>
            </div>
          )}

          {/* Tax Slabs Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tax Slabs Breakdown</h3>
            <div className="space-y-4">
              {summary.tax.slabs && summary.tax.slabs.length > 0 ? (
                summary.tax.slabs.map((slab: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{slab.rate}% Slab</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">On LKR {slab.amount.toLocaleString()}</p>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">LKR {slab.tax.toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {summary.tax.taxLiability === 0 
                    ? "No tax liability (Income below relief threshold)" 
                    : "Standard Corporate Tax Rate Applied (30%)"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Calendar & Info */}
        <div className="space-y-6">
          {/* Tax Calendar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tax Calendar
            </h3>
            <div className="space-y-4">
              {summary.calendar.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    {idx !== summary.calendar.length - 1 && <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.date}</p>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">{item.event}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filing Deadline Info */}
          <div className="bg-indigo-900 dark:bg-indigo-950 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Filing Deadline
            </h3>
            <p className="text-sm text-indigo-200 dark:text-indigo-300 mb-4">
              The final annual Return of Income must be submitted by November 30th following the end of the assessment year.
            </p>
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <p className="text-xs font-bold uppercase text-indigo-300 mb-1">Next Deadline</p>
              <p className="text-lg font-bold">Nov 30, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

