import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config';
import { Search, Filter, Download, Instagram, CheckCircle, Clock, Users, Trash2, Pencil, Upload } from 'lucide-react';
// Type for parsed Excel row
type AssigneeRow = {
  name: string;
  instagram: string;
  table: string;
  status: string;
  gender: string;
  age: number | null;
};
import { AddGuestModal } from './AddGuestModal';

interface AttendeesSectionProps {
  refreshKey?: number;
  onGuestRemoved?: () => void;
}

export function AttendeesSection({ refreshKey, onGuestRemoved }: AttendeesSectionProps) {
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
      // Helper: Show notification (replace with your toast/notification system if available)
      function notify(msg: string) {
        window.alert(msg);
      }
      // Helper: Parse Excel file into AssigneeRow[]
      function parseExcelFile(file: File): Promise<AssigneeRow[]> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const data = evt.target?.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheet = workbook.Sheets[workbook.SheetNames[0]];
              const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
              const [header, ...body] = rows;
              if (!header || header.length < 6) return reject('Invalid file format: missing columns.');
              const colMap = {
                name: header.findIndex((h: string) => h.toLowerCase() === 'name'),
                instagram: header.findIndex((h: string) => h.toLowerCase() === 'instagram'),
                table: header.findIndex((h: string) => h.toLowerCase() === 'table'),
                status: header.findIndex((h: string) => h.toLowerCase() === 'status'),
                gender: header.findIndex((h: string) => h.toLowerCase() === 'gender'),
                age: header.findIndex((h: string) => h.toLowerCase() === 'age'),
              };
              if (Object.values(colMap).some(idx => idx === -1)) return reject('Missing required columns.');
              const result: AssigneeRow[] = body.map(row => ({
                name: row[colMap.name]?.toString().trim() || '',
                instagram: row[colMap.instagram]?.toString().trim() || '',
                table: row[colMap.table]?.toString().trim() || '',
                status: row[colMap.status]?.toString().trim() || '',
                gender: row[colMap.gender]?.toString().trim() || '',
                age: row[colMap.age] ? Number(row[colMap.age]) : null,
              }));
              resolve(result);
            } catch (err) {
              reject('Failed to parse file.');
            }
          };
          reader.readAsBinaryString(file);
        });
      }
      // Helper: Import assignees, create tables if needed, assign guests
      async function importAssignees(rows: AssigneeRow[]) {
        setImporting(true);
        setImportError(null);
        try {
          // Fetch current tables
          const tablesRes = await fetch(`${API_BASE_URL}/api/tables`);
          const tables = await tablesRes.json();
          const tableMap = new Map((tables || []).map((t: any) => [t.name.toLowerCase(), t]));
          const errors: string[] = [];
          for (const [i, row] of rows.entries()) {
            // Validation
            if (!row.name) { errors.push(`Row ${i+2}: Name is required.`); continue; }
            if (!['Confirmed', 'Tentative'].includes(row.status)) { errors.push(`Row ${i+2}: Invalid status.`); continue; }
            if (row.age !== null && (isNaN(row.age) || row.age < 0)) { errors.push(`Row ${i+2}: Invalid age.`); continue; }
            // Table logic
            let tableId: string | undefined;
            let tableObj: any = undefined;
            if (row.table && row.table !== 'Unassigned') {
              tableObj = tableMap.get(row.table.toLowerCase());
              if (!tableObj) {
                // Create table
                const res = await fetch(`${API_BASE_URL}/api/tables`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: row.table, seats: 6, type: 'Standard', confirmed: true, guests: [] }),
                });
                if (!res.ok) { errors.push(`Row ${i+2}: Failed to create table "${row.table}".`); continue; }
                tableObj = await res.json();
                tableMap.set(row.table.toLowerCase(), tableObj);
              }
              tableId = tableObj.id;
            }
            // Create guest
            const guestRes = await fetch(`${API_BASE_URL}/api/guests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: row.name,
                instagram: row.instagram,
                status: row.status,
                gender: row.gender,
                age: row.age,
                confirmed: row.status === 'Confirmed',
              }),
            });
            if (!guestRes.ok) { errors.push(`Row ${i+2}: Failed to create guest "${row.name}".`); continue; }
            const guest = await guestRes.json();
            // Assign guest to table if needed
            if (tableId) {
              // Get latest guests for table
              const updatedGuests = Array.isArray(tableObj.guests) ? [...tableObj.guests, guest.id] : [guest.id];
              const patchRes = await fetch(`${API_BASE_URL}/api/tables/${tableId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guests: updatedGuests }),
              });
              if (!patchRes.ok) { errors.push(`Row ${i+2}: Failed to assign guest to table "${row.table}".`); }
              // Update tableObj.guests for next iteration
              tableObj.guests = updatedGuests;
            }
          }
          setLocalRefreshKey(k => k + 1);
          if (errors.length) notify(`Import completed with errors:\n${errors.join('\n')}`);
          else notify('Import successful!');
        } catch (err: any) {
          setImportError(err?.toString() || 'Unknown error');
          notify('Import failed: ' + (err?.toString() || 'Unknown error'));
        } finally {
          setImporting(false);
        }
      }
      // Handler for file input change
      const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const rows = await parseExcelFile(file);
          await importAssignees(rows);
        } catch (err: any) {
          setImportError(err?.toString() || 'Failed to import.');
          notify('Import failed: ' + (err?.toString() || 'Failed to import.'));
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
    const handleEditGuest = (guest: any) => {
      setGuestToEdit(guest);
      setIsAddGuestModalOpen(true);
    };

    const handleGuestUpdated = (updatedGuest: any) => {
      setAttendees(attendees => attendees.map(a => a.id === updatedGuest.id ? updatedGuest : a));
      setLocalRefreshKey(k => k + 1);
      setGuestToEdit(null);
      setIsAddGuestModalOpen(false);
    };
  const [attendees, setAttendees] = useState<any[]>([]);
  // const [tables, setTables] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Fetch attendees and tables from backend on mount or when refreshKey changes
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/guests`)
      .then(res => res.json())
      .then(data => setAttendees(data));
    // fetch('http://localhost:4000/api/tables')
    //   .then(res => res.json())
    //   .then(data => setTables(data));
  }, [refreshKey, localRefreshKey]);

  // Remove duplicates: if multiple guests have the same name or instagram, only keep the one with a table assigned
  const uniqueAttendeesMap = new Map();
  for (const attendee of attendees) {
    const key = (attendee.name?.toLowerCase() || '') + '|' + (attendee.instagram?.toLowerCase() || '');
    if (!uniqueAttendeesMap.has(key)) {
      uniqueAttendeesMap.set(key, attendee);
    } else {
      const existing = uniqueAttendeesMap.get(key);
      // Prefer the one with a table assigned
      if (!existing.table && attendee.table) {
        uniqueAttendeesMap.set(key, attendee);
      }
    }
  }
  const uniqueAttendees = Array.from(uniqueAttendeesMap.values());
  const filteredAttendees = uniqueAttendees.filter((attendee) => {
    const matchesSearch = attendee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.instagram?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attendee.table && attendee.table.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || attendee.status === statusFilter;
    // Only use shouldShowInTableSearch logic if needed, but remove unused 'table' variable
    const shouldShowInTableSearch = !searchTerm || !attendee.table || (attendee.table && attendee.table.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && matchesStatus && shouldShowInTableSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Tentative':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Tentative':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleExport = () => {
    if (attendees.length === 0) return;
    
    const csvContent = [
      ['Name', 'Instagram', 'Table', 'Status', 'Gender', 'Age'],
      ...attendees.map(a => [a.name, a.instagram, a.table || 'Unassigned', a.status, a.gender, a.age.toString()])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendees.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, Instagram, or table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Tentative">Tentative</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel File
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-60"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            type="button"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import Excel File'}
          </button>
          <input
            type="file"
            accept=".xlsx,.csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImport}
            disabled={importing}
          />
          {importError && (
            <span className="text-red-400 text-xs ml-2">{importError}</span>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-400">
          Showing {filteredAttendees.length} of {attendees.length} attendees
        </div>
      </div>

      {/* Attendees Grid */}
      {attendees.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No attendees yet</p>
          <p className="text-gray-500 text-sm">Start by adding guests from the Overview tab</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAttendees.map((attendee) => {
              // const table = tables.find(t => t.name === attendee.table);
              return (
                <div
                  key={attendee.id}
                  className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white">
                          {attendee.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white">{attendee.name}</h3>
                        {attendee.contactNumber && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <span>{attendee.contactNumber}</span>
                          </div>
                        )}
                        {attendee.instagram ? (
                          <a
                            href={`https://instagram.com/${attendee.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors"
                          >
                            <Instagram className="w-3 h-3" />
                            {attendee.instagram}
                          </a>
                        ) : null}
                      </div>
                    </div>
                    {getStatusIcon(attendee.status)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Table:</span>
                      {attendee.table ? (
                        <span className={`text-sm px-2 py-1 rounded ${
                          attendee.table.startsWith('VIP') 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {attendee.table}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(attendee.status)}`}>
                        {attendee.status}
                      </span>
                      <button
                        onClick={() => handleEditGuest(attendee)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit guest"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Remove ${attendee.name} from the guest list?`)) {
                            // Remove all guests with same name or instagram
                            const guestsToDelete = attendees.filter(g =>
                              (g.name?.toLowerCase() === attendee.name?.toLowerCase()) ||
                              (g.instagram && attendee.instagram && g.instagram?.toLowerCase() === attendee.instagram?.toLowerCase())
                            );
                            await Promise.all(
                              guestsToDelete.map(g =>
                                fetch(`${API_BASE_URL}/api/guests/${g.id}`, { method: 'DELETE' })
                              )
                            );
                            setLocalRefreshKey(k => k + 1);
                            if (onGuestRemoved) onGuestRemoved();
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove guest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAttendees.length === 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-12 text-center">
              <p className="text-gray-400">No attendees found matching your criteria</p>
            </div>
          )}
        </>
      )}
      {/* Only one modal rendered here, outside the attendee loop */}
      <AddGuestModal
        isOpen={isAddGuestModalOpen}
        onClose={() => { setIsAddGuestModalOpen(false); setGuestToEdit(null); }}
        guestToEdit={guestToEdit}
        onGuestUpdated={handleGuestUpdated}
      />
    </div>
  );
}