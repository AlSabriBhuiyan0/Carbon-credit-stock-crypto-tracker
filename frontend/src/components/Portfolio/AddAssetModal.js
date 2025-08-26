import React, { useState, useEffect } from 'react';
import { X, Plus, Search, DollarSign, Calendar, Hash } from 'lucide-react';
import PortfolioService from '../../services/portfolioService';

const AddAssetModal = ({ 
  isOpen, 
  onClose, 
  assetType = 'stock', // 'stock' or 'carbon'
  onAssetAdded,
  title = 'Add Asset'
}) => {
  const [formData, setFormData] = useState({
    stockSymbol: '',
    creditId: '',
    projectName: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    projectType: '',
    region: ''
  });

  const [availableStocks, setAvailableStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && assetType === 'stock') {
      loadAvailableStocks();
    }
  }, [isOpen, assetType]);

  useEffect(() => {
    if (searchTerm && availableStocks.length > 0) {
      const filtered = availableStocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStocks(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredStocks([]);
    }
  }, [searchTerm, availableStocks]);

  const loadAvailableStocks = async () => {
    try {
      setLoading(true);
      const stocks = await PortfolioService.getAvailableStocks();
      setAvailableStocks(stocks);
    } catch (error) {
      console.error('Error loading available stocks:', error);
      setError('Failed to load available stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStockSelect = (stock) => {
    setFormData(prev => ({
      ...prev,
      stockSymbol: stock.symbol,
      purchasePrice: stock.current_price || stock.price || ''
    }));
    setSearchTerm(stock.symbol);
    setFilteredStocks([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (assetType === 'stock') {
        // Validate stock data
        if (!formData.stockSymbol || !formData.quantity || !formData.purchasePrice || !formData.purchaseDate) {
          throw new Error('Please fill in all required fields');
        }

        result = await PortfolioService.addStock({
          stockSymbol: formData.stockSymbol,
          quantity: parseFloat(formData.quantity),
          purchasePrice: parseFloat(formData.purchasePrice),
          purchaseDate: formData.purchaseDate
        });
      } else {
        // Validate carbon credit data
        if (!formData.creditId || !formData.projectName || !formData.quantity || !formData.purchasePrice || !formData.purchaseDate) {
          throw new Error('Please fill in all required fields');
        }

        result = await PortfolioService.addCarbonCredit({
          creditId: formData.creditId,
          projectName: formData.projectName,
          quantity: parseFloat(formData.quantity),
          purchasePrice: parseFloat(formData.purchasePrice),
          purchaseDate: formData.purchaseDate,
          projectType: formData.projectType,
          region: formData.region
        });
      }

      // Reset form and close modal
      setFormData({
        stockSymbol: '',
        creditId: '',
        projectName: '',
        quantity: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        projectType: '',
        region: ''
      });
      
      onAssetAdded(result);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      stockSymbol: '',
      creditId: '',
      projectName: '',
      quantity: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      projectType: '',
      region: ''
    });
    setError('');
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {assetType === 'stock' ? (
            // Stock Form
            <>
              {/* Stock Symbol Search */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Stock Symbol *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="stockSymbol"
                    value={formData.stockSymbol}
                    onChange={handleInputChange}
                    placeholder="e.g., AAPL"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                {/* Stock Search Results */}
                {searchTerm && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => handleStockSelect(stock)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-gray-600">{stock.name}</div>
                        <div className="text-sm text-gray-500">
                          ${stock.current_price || stock.price || 'N/A'}
                        </div>
                      </div>
                    ))}
                    {filteredStocks.length === 0 && searchTerm && (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No stocks found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            // Carbon Credit Form
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Credit ID *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="creditId"
                    value={formData.creditId}
                    onChange={handleInputChange}
                    placeholder="e.g., CC-2024-001"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  placeholder="e.g., Solar Farm Project"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Project Type
                  </label>
                  <input
                    type="text"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    placeholder="e.g., Solar"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Region
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder="e.g., California"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Purchase Price *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Purchase Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus size={20} className="mr-2" />
                  Add {assetType === 'stock' ? 'Stock' : 'Carbon Credit'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;
