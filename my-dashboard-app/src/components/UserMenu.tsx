import { useState, useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';

interface UserMenuProps {
  onLogout: () => void;
  userEmail?: string;
}

export function UserMenu({ onLogout, userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
      >
        <User className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-purple-500/30 rounded-lg shadow-2xl shadow-purple-500/20 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          {userEmail && (
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-sm text-gray-400">Signed in as</p>
              <p className="text-white text-sm truncate">{userEmail}</p>
            </div>
          )}

          {/* Menu Items removed: Share Dashboard */}

          {/* Logout */}
          <div className="border-t border-gray-800 py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
