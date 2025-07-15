const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS middleware at the very top
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// POST /api/upload-sheet-url
app.post('/api/upload-sheet-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    // Extract the sheet ID from the URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid Google Sheets URL' });
    const sheetId = match[1];

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google API key not set' });

    // Get sheet metadata to find the first sheet name
    const sheets = google.sheets({ version: 'v4', auth: apiKey });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const firstSheet = meta.data.sheets[0].properties.title;

    // Read the first sheet's data
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${firstSheet}`,
      key: apiKey,
    });
    const rows = result.data.values;
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'No data found in sheet' });

    // Find the column with phone numbers (look for header containing 'phone')
    const header = rows[0].map(h => h.toLowerCase());
    const phoneCol = header.findIndex(h => h.includes('phone'));
    if (phoneCol === -1) return res.status(400).json({ error: 'No phone number column found' });

    // Extract phone numbers (skip header)
    const phoneNumbers = rows.slice(1).map(row => row[phoneCol]).filter(Boolean);

    // For now, just return the numbers
    res.json({ phoneNumbers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 