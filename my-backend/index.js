const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Octokit } = require("@octokit/rest");
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());


// GitHub repo config (set these as environment variables)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Your GitHub personal access token
const GITHUB_OWNER = process.env.GITHUB_OWNER; // e.g. 'your-username'
const GITHUB_REPO = process.env.GITHUB_REPO;   // e.g. 'your-repo'
const GITHUB_PATH = process.env.GITHUB_PATH || 'data.json';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const defaultData = { guests: [], tables: [], reminders: [] };
let db = { data: defaultData };

// Helper: get latest data.json from GitHub
async function readFromGitHub() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_PATH,
    });
    const content = Buffer.from(data.content, 'base64').toString();
    db.data = JSON.parse(content);
  } catch (err) {
    db.data = defaultData;
  }
}

// Helper: write data.json to GitHub
async function writeToGitHub() {
  let sha = undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_PATH,
    });
    sha = data.sha;
  } catch (err) {}
  const content = Buffer.from(JSON.stringify(db.data, null, 2)).toString('base64');
  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: GITHUB_PATH,
    message: 'Update data.json',
    content,
    sha,
  });
}

// Initialize database from GitHub
async function initDB() {
  await readFromGitHub();
}
initDB();

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Example API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Start server on provided port (Render uses process.env.PORT)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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

// Get all guests (from lowdb JSON file)
app.get('/api/guests', async (req, res) => {
  await readFromGitHub();
  res.json(db.data.guests);
});

// Add a new guest
app.post('/api/guests', async (req, res) => {
  const { name, contactNumber, instagram, confirmed, gender, age } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  await readFromGitHub();
  let guest = db.data.guests.find(g => g.name === name);
  if (guest) {
    guest.contactNumber = contactNumber || guest.contactNumber;
    guest.instagram = instagram || guest.instagram;
    guest.confirmed = !!confirmed;
    guest.status = confirmed ? 'Confirmed' : 'Tentative';
    guest.gender = gender || guest.gender;
    guest.age = age || guest.age;
    await writeToGitHub();
    return res.status(200).json(guest);
  }
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
  await writeToGitHub();
  res.status(201).json(newGuest);
});


// Delete a guest
app.delete('/api/guests/:id', async (req, res) => {
  const id = req.params.id;
  await readFromGitHub();
  const before = db.data.guests.length;
  db.data.guests = db.data.guests.filter(g => String(g.id) !== String(id));
  for (const table of db.data.tables) {
    if (Array.isArray(table.guests)) {
      table.guests = table.guests.filter(gid => String(gid) !== String(id));
    }
  }
  const after = db.data.guests.length;
  await writeToGitHub();
  if (after < before) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ error: 'Guest not found' });
  }
});

// Get all tables
app.get('/api/tables', async (req, res) => {
  await readFromGitHub();
  res.json(db.data.tables);
});

// Add a new table
app.post('/api/tables', async (req, res) => {
  const { name, seats, type, spending, confirmed, guests } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  await readFromGitHub();
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
  for (const guestId of guestIds) {
    const guest = db.data.guests.find(g => String(g.id) === guestId);
    if (guest) {
      guest.table = name;
    }
  }
  await writeToGitHub();
  res.status(201).json(newTable);
});

// Get all reminders
app.get('/api/reminders', async (req, res) => {
  await readFromGitHub();
  res.json(db.data.reminders);
});


// Add a new reminder
app.post('/api/reminders', async (req, res) => {
  const { message, date } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  await readFromGitHub();
  const newReminder = { id: Date.now(), message, date };
  db.data.reminders.push(newReminder);
  await writeToGitHub();
  res.status(201).json(newReminder);
});

// Update a guest
app.patch('/api/guests/:id', async (req, res) => {
  const id = req.params.id;
  await readFromGitHub();
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
  await writeToGitHub();
  res.status(200).json(guest);
});

// Delete a reminder
app.delete('/api/reminders/:id', async (req, res) => {
  const id = req.params.id;
  await readFromGitHub();
  const before = db.data.reminders.length;
  db.data.reminders = db.data.reminders.filter(r => String(r.id) !== String(id));
  const after = db.data.reminders.length;
  await writeToGitHub();
  if (after < before) {
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

// Example query
async function getGuests() {
  const res = await pool.query('SELECT * FROM guests');
  return res.rows;
}

// Create guests table (PostgreSQL)
app.post('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contactNumber TEXT,
        instagram TEXT,
        confirmed BOOLEAN,
        status TEXT,
        gender TEXT,
        age INTEGER
      )
    `);
    res.json({ message: 'Guests table created or already exists' });
  } catch (err) {
    console.error('Error creating guests table:', err);
    res.status(500).json({ error: 'Failed to create guests table' });
  }
});

