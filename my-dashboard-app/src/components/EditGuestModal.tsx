import React, { useState } from 'react';

export function EditGuestModal({ isOpen, onClose, guest, onGuestUpdated }: {
  isOpen: boolean;
  onClose: () => void;
  guest: any;
  onGuestUpdated: (updatedGuest: any) => void;
}) {
  const [form, setForm] = useState({ ...guest });

  React.useEffect(() => {
    setForm({ ...guest });
  }, [guest]);

  if (!isOpen || !guest) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:4000/api/guests/${guest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const updated = await res.json();
    onGuestUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl text-white mb-4">Edit Guest</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={form.name || ''} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Name" required />
          <input name="contactNumber" value={form.contactNumber || ''} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Contact Number" />
          <input name="instagram" value={form.instagram || ''} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Instagram" />
          <select name="status" value={form.status || ''} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white">
            <option value="Confirmed">Confirmed</option>
            <option value="Tentative">Tentative</option>
          </select>
          <input name="gender" value={form.gender || ''} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Gender" />
          <input name="age" type="number" value={form.age || ''} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Age" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
