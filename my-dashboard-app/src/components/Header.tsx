import React from 'react';
import { Sparkles } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

export function Header({ activeTab, setActiveTab, onLogout, userEmail }: HeaderProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendees', label: 'Attendees' },
    { id: 'tables', label: 'Tables' },
    { id: 'statistics', label: 'Statistics' },
  ];

  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-50 neon-border">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/the_frame.jpeg" alt="Logo" className="w-8 h-8 object-contain rounded" />
            <div>
              <h1 className="text-2xl text-white tracking-tight" style={{ fontFamily: 'Orbitron, Audiowide, sans-serif', letterSpacing: '0.08em' }}>THE FRAME</h1>
              <p className="text-xs text-purple-400" style={{ fontFamily: 'Audiowide, Orbitron, sans-serif' }}>Event Manager</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <UserMenu onLogout={onLogout} userEmail={userEmail} />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex overflow-x-auto gap-2 pb-3 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}