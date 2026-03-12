import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Upload, Trash2, Search, Filter, Check, X, FileText, Edit2 } from 'lucide-react';

export const Transactions = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    amount: '',
    type: 'expense',
    category: '',
    description: ''
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'expense'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const manualFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.error('Expected array of transactions, got:', data);
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.vendor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const filterCategories = Array.from(new Set([
    ...categories.filter(c => filterType === 'all' || c.type === filterType).map(c => c.name),
    ...transactions.filter(t => filterType === 'all' || t.type === filterType).map(t => t.category)
  ].filter(Boolean)));

  const formCategories = Array.from(new Set([
    ...categories.filter(c => c.type === formData.type).map(c => c.name),
    ...transactions.filter(t => t.type === formData.type).map(t => t.category)
  ].filter(Boolean)));

  const handleEdit = (transaction: any) => {
    setEditingId(transaction.id);
    setFormData({
      date: transaction.date,
      vendor: transaction.vendor || '',
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category || '',
      description: transaction.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('date', formData.date);
      submitData.append('vendor', formData.vendor);
      submitData.append('amount', formData.amount);
      submitData.append('type', formData.type);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      if (selectedFile) {
        submitData.append('receipt', selectedFile);
      }

      const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: submitData
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchTransactions();
        fetchCategories();
        setFormData({
          date: new Date().toISOString().split('T')[0],
          vendor: '',
          amount: '',
          type: 'expense',
          category: '',
          description: ''
        });
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategoryId ? `/api/categories/${editingCategoryId}` : '/api/categories';
      const method = editingCategoryId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData)
      });

      if (res.ok) {
        setIsCategoryModalOpen(false);
        setEditingCategoryId(null);
        setCategoryFormData({ name: '', type: 'expense' });
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      name: category.name,
      type: category.type
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure? This will not delete transactions in this category but will remove it from the list.')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your revenue and expenses</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Categories
            </button>
          </div>

          {activeTab === 'transactions' ? (
            <>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendor or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Types</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Categories</option>
                {filterCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor/Source</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Receipt</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">No transactions found matching your filters.</td></tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{t.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{t.vendor || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                            {t.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            t.type === 'revenue' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}>
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${
                          t.type === 'revenue' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {t.type === 'revenue' ? '+' : '-'} LKR {t.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {t.receipt_url ? (
                            <a 
                              href={t.receipt_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium flex items-center justify-end gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(t)}
                              className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(t.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Categories Section */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['revenue', 'expense'].map(type => (
            <div key={type} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white capitalize">{type} Categories</h3>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                  {categories.filter(c => c.type === type).length} Total
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {categories.filter(c => c.type === type).length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No {type} categories yet.</div>
                ) : (
                  categories.filter(c => c.type === type).map(cat => (
                    <div key={cat.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditCategory(cat)}
                          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setSelectedFile(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    vendor: '',
                    amount: '',
                    type: 'expense',
                    category: '',
                    description: ''
                  });
                }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="revenue">Revenue</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input 
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor / Source</label>
                  <input 
                    type="text"
                    required
                    value={formData.vendor}
                    onChange={e => setFormData({...formData, vendor: e.target.value})}
                    placeholder="e.g. Keells, Client X"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (LKR)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input 
                      type="text"
                      list="categories"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <datalist id="categories">
                      {formCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea 
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt / Document (Optional)</label>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => manualFileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {selectedFile ? selectedFile.name : 'Choose file...'}
                    </button>
                    {selectedFile && (
                      <button 
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input 
                    type="file"
                    ref={manualFileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                      setSelectedFile(null);
                      setFormData({
                        date: new Date().toISOString().split('T')[0],
                        vendor: '',
                        amount: '',
                        type: 'expense',
                        category: '',
                        description: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
                  >
                    {editingId ? 'Update Transaction' : 'Save Transaction'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Category Add/Edit Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white">{editingCategoryId ? 'Edit Category' : 'Add Category'}</h3>
                <button onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategoryId(null);
                  setCategoryFormData({ name: '', type: 'expense' });
                }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                  <input 
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    placeholder="e.g. Office Supplies"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select 
                    value={categoryFormData.type}
                    onChange={e => setCategoryFormData({...categoryFormData, type: e.target.value as 'revenue' | 'expense'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      setEditingCategoryId(null);
                      setCategoryFormData({ name: '', type: 'expense' });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
                  >
                    {editingCategoryId ? 'Update Category' : 'Save Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
