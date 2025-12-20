import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { X, Table2 } from 'lucide-react';


export interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableCreated?: (tableName?: string) => void; // now passes table name
}

export function CreateTableModal({ isOpen, onClose, onTableCreated }: CreateTableModalProps) {
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(6);
  const [type, setType] = useState<'Standard' | 'VIP'>('Standard');
  const [spending, setSpending] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && seats > 0) {
      // POST to backend
      await fetch(`${API_BASE_URL}/api/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          seats,
          type,
          spending,
          confirmed,
          guests: []
        })
      });
      // Reset form
      setName('');
      setSeats(6);
      setType('Standard');
      setSpending(0);
      setConfirmed(false);
      if (onTableCreated) onTableCreated(name);
      // onClose will be called by parent for notification
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-purple-500/30 rounded-lg w-full max-w-md shadow-2xl shadow-purple-500/20 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <Table2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl text-white">Create New Table</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Table Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., VIP-1 or Table-3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Table Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'Standard' | 'VIP')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="Standard">Standard</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Number of Seats *
            </label>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value) || 0)}
              required
              min={2}
              max={20}
              placeholder="6"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Between 2 and 20 seats</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Expected Spending (€)
            </label>
            <input
              type="number"
              value={spending}
              onChange={(e) => setSpending(parseInt(e.target.value) || 0)}
              min={0}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="confirmed"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            <label htmlFor="confirmed" className="text-sm text-gray-400">
              Mark as confirmed
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              Create Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
