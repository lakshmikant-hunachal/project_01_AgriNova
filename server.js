const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Helper function to read data
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data file:', err);
        return { users: [], scans: [] };
    }
}

// Helper function to write data
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing data file:', err);
    }
}

// --- API Endpoints ---

// Register User
app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    const data = readData();

    if (data.users.some(user => user.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = { name, email, phone, password };
    data.users.push(newUser);
    writeData(data);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login User
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const data = readData();

    const user = data.users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user without password
    res.json({ user: { name: user.name, email: user.email, phone: user.phone } });
});

// Get User Profile (Just passing email for simplicity as we don't have JWT)
app.get('/api/user/profile', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const data = readData();
    const user = data.users.find(u => u.email === email);
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ name: user.name, email: user.email, phone: user.phone });
});

// Get User Scans
app.get('/api/user/scans', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const data = readData();
    const userScans = data.scans.filter(scan => scan.userEmail === email);
    
    res.json(userScans);
});

// Save a new Scan
app.post('/api/user/scans', (req, res) => {
    const scanRecord = req.body;
    const data = readData();

    data.scans.unshift(scanRecord);
    // Keep only top 50 scans total for simplicity, or 20 per user.
    // We'll let it grow for now or just limit the total file size roughly.
    if (data.scans.length > 200) {
        data.scans = data.scans.slice(0, 200);
    }

    writeData(data);
    res.status(201).json({ message: 'Scan saved successfully' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
