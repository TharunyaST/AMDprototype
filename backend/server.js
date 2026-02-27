const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────
function readData(file) {
    try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    } catch { return []; }
}

function writeData(file, data) {
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ─── AUTH ────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const users = readData('users.json');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        const { password: _, ...safeUser } = user;
        return res.json({ success: true, user: safeUser });
    }
    res.status(401).json({ success: false, message: 'Invalid email or password' });
});

app.get('/api/auth/me', (req, res) => {
    res.json({ success: true, message: 'Authenticated' });
});

// ─── DOCUMENTS ───────────────────────────────────────────────
app.get('/api/documents', (req, res) => {
    const docs = readData('documents.json');
    const { q, category } = req.query;
    let result = docs;
    if (q) result = result.filter(d =>
        d.name.toLowerCase().includes(q.toLowerCase()) ||
        d.department.toLowerCase().includes(q.toLowerCase()) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q.toLowerCase()))
    );
    if (category) result = result.filter(d => d.category === category);
    res.json({ success: true, total: result.length, documents: result });
});

app.get('/api/documents/:id', (req, res) => {
    const docs = readData('documents.json');
    const doc = docs.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, document: doc });
});

app.post('/api/documents', (req, res) => {
    const docs = readData('documents.json');
    const newDoc = {
        id: 'DOC-' + Date.now(),
        ...req.body,
        uploadedAt: new Date().toISOString(),
        status: 'pending'
    };
    docs.unshift(newDoc);
    writeData('documents.json', docs);
    res.status(201).json({ success: true, document: newDoc });
});

app.delete('/api/documents/:id', (req, res) => {
    let docs = readData('documents.json');
    const original = docs.length;
    docs = docs.filter(d => d.id !== req.params.id);
    if (docs.length === original) return res.status(404).json({ success: false, message: 'Not found' });
    writeData('documents.json', docs);
    res.json({ success: true, message: 'Document deleted' });
});

// ─── WORKFLOW ─────────────────────────────────────────────────
app.get('/api/workflow', (req, res) => {
    const items = readData('workflow.json');
    res.json({ success: true, total: items.length, items });
});

app.patch('/api/workflow/:id', (req, res) => {
    const items = readData('workflow.json');
    const idx = items.findIndex(w => w.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('workflow.json', items);
    res.json({ success: true, item: items[idx] });
});

// ─── STATS ────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
    const docs = readData('documents.json');
    const workflows = readData('workflow.json');
    const pending = workflows.filter(w => w.status === 'pending').length;
    res.json({
        success: true,
        stats: {
            totalDocuments: docs.length,
            pendingApprovals: pending,
            ocrProcessed: docs.filter(d => d.ocr).length,
            aiClassified: docs.filter(d => d.aiClassified).length,
            activeUsers: 38,
            storageUsedGB: 246
        }
    });
});

// ─── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'AI-DMS Backend running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n  ✅  AI-DMS Backend running at http://localhost:${PORT}`);
    console.log(`  📄  Documents API   → GET/POST http://localhost:${PORT}/api/documents`);
    console.log(`  🔐  Auth API        → POST http://localhost:${PORT}/api/auth/login`);
    console.log(`  ⚡  Workflow API     → GET/PATCH http://localhost:${PORT}/api/workflow\n`);
});
