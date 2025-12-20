import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { UserCheck, Table2, Clock } from 'lucide-react';
import { StatCard } from './StatCard';
import { CountdownTimer } from './CountdownTimer';


interface OverviewPanelProps {
  onAddGuest: (guestName?: string) => void;
  onCreateTable: (tableName?: string) => void;
  onSendReminder: (reminderMsg?: string) => void;
  refreshKey?: number;
  tablesRefreshKey?: number;
}

export function OverviewPanel({ onAddGuest, onCreateTable, onSendReminder, refreshKey, tablesRefreshKey }: OverviewPanelProps) {
  const [attendees, setAttendees] = React.useState<any[]>([]);
  const [tables, setTables] = React.useState<any[]>([]);
  const [notifications, setNotifications] = useState<{id: number, message: React.ReactNode, time: string}[]>(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        // Parse and revive message as string (will be rendered as string)
        return JSON.parse(stored).map((n: any) => ({ ...n, message: n.message }));
      } catch {
        return [];
      }
    }
    return [];
  });
  // const [showNotifications, setShowNotifications] = useState(true);


  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/guests`)
      .then(res => res.json())
      .then(data => setAttendees(data));
  }, [refreshKey]);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/tables`)
      .then(res => res.json())
      .then(data => setTables(data));
  }, [tablesRefreshKey]);


  // Persist notifications to localStorage whenever they change
  React.useEffect(() => {
    // Store as string for persistence (strip React nodes to string for storage)
    const toStore = notifications.map(n => ({
      ...n,
      message: typeof n.message === 'string'
        ? n.message
        : (React.isValidElement(n.message) && n.message.props && n.message.props.children
            ? (Array.isArray(n.message.props.children)
                ? n.message.props.children.map((c: any) => {
                    if (typeof c === 'string') return c;
                    if (React.isValidElement(c) && c.props && typeof c.props === 'object' && c.props !== null && Object.prototype.hasOwnProperty.call(c.props, 'children')) {
                      return (c.props as { children?: any }).children || '';
                    }
                    return '';
                  }).join('')
                : (typeof n.message.props.children === 'string' ? n.message.props.children : '')
          )
            : ''
        )
    }));
    localStorage.setItem('notifications', JSON.stringify(toStore));
  }, [notifications]);

  // Notification handlers with bolded names
  // Only used for Table/Reminder, not Add Guest (handled in App.tsx after guest is added)
  const handleCreateTable = (tableName?: string) => {
    setNotifications(n => [
      {
        id: Date.now(),
        message: tableName
          ? (<span>Table <span className="font-bold text-purple-400">{tableName}</span> created successfully.</span>)
          : 'Table created successfully.',
        time: new Date().toLocaleTimeString(),
      },
      ...n
    ]);
    onCreateTable(tableName);
  };
  const handleSendReminder = (reminderMsg?: string) => {
    setNotifications(n => [
      {
        id: Date.now(),
        message: reminderMsg
          ? (<span>Reminder set: <span className="font-bold text-emerald-400">{reminderMsg}</span></span>)
          : 'Reminder set successfully.',
        time: new Date().toLocaleTimeString(),
      },
      ...n
    ]);
    onSendReminder(reminderMsg);
  };

  // Clear all notifications
  // const handleClearNotifications = () => {
  //   setNotifications([]);
  //   localStorage.removeItem('notifications');
  // };

  const confirmedCount = attendees.filter(a => a.status === 'Confirmed').length;
  const tentativeCount = attendees.filter(a => a.status === 'Tentative').length;
  const reservedTablesCount = tables.filter(t => t.confirmed).length;

  const stats = [
    {
      title: 'Confirmed Guests',
      value: confirmedCount,
      icon: UserCheck,
      color: 'from-green-500 to-emerald-500',
      change: confirmedCount === 0 ? 'No guests yet' : `${confirmedCount} confirmed`
    },
    {
      title: 'Tentative',
      value: tentativeCount,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
      change: tentativeCount === 0 ? 'No pending' : `${tentativeCount} pending response`
    },
    {
      title: 'Tables Reserved',
      value: reservedTablesCount,
      icon: Table2,
      color: 'from-purple-500 to-pink-500',
      change: reservedTablesCount === 0 ? 'No tables yet' : `${reservedTablesCount} confirmed`
    },
  ];

  // Event date - January 30, 2026 at 10:00 PM
  const eventDate = new Date('2026-01-30T22:00:00');

  return (
    <div className="space-y-6">
      {/* Countdown Timer */}
      <CountdownTimer eventDate={eventDate} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions & Notifications */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg text-white">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <button 
            onClick={() => onAddGuest()}
            className="neon-btn py-3 text-lg font-bold tracking-widest"
            style={{ fontFamily: 'Orbitron, Audiowide, sans-serif', letterSpacing: '0.1em' }}
          >
            Add New Guest
          </button>
          <button 
            onClick={() => handleCreateTable()}
            className="neon-btn py-3 text-lg font-bold tracking-widest"
            style={{ fontFamily: 'Orbitron, Audiowide, sans-serif', letterSpacing: '0.1em' }}
          >
            Create Table
          </button>
          <button 
            onClick={() => handleSendReminder()}
            className="neon-btn py-3 text-lg font-bold tracking-widest"
            style={{ fontFamily: 'Orbitron, Audiowide, sans-serif', letterSpacing: '0.1em' }}
          >
            Set Reminder
          </button>
        </div>        
      </div>
    </div>
  );
}