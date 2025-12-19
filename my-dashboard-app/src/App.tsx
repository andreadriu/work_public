import { useState } from 'react';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { OverviewPanel } from './components/OverviewPanel';
import { AttendeesSection } from './components/AttendeesSection';
import { TablesSection } from './components/TablesSection';
import { StatisticsPanel } from './components/StatisticsPanel';

import { AddGuestModal } from './components/AddGuestModal';
import { CreateTableModal } from './components/CreateTableModal';
import { SendReminderModal } from './components/SendReminderModal';

import { toast, Toaster } from 'sonner';

// Authorized users
const AUTHORIZED_USERS = [
  { username: 'andreadriutti', password: 'frutta' },
  { username: 'erostrupia', password: 'subysur' },
  { username: 'andreaboribello', password: 'house' },
  { username: 'marcogagliano', password: 'gallo' },
];

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // App state
  const [activeTab, setActiveTab] = useState<string>('overview');
  // Modal states
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false);
  // Refresh keys for attendees and tables
  const [attendeesRefreshKey, setAttendeesRefreshKey] = useState(0);
  const [tablesRefreshKey, setTablesRefreshKey] = useState(0);

  // Login handler with restricted access
  const handleLogin = (username: string, password: string) => {
    const user = AUTHORIZED_USERS.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      setIsAuthenticated(true);
      setUserEmail(username);
      toast.success(`Welcome back, ${username}!`);
    } else {
      toast.error('Invalid username or password');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    toast.info('You have been logged out');
  };

  // Toast notification helpers
  const showToast = (message: string) => {
      toast.custom(() => (
      <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 border-2 border-pink-400/40">
        <span className="font-bold text-lg">🎉</span>
        <span className="text-md font-semibold" dangerouslySetInnerHTML={{__html: message}} />
      </div>
    ), { duration: 3000 });
  };

  // Enhanced handlers to pass info for notifications and toasts
  const handleAddGuest = (guestName: string) => {
    setAttendeesRefreshKey(k => k + 1); // Always refresh attendees
    setTablesRefreshKey(k => k + 1); // Also refresh tables in case guest is assigned to a table
    showToast(`Guest <b>${guestName}</b> added!`);
  };
  const handleCreateTable = (tableName: string) => {
    setTablesRefreshKey(k => k + 1);
    showToast(`Table <b>${tableName}</b> created!`);
  };
  const handleSendReminder = (reminderMsg: string) => {
    showToast(`Reminder set: <b>${reminderMsg}</b>`);
  };
  const handleGuestRemoved = () => setAttendeesRefreshKey(k => k + 1);

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col">
      <Toaster position="top-right" richColors />
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <LoginForm onLogin={handleLogin} />
        </div>
      ) : (
        <>
          <Header 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            userEmail={userEmail}
          />
          <main className="flex-1 w-full px-4 py-6 flex flex-col">
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center">
              {activeTab === 'overview' && (
                <OverviewPanel 
                  onAddGuest={() => setIsAddGuestModalOpen(true)}
                  onCreateTable={() => setIsCreateTableModalOpen(true)}
                  onSendReminder={() => setIsReminderModalOpen(true)}
                  refreshKey={attendeesRefreshKey}
                  tablesRefreshKey={tablesRefreshKey}
                />
              )}
              {activeTab === 'attendees' && <AttendeesSection refreshKey={attendeesRefreshKey} onGuestRemoved={handleGuestRemoved} />}
              {activeTab === 'tables' && <TablesSection tablesRefreshKey={tablesRefreshKey} onTableChanged={() => setTablesRefreshKey(k => k + 1)} />}
              {activeTab === 'statistics' && <StatisticsPanel />}
            </div>
          </main>
          {/* Modals */}
          <AddGuestModal 
            isOpen={isAddGuestModalOpen} 
            onClose={() => setIsAddGuestModalOpen(false)}
            onGuestAdded={(guestData) => {
              setIsAddGuestModalOpen(false);
              handleAddGuest(guestData.name ?? '');
            }}
          />
          {/* CreateTableModal for quick action */}
          <CreateTableModal 
            isOpen={isCreateTableModalOpen} 
            onClose={() => setIsCreateTableModalOpen(false)}
            onTableCreated={(tableName) => {
              setIsCreateTableModalOpen(false);
              handleCreateTable(tableName ?? '');
            }}
          />
          <SendReminderModal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} onReminderSet={(reminderMsg) => handleSendReminder(reminderMsg ?? '')} />
        </>
      )}
    </div>
  );
}