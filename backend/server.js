require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const { triggerVapiCall } = require('./vapi');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Preserve original extension
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Upload Google Sheets URL or file endpoint
app.post('/api/upload-sheet-url', upload.single('file'), (req, res) => {
  let inputArg;
  if (req.file) {
    inputArg = req.file.path;
  } else if (req.body.sheetUrl) {
    inputArg = req.body.sheetUrl;
  } else {
    return res.status(400).json({ error: 'No file or sheetUrl provided' });
  }

  const py = spawn('python', [path.join(__dirname, 'python', 'sheet_worker.py'), inputArg]);
  let data = '';
  let error = '';

  py.stdout.on('data', (chunk) => {
    data += chunk;
  });

  py.stderr.on('data', (chunk) => {
    error += chunk;
  });

  py.on('close', (code) => {
    // Clean up uploaded file if present
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, () => {});
    }
    if (code !== 0) {
      return res.status(500).json({ error: error || 'Python script failed', stderr: error, pythonOutput: data });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse Python output', pythonOutput: data, stderr: error });
    }
  });
});

// Start Vapi.ai outbound calls endpoint
app.post('/api/start-calls', async (req, res) => {
  const { to_call } = req.body;
  if (!Array.isArray(to_call) || to_call.length === 0) {
    return res.status(400).json({ error: 'No contacts to call' });
  }
  const vapiConfig = {
    apiKey: process.env.VAPI_API_KEY,
    agentId: process.env.ASSISTANT_ID,
  };
  const results = [];
  for (const contact of to_call) {
    const result = await triggerVapiCall(contact, vapiConfig);
    results.push({ contact, result });
  }
  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 