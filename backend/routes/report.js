// routes/report.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const filePath = path.join(__dirname, '../data/reports.json');
const { scanURL } = require('../utils/scanner');

// Save a report to JSON file
function saveReport(data) {
    let reports = {};
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        console.log("Existing file content:", fileContent);
        reports = fileContent ? JSON.parse(fileContent) : {};
      } catch (err) {
        console.error("Error parsing JSON file:", err);
        reports = {};
      }
    }
    const id = uuidv4();
    reports[id] = data;
    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2));
    console.log("Saved report with id:", id);
    return id;
  }
  
  function getReportById(id) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (!fileContent.trim()) return null;
      const reports = JSON.parse(fileContent);
      return reports[id] || null;
    } catch (err) {
      console.error('Error reading or parsing reports.json:', err);
      return null;
    }
  }
  

// POST /analyze - Save new report
router.post('/analyze', async (req, res) => {
    const { url } = req.body;
  
    if (!url) {
      return res.status(400).json({ error: 'Missing URL' });
    }
  
    try {
      const result = await scanURL(url);
  
      if (!result.success) {
        console.error('Scan failed:', result.error);  // ✅ Add this line
        return res.status(500).json({ error: 'Scan failed', details: result.error });
      }
  
      const id = saveReport(result);
      res.json({ success: true, id });
    } catch (err) {
      console.error('Unexpected error during analysis:', err);  // ✅ Catch other issues
      res.status(500).json({ error: 'Unexpected server error', details: err.message });
    }
  });
  

// GET /report/:id - Retrieve saved report
router.get('/report/:id', (req, res) => {
  const report = getReportById(req.params.id);
  if (report) {
    res.json(report);
  } else {
    res.status(404).json({ error: 'Report not found' });
  }
});

module.exports = router;
