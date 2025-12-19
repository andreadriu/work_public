import React, { useState } from 'react';
import { AddGuestModal } from './AddGuestModal';

import { Users, Crown, Instagram, Plus, Table2, Trash2, Pencil } from 'lucide-react';
import { EditGuestModal } from './EditGuestModal';
import { CreateTableModal } from './CreateTableModal';
const EditTableModal = React.lazy(() => import('./EditTableModal').then(m => ({ default: m.EditTableModal })));




export function TablesSection({ tablesRefreshKey, onTableChanged }: { tablesRefreshKey?: number, onTableChanged?: () => void }) {
  const [tables, setTables] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [addGuestTableId, setAddGuestTableId] = useState<string | null>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [isEditGuestModalOpen, setIsEditGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any | null>(null);
  const handleEditGuest = (guest: any) => {
    setEditingGuest(guest);
    setIsEditGuestModalOpen(true);
  };

  const handleGuestUpdated = (updatedGuest: any) => {
    setAttendees(attendees => attendees.map(a => a.id === updatedGuest.id ? updatedGuest : a));
    setLocalRefreshKey(k => k + 1);
    if (onTableChanged) onTableChanged();
  };

  React.useEffect(() => {
    fetch('http://localhost:4000/api/tables')
      .then(res => res.json())
      .then(data => setTables(data));
    fetch('http://localhost:4000/api/guests')
      .then(res => res.json())
      .then(data => setAttendees(data));
  }, [tablesRefreshKey, localRefreshKey]);

  const getAttendeeById = (id: string) => {
    // Debug log to help diagnose ID mismatches
    // eslint-disable-next-line no-console
    console.log('Looking for guestId:', id, 'in attendees:', attendees.map(a => a.id));
    return attendees.find(a => String(a.id) === String(id));
  };

  const formatSpending = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };


  // Remove a table
  const onRemoveTable = async (tableId: string) => {
    await fetch(`http://localhost:4000/api/tables/${tableId}`, {
      method: 'DELETE',
    });
    setLocalRefreshKey(k => k + 1);
    if (onTableChanged) onTableChanged();
  };

  // Remove a guest from a table and delete from attendees (assignee panel)
  const onRemovePersonFromTable = async (tableId: string, guestId: string) => {
    // Remove guest from table
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const updatedGuests = table.guests.filter((id: string) => id !== guestId);
    await fetch(`http://localhost:4000/api/tables/${tableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guests: updatedGuests })
    });
    // Delete guest from backend (removes from attendees/assignee panel)
    await fetch(`http://localhost:4000/api/guests/${guestId}`, {
      method: 'DELETE'
    });
    // Refresh both tables and attendees
    const [tablesRes, guestsRes] = await Promise.all([
      fetch('http://localhost:4000/api/tables'),
      fetch('http://localhost:4000/api/guests')
    ]);
    setTables(await tablesRes.json());
    setAttendees(await guestsRes.json());
    setLocalRefreshKey(k => k + 1);
    if (onTableChanged) onTableChanged();
  };

  // Open Add Guest modal for a table
  const onOpenAddGuest = (tableId: string) => {
    setAddGuestTableId(tableId);
    setIsAddGuestModalOpen(true);
  };

  // Add guest to table handler (used by AddGuestModal)
  const handleAddGuestToTable = async (guestData: any) => {
    // 1. Add guest to backend (returns existing or new guest)
    const res = await fetch('http://localhost:4000/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestData)
    });
    const guest = await res.json();
    // 2. If adding to a table, PATCH the table's guests array, but only if not already present
    if (addGuestTableId) {
      const table = tables.find(t => t.id === addGuestTableId);
      const currentGuests = table?.guests || [];
      const updatedGuests = currentGuests.includes(guest.id) ? currentGuests : [...currentGuests, guest.id];
      await fetch(`http://localhost:4000/api/tables/${addGuestTableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: updatedGuests })
      });
    }
    // Always reload tables and attendees after adding a guest
    const [tablesRes, guestsRes] = await Promise.all([
      fetch('http://localhost:4000/api/tables'),
      fetch('http://localhost:4000/api/guests')
    ]);
    setTables(await tablesRes.json());
    setAttendees(await guestsRes.json());
    setIsAddGuestModalOpen(false);
    setAddGuestTableId(null);
    if (onTableChanged) onTableChanged();
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Table Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-white">Tables Management</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Table
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-12 text-center">
          <Table2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No tables created yet</p>
          <p className="text-gray-500 text-sm mb-4">Start by creating your first table</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
          >
            Create First Table
          </button>
        </div>
      ) : (
        <>
          {/* VIP Tables */}
          {tables.some(t => t.type === 'VIP') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xl text-white">VIP Tables</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables
                  .filter(table => table.type === 'VIP')
                  .map((table) => (
                    <div
                      key={table.id}
                      className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/50 rounded-lg p-5 hover:border-purple-500/80 transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/20"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-white text-lg">{table.name}</h4>
                          <p className="text-sm text-purple-300">
                            {table.guests.length} / {table.seats} seats
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-yellow-500" />
                          <button
                            onClick={() => { setEditingTable(table); setIsEditModalOpen(true); }}
                            className="p-2 text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Edit table"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove table ${table.name}?`)) {
                                onRemoveTable(table.id);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove table"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Guest List */}
                      <div className="mb-4">
                        {table.guests.length > 0 ? (
                          <ul className="space-y-1">
                            {table.guests.map((guestId: string) => {
                              const guest = getAttendeeById(guestId);
                              if (!guest) return null;
                              return (
                                <li key={guestId} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-1">
                                  <span className="text-white text-sm">{guest.name}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditGuest(guest)}
                                      className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                      title={`Edit ${guest.name}`}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => onRemovePersonFromTable(table.id, guestId)}
                                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                      title={`Remove ${guest.name} from table`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No guests assigned</p>
                        )}
                      </div>

                      {/* Spending */}
                      <div className="mb-4 bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Spending</span>
                          <div className="flex items-center gap-1 text-green-400">
                            <span className="text-sm">{formatSpending(table.spending)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Confirmed Status */}
                      <div className="mb-4">
                        <span className={`inline-block text-xs px-3 py-1 rounded-full ${
                          table.confirmed 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {table.confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                            style={{ width: `${(table.guests.length / table.seats) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Guests */}
                      <div className="space-y-2">
                        {table.guests.map((guestId: string) => {
                          const guest = getAttendeeById(guestId);
                          if (!guest) return null;
                          return (
                            <div
                              key={guestId}
                              className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg group hover:bg-gray-800 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white">
                                  {guest.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <span className="text-sm text-white">{guest.name}</span>
                              </div>
                              <a
                                href={`https://instagram.com/${guest.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                              >
                                <Instagram className="w-4 h-4" />
                              </a>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditGuest(guest)}
                                  className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                  title={`Edit ${guest.name}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onRemovePersonFromTable(table.id, guestId)}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Remove from table"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                                  <EditGuestModal
                                    isOpen={isEditGuestModalOpen}
                                    onClose={() => { setIsEditGuestModalOpen(false); setEditingGuest(null); }}
                                    guest={editingGuest}
                                    onGuestUpdated={handleGuestUpdated}
                                  />
                            </div>
                          );
                        })}
                        {table.guests.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">No guests assigned</p>
                        )}
                      </div>

                      {/* Add Guest Button */}
                      {table.guests.length < table.seats && (
                        <button
                          onClick={() => onOpenAddGuest(table.id)}
                          className="w-full mt-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Guest
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Standard Tables */}
          {tables.some(t => t.type === 'Standard') && (
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-500" />
                <h3 className="text-xl text-white">Standard Tables</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables
                  .filter(table => table.type === 'Standard')
                  .map((table) => (
                    <div
                      key={table.id}
                      className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white">{table.name}</h4>
                          <p className="text-sm text-gray-400">
                            {table.guests.length} / {table.seats} seats
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <button
                            onClick={() => { setEditingTable(table); setIsEditModalOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                            title="Edit table"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove table ${table.name}?`)) {
                                onRemoveTable(table.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Remove table"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Spending */}
                      <div className="mb-3 bg-gray-700/30 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Spending</span>
                          <span className="text-xs text-green-400">{formatSpending(table.spending)}</span>
                        </div>
                      </div>

                      {/* Confirmed Status */}
                      <div className="mb-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                          table.confirmed 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {table.confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(table.guests.length / table.seats) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Guests */}
                      <div className="space-y-1.5">
                        {table.guests.map((guestId: string) => {
                          const guest = getAttendeeById(guestId);
                          if (!guest) return null;
                          return (
                            <div
                              key={guestId}
                              className="flex items-center justify-between p-1.5 bg-gray-700/30 rounded group hover:bg-gray-700/50 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs text-white">
                                  {guest.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <span className="text-xs text-white">{guest.name}</span>
                              </div>
                              <a
                                href={`https://instagram.com/${guest.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <Instagram className="w-3 h-3" />
                              </a>
                              <button
                                onClick={() => onRemovePersonFromTable(table.id, guestId)}
                                className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Remove from table"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                        {table.guests.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-2">Empty table</p>
                        )}
                      </div>

                      {/* Add Guest Button */}
                      {table.guests.length < table.seats && (
                        <button
                          onClick={() => onOpenAddGuest(table.id)}
                          className="w-full mt-2 bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-1.5 rounded text-xs transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Guest
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Guest Modal for Table */}
      <AddGuestModal
        isOpen={isAddGuestModalOpen}
        onClose={() => { setIsAddGuestModalOpen(false); setAddGuestTableId(null); }}
        onGuestAdded={handleAddGuestToTable}
      />
      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTableCreated={() => {
          setIsCreateModalOpen(false);
          if (onTableChanged) onTableChanged();
        }}
      />
      <React.Suspense fallback={null}>
        <EditTableModal
          isOpen={isEditModalOpen}
          onClose={() => { setEditingTable(null); setIsEditModalOpen(false); }}
          table={editingTable}
          onTableUpdated={() => {
            setEditingTable(null);
            setIsEditModalOpen(false);
            if (onTableChanged) onTableChanged();
          }}
        />
      </React.Suspense>
    </div>
  );
}