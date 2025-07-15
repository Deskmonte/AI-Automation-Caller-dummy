const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Upload Google Sheets URL endpoint
app.post('/api/upload-sheet-url', (req, res) => {
  const { sheetUrl } = req.body;
  if (!sheetUrl) {
    return res.status(400).json({ error: 'Missing sheetUrl in request body' });
  }

  // Call the Python script
  const py = spawn('python', [path.join(__dirname, 'python', 'sheet_worker.py'), sheetUrl]);
  let data = '';
  let error = '';

  py.stdout.on('data', (chunk) => {
    data += chunk;
  });

  py.stderr.on('data', (chunk) => {
    error += chunk;
  });

  py.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: error || 'Python script failed' });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse Python output' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 