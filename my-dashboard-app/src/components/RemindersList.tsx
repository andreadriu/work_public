import React from 'react';
import { Bell, Trash2, Clock } from 'lucide-react';

export interface Reminder {
  id: string;
  note: string;
  time: string;
}


export function RemindersList() {
  const [reminders, setReminders] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('http://localhost:4000/api/reminders')
      .then(res => res.json())
      .then(data => setReminders(data));
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this reminder?')) {
      await fetch(`http://localhost:4000/api/reminders/${id}`, { method: 'DELETE' });
      setReminders(reminders.filter(r => r.id !== id));
    }
  };

  if (reminders.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg text-white">Reminders</h3>
        </div>
        <div className="text-center py-6">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No reminders set yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg text-white">Reminders</h3>
        <span className="text-sm text-gray-400">({reminders.length})</span>
      </div>
      <div className="space-y-2">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-start justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all group"
          >
            <div className="flex-1">
              <p className="text-white text-sm">{reminder.note}</p>
              <p className="text-xs text-gray-500 mt-1">{reminder.time}</p>
            </div>
            <button
              onClick={() => handleDelete(reminder.id)}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Delete reminder"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
