const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Example API endpoint

// lowdb setup for permanent storage
const dbFile = new JSONFile('data.json');
const defaultData = { guests: [], tables: [], reminders: [] };
const db = new Low(dbFile, defaultData);

// Initialize database (no longer need to set db.data manually)
async function initDB() {
  await db.read();
  await db.write();
}
initDB();

// Example API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: "Hello from backend!" });
});


// Update a table
app.patch('/api/tables/:id', async (req, res) => {
  const id = req.params.id;
  await db.read();
  const table = db.data.tables.find(t => String(t.id) === String(id));
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }
  const { name, seats, type, spending, confirmed, guests } = req.body;
  if (name !== undefined) table.name = name;
  if (seats !== undefined) table.seats = seats;
  if (type !== undefined) table.type = type;
  if (spending !== undefined) table.spending = spending;
  if (confirmed !== undefined) table.confirmed = confirmed;
  if (guests !== undefined) {
    table.guests = guests;
    // Assign table name to each guest in the guests array
    for (const guestId of guests) {
      const guest = db.data.guests.find(g => String(g.id) === String(guestId));
      if (guest) {
        guest.table = table.name;
      }
    }
    // Remove table assignment from guests no longer in the table
    for (const guest of db.data.guests) {
      if (guest.table === table.name && !guests.includes(guest.id)) {
        delete guest.table;
      }
    }
  }
  await db.write();
  res.status(200).json(table);
});

// Delete a table
app.delete('/api/tables/:id', async (req, res) => {
  const id = req.params.id;
  await db.read();
  const before = db.data.tables.length;
  db.data.tables = db.data.tables.filter(t => String(t.id) !== String(id));
  const after = db.data.tables.length;
  await db.write();
  if (after < before) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ error: 'Table not found' });
  }
});

// Get all guests
app.get('/api/guests', async (req, res) => {
  await db.read();
  // Deduplicate by id, prefer entry with table assigned
  const deduped = Object.values(
    db.data.guests.reduce((acc, curr) => {
      if (!acc[curr.id]) {
        acc[curr.id] = curr;
      } else {
        if (!acc[curr.id].table && curr.table) {
          acc[curr.id] = curr;
        }
      }
      return acc;
    }, {})
  );
  res.json(deduped);
});

// Add a new guest
app.post('/api/guests', async (req, res) => {
  const { name, contactNumber, instagram, confirmed, gender, age } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  await db.read();
  // Check for existing guest by name
  let guest = db.data.guests.find(g => g.name === name);
  if (guest) {
    // Update existing guest
    guest.contactNumber = contactNumber || guest.contactNumber;
    guest.instagram = instagram || guest.instagram;
    guest.confirmed = !!confirmed;
    guest.status = confirmed ? 'Confirmed' : 'Tentative';
    guest.gender = gender || guest.gender;
    guest.age = age || guest.age;
    await db.write();
    return res.status(200).json(guest);
  }
  // Otherwise, add new guest
  const newGuest = {
    id: Date.now(),
    name,
    contactNumber: contactNumber || '',
    instagram: instagram || '',
    confirmed: !!confirmed,
    status: confirmed ? 'Confirmed' : 'Tentative',
    gender: gender || '',
    age: age || null
  };
  db.data.guests.push(newGuest);
  await db.write();
  res.status(201).json(newGuest);
});


// Delete a guest
app.delete('/api/guests/:id', async (req, res) => {
  const id = req.params.id;
  await db.read();
  const before = db.data.guests.length;
  // Remove guest from guests array
  db.data.guests = db.data.guests.filter(g => String(g.id) !== String(id));
  // Remove guest from any table's guests array
  for (const table of db.data.tables) {
    if (Array.isArray(table.guests)) {
      table.guests = table.guests.filter(gid => String(gid) !== String(id));
    }
  }
  const after = db.data.guests.length;
  await db.write();
  if (after < before) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ error: 'Guest not found' });
  }
});

// Get all tables
app.get('/api/tables', async (req, res) => {
  await db.read();
  res.json(db.data.tables);
});

// Add a new table
app.post('/api/tables', async (req, res) => {
  const { name, seats, type, spending, confirmed, guests } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  await db.read();
  // Ensure guests is an array of strings (ids)
  const guestIds = Array.isArray(guests) ? guests.map(id => String(id)) : [];
  const newTable = {
    id: Date.now(),
    name,
    seats: seats || 6,
    type: type || 'Standard',
    spending: spending || 0,
    confirmed: !!confirmed,
    guests: guestIds,
  };
  db.data.tables.push(newTable);

  // Assign table name to each guest in the guests array
  for (const guestId of guestIds) {
    const guest = db.data.guests.find(g => String(g.id) === guestId);
    if (guest) {
      guest.table = name;
    }
  }

  await db.write();
  res.status(201).json(newTable);
});

// Get all reminders
app.get('/api/reminders', async (req, res) => {
  await db.read();
  res.json(db.data.reminders);
});


// Add a new reminder
app.post('/api/reminders', async (req, res) => {
  const { message, date } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  await db.read();
  const newReminder = { id: Date.now(), message, date };
  db.data.reminders.push(newReminder);
  await db.write();
  res.status(201).json(newReminder);
});

// Update a guest
app.patch('/api/guests/:id', async (req, res) => {
  const id = req.params.id;
  await db.read();
  const guest = db.data.guests.find(g => String(g.id) === String(id));
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  const { name, contactNumber, instagram, status, gender, age } = req.body;
  if (name !== undefined) guest.name = name;
  if (contactNumber !== undefined) guest.contactNumber = contactNumber;
  if (instagram !== undefined) guest.instagram = instagram;
  if (status !== undefined) guest.status = status;
  if (gender !== undefined) guest.gender = gender;
  if (age !== undefined) guest.age = age;
  await db.write();
  res.status(200).json(guest);
});

// Delete a reminder
app.delete('/api/reminders/:id', async (req, res) => {
  const id = req.params.id;
  await db.read();
  const before = db.data.reminders.length;
  db.data.reminders = db.data.reminders.filter(r => String(r.id) !== String(id));
  const after = db.data.reminders.length;
  await db.write();
  if (after < before) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});