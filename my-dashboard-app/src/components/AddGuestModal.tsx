import React, { useState } from 'react';
import { X, Instagram, Phone, User } from 'lucide-react';


interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded?: (guestData: any) => void;
  guestToEdit?: any;
  onGuestUpdated?: (guestData: any) => void;
}

export function AddGuestModal({ isOpen, onClose, onGuestAdded, guestToEdit, onGuestUpdated }: AddGuestModalProps) {
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [age, setAge] = useState(25);

  React.useEffect(() => {
    if (guestToEdit) {
      setName(guestToEdit.name || '');
      setContactNumber(guestToEdit.contactNumber || '');
      setInstagram(guestToEdit.instagram || '');
      setConfirmed(guestToEdit.status === 'Confirmed' || guestToEdit.confirmed);
      setGender(guestToEdit.gender || 'Male');
      setAge(guestToEdit.age || 25);
    } else {
      setName('');
      setContactNumber('');
      setInstagram('');
      setConfirmed(false);
      setGender('Male');
      setAge(25);
    }
  }, [guestToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const guestData = {
      name,
      contactNumber,
      instagram,
      status: confirmed ? 'Confirmed' : 'Tentative',
      gender,
      age
    };
    try {
      if (guestToEdit && onGuestUpdated) {
        // Edit mode
        const res = await fetch(`http://localhost:4000/api/guests/${guestToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestData)
        });
        if (!res.ok) throw new Error('Failed to update guest');
        const updatedGuest = await res.json();
        onGuestUpdated(updatedGuest);
        onClose();
      } else if (onGuestAdded) {
        // Add mode
        const res = await fetch('http://localhost:4000/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestData)
        });
        if (!res.ok) throw new Error('Failed to add guest');
        const createdGuest = await res.json();
        onGuestAdded(createdGuest);
        // Reset form
        setName('');
        setContactNumber('');
        setInstagram('');
        setConfirmed(false);
        setGender('Male');
        setAge(25);
      }
    } catch (err) {
      alert('Error saving guest. Please try again.');
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
      <div className="relative bg-gray-900 border border-purple-500/30 rounded-lg w-full max-w-md shadow-2xl shadow-purple-500/20 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/30 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-xl text-white">{guestToEdit ? 'Edit Guest' : 'Add New Guest'}</h2>
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
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter guest name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Contact Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Instagram Handle (Optional)
            </label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Gender *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('Male')}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  gender === 'Male'
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Man
              </button>
              <button
                type="button"
                onClick={() => setGender('Female')}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  gender === 'Female'
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Woman
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Age *
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 18)}
              required
              min={18}
              max={99}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="confirmed"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            <label htmlFor="confirmed" className="text-sm text-gray-400">
              Mark as confirmed (otherwise will be set as tentative)
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
              {guestToEdit ? 'Save Changes' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
