import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, X, Landmark, Car, TrendingUp, Home } from 'lucide-react';

export const Assets = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'property',
    value: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    income_generated: ''
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssets(data);
      } else {
        console.error('Expected array of assets, got:', data);
        setAssets([]);
      }
    } catch (err) {
      console.error(err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          income_generated: formData.income_generated ? parseFloat(formData.income_generated) : 0
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchAssets();
        setFormData({
          name: '',
          type: 'property',
          value: '',
          acquisition_date: new Date().toISOString().split('T')[0],
          income_generated: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      setAssets(assets.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'property': return <Home className="w-5 h-5 text-blue-500" />;
      case 'vehicle': return <Car className="w-5 h-5 text-orange-500" />;
      case 'investment': return <TrendingUp className="w-5 h-5 text-green-500" />;
      default: return <Landmark className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-500">Track your properties, vehicles, and investments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500">
            No assets found. Add your first asset to track its value.
          </div>
        ) : (
          assets.map((asset) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  {getIcon(asset.type)}
                </div>
                <button 
                  onClick={() => handleDelete(asset.id)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1">{asset.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">{asset.type}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Value</span>
                  <span className="font-medium text-gray-900">LKR {asset.value.toLocaleString()}</span>
                </div>
                {asset.income_generated > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Income (YTD)</span>
                    <span className="font-medium text-green-600">+ LKR {asset.income_generated.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Acquired</span>
                  <span className="text-gray-900">{asset.acquisition_date}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-gray-900">Add Asset</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Colombo Apartment"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="property">Property</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (LKR)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                    <input 
                      type="date"
                      required
                      value={formData.acquisition_date}
                      onChange={e => setFormData({...formData, acquisition_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Income (Optional)</label>
                    <input 
                      type="number"
                      min="0"
                      placeholder="e.g. Rent"
                      value={formData.income_generated}
                      onChange={e => setFormData({...formData, income_generated: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                  >
                    Save Asset
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
