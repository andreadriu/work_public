import React, { useState } from 'react';
import { X, Share2, Mail, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (emails: string[]) => void;
}

export function ShareDashboardModal({ isOpen, onClose, onShare }: ShareDashboardModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [shareLink] = useState('https://theframe.app/dashboard/share/abc123'); // Mock share link

  if (!isOpen) return null;

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length > 0) {
      onShare(validEmails);
      setEmails(['']);
      onClose();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied to clipboard!');
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
            <Share2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl text-white">Share Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          {/* Email Invites */}
          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-gray-400 mb-2">
              Invite by Email
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="Enter email address"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddEmail}
              className="mt-3 text-purple-400 hover:text-purple-300 text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another email
            </button>

            <div className="flex gap-3 pt-6">
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
                Send Invites
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}