import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Save, Calculator, Info } from 'lucide-react';

export const Salary = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salaryConfig, setSalaryConfig] = useState({
    basic_salary: '',
    allowances: '',
    deductions: ''
  });
  const [apitEstimate, setApitEstimate] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/salary')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSalaryConfig({
            basic_salary: data.basic_salary || '',
            allowances: data.allowances || '',
            deductions: data.deductions || ''
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basic_salary: Number(salaryConfig.basic_salary),
          allowances: Number(salaryConfig.allowances),
          deductions: Number(salaryConfig.deductions)
        })
      });
      // Recalculate estimate
      calculateEstimate();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const calculateEstimate = () => {
    const basic = Number(salaryConfig.basic_salary) || 0;
    const allowances = Number(salaryConfig.allowances) || 0;
    // Deductions might be non-cash benefits or relief, but let's assume simple deductions for now
    // Actually, for APIT, we tax Gross Income.
    // Gross = Basic + Allowances.
    // Relief = 100,000 per month.
    
    const monthlyGross = basic + allowances;
    const monthlyRelief = 100000; // Standard relief for 2025/26
    const taxableIncome = Math.max(0, monthlyGross - monthlyRelief);

    // Simple slab calculation for estimation (Monthly)
    // 0 - 41,667 @ 6%
    // Next 41,667 @ 12%
    // ...
    // This is a rough estimate. The backend has the full logic, but let's do a quick frontend estimate or fetch from backend?
    // Let's do a quick estimate here for immediate feedback.
    
    let tax = 0;
    let remaining = taxableIncome;
    const slab = 41666.67; // 500,000 / 12

    const rates = [0.06, 0.12, 0.18, 0.24, 0.30, 0.36];
    
    for (const rate of rates) {
      if (remaining <= 0) break;
      const taxableAmount = Math.min(remaining, slab);
      tax += taxableAmount * rate;
      remaining -= taxableAmount;
    }
    
    setApitEstimate(tax);
  };

  // Auto-calculate on load if data exists
  useEffect(() => {
    if (!loading) calculateEstimate();
  }, [loading, salaryConfig]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading salary details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Salary Income Setup</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Monthly Income Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic Salary (Monthly)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">LKR</span>
                <input
                  type="number"
                  value={salaryConfig.basic_salary}
                  onChange={e => setSalaryConfig({...salaryConfig, basic_salary: e.target.value})}
                  className="w-full pl-12 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fixed Allowances (Monthly)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">LKR</span>
                <input
                  type="number"
                  value={salaryConfig.allowances}
                  onChange={e => setSalaryConfig({...salaryConfig, allowances: e.target.value})}
                  className="w-full pl-12 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Includes transport, phone, housing, etc.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deductions (Monthly)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">LKR</span>
                <input
                  type="number"
                  value={salaryConfig.deductions}
                  onChange={e => setSalaryConfig({...salaryConfig, deductions: e.target.value})}
                  className="w-full pl-12 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Non-taxable deductions (if any)</p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configuration
              </button>
            </div>
          </div>
        </motion.div>

        {/* Estimation Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-gray-800 dark:to-gray-900 text-white p-6 rounded-2xl shadow-lg border border-transparent dark:border-gray-700"
        >
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            Estimated Tax Impact
          </h2>

          <div className="space-y-6">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-slate-300 mb-1">Total Monthly Gross Income</p>
              <p className="text-2xl font-bold">
                LKR {((Number(salaryConfig.basic_salary) || 0) + (Number(salaryConfig.allowances) || 0)).toLocaleString()}
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-slate-300 mb-1">Estimated Monthly APIT</p>
              <p className="text-3xl font-bold text-indigo-400">
                LKR {(apitEstimate || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                * This is an estimate based on standard tax slabs for 2025/2026. Actual tax may vary based on other income sources.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-indigo-500/20 rounded-lg text-sm text-indigo-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Your salary income will be automatically included in your total taxable income calculations on the Dashboard and Reports.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
