const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the frontend static files from the parent directory
app.use(express.static(require('path').join(__dirname, '../')));

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is online' });
});

// 2. Stats
app.get('/api/stats', async (req, res) => {
  try {
    const [docsCount] = await db.query('SELECT COUNT(*) as total FROM documents');
    const [pendingWf] = await db.query('SELECT COUNT(*) as total FROM workflow_items WHERE status IN ("pending", "overdue")');

    res.json({
      success: true,
      stats: {
        totalDocuments: docsCount[0].total + 15200,
        pendingApprovals: pendingWf[0].total,
        ocrProcessed: 12450,
        aiClassified: 14800,
        activeUsers: 84,
        storageUsedGB: 142.5
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 3. Get Workflow Items
app.get('/api/workflow', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM workflow_items ORDER BY days_waiting DESC');
    // Map db columns back to what frontend expects
    const formattedItems = items.map(i => ({
      id: i.wf_id,
      documentName: i.document_name,
      department: i.department,
      requestedBy: i.requested_by,
      daysWaiting: i.days_waiting,
      status: i.status,
      priority: i.priority,
      type: i.type,
      size: i.size,
      desc: i.description
    }));
    res.json({ success: true, items: formattedItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 4. Update Workflow Item Status
app.patch('/api/workflow/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE workflow_items SET status = ? WHERE wf_id = ?', [status, id]);
    res.json({ success: true, id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 5. Get Documents (Search)
app.get('/api/documents', async (req, res) => {
  const query = req.query.q || '';
  try {
    let sql = 'SELECT * FROM documents ORDER BY relevance DESC';
    let params = [];

    if (query.trim()) {
      sql = `SELECT * FROM documents 
             WHERE title LIKE ? 
             OR department LIKE ? 
             OR author LIKE ?
             OR description LIKE ?
             ORDER BY relevance DESC`;
      const likeQuery = `%\${query}%`;
      params = [likeQuery, likeQuery, likeQuery, likeQuery];
    }

    const [docs] = await db.query(sql, params);

    const formattedDocs = docs.map(d => ({
      id: d.doc_id,
      name: d.title,
      department: d.department,
      tags: d.tags || [],
      confidence: d.relevance,
      uploadedAt: d.uploaded_at,
      uploadedBy: d.author,
      status: d.status,
      size: d.size,
      desc: d.description
    }));

    res.json({ success: true, documents: formattedDocs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 6. Upload Document
app.post('/api/documents', async (req, res) => {
  const { name, category, department, size, uploadedBy, tags, confidence } = req.body;

  try {
    const docId = 'doc' + Date.now();
    const type = name.split('.').pop().toUpperCase() || 'UNKNOWN';
    const date = new Date().toISOString().substring(0, 10);
    const desc = 'Newly uploaded document awaiting full analysis.';

    await db.query(`
      INSERT INTO documents
        (doc_id, title, department, type, tags, relevance, uploaded_at, author, status, size, description)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
      docId, name, department || 'General', type, JSON.stringify(tags || []), confidence || 90,
      date, uploadedBy || 'Unknown', 'Pending', size || '1.0 MB', desc
    ]);

    res.status(201).json({ success: true, docId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`AI-DMS Database API Backend running on http://localhost:\${PORT}`);
});
