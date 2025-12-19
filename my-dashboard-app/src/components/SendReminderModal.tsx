import React, { useState } from 'react';
import { X, Bell, Clock, Trash2 } from 'lucide-react';
// import { Reminder } from './RemindersList';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReminderSet?: (reminderMsg: string) => void;
}

export function SendReminderModal({ isOpen, onClose, onReminderSet }: SendReminderModalProps) {
  const [note, setNote] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('http://localhost:4000/api/reminders')
      .then(res => res.json())
      .then(data => setReminders(data));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      // POST to backend
      await fetch('http://localhost:4000/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: note, date: new Date().toISOString() })
      });
      if (onReminderSet) onReminderSet(note);
      setNote('');
      // Refresh reminders
      fetch('http://localhost:4000/api/reminders')
        .then(res => res.json())
        .then(data => setReminders(data));
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
      <div className="relative bg-gray-900 border border-purple-500/30 rounded-lg w-full max-w-2xl shadow-2xl shadow-purple-500/20 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/30 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl text-white">Set Reminder</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Reminder Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                placeholder="Enter reminder message..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              Add Reminder
            </button>
          </form>

          {/* Reminders List */}
          <div className="border-t border-purple-500/30 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg text-white">Active Reminders</h3>
              <span className="text-sm text-gray-400">({reminders.length})</span>
            </div>

            {reminders.length === 0 ? (
              <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No reminders set yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-start justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all group"
                  >
                    <div className="flex-1">
                      <p className="text-white text-sm">{reminder.message || reminder.note}</p>
                      <p className="text-xs text-gray-500 mt-1">{reminder.date || reminder.time}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this reminder?')) {
                          await fetch(`http://localhost:4000/api/reminders/${reminder.id}`, { method: 'DELETE' });
                          setReminders(reminders.filter(r => r.id !== reminder.id));
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
