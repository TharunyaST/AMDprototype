const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

const pool = require('./db');

// ─── AUTH ────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ? AND password = ?', [email, password]);

        if (users.length > 0) {
            const { password: _, ...safeUser } = users[0];
            return res.json({ success: true, user: safeUser });
        }
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



app.get('/api/auth/me', (req, res) => {
    res.json({ success: true, message: 'Authenticated' });
});

// ─── DOCUMENTS ───────────────────────────────────────────────
app.get('/api/documents', async (req, res) => {
    try {
        const { q, category } = req.query;
        let query = 'SELECT * FROM Documents WHERE 1=1';
        let params = [];

        if (q) {
            query += ' AND (LOWER(name) LIKE ? OR LOWER(department) LIKE ? OR JSON_CONTAINS(LOWER(tags), ?))';
            const searchTerm = `%${q.toLowerCase()}%`;
            params.push(searchTerm, searchTerm, `"${q.toLowerCase()}"`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        const [documents] = await pool.query(query, params);
        res.json({ success: true, total: documents.length, documents });
    } catch (err) {
        console.error("Fetch Documents Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/documents/:id', async (req, res) => {
    try {
        const [docs] = await pool.query('SELECT * FROM Documents WHERE id = ?', [req.params.id]);
        if (docs.length === 0) return res.status(404).json({ success: false, message: 'Document not found' });
        res.json({ success: true, document: docs[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/documents', async (req, res) => {
    try {
        const newDoc = {
            id: 'DOC-' + Date.now(),
            ...req.body,
            uploadedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            status: 'pending'
        };

        await pool.query(
            `INSERT INTO Documents (id, name, category, department, size, pages, uploadedBy, uploadedAt, status, aiClassified, ocr, tags, confidence) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newDoc.id, newDoc.name, newDoc.category, newDoc.department, newDoc.size, newDoc.pages,
                newDoc.uploadedBy, newDoc.uploadedAt, newDoc.status, newDoc.aiClassified || false,
                newDoc.ocr || false, JSON.stringify(newDoc.tags || []), newDoc.confidence || null
            ]
        );
        res.status(201).json({ success: true, document: newDoc });
    } catch (err) {
        console.error("Post Document Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/documents/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM Documents WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── WORKFLOW ─────────────────────────────────────────────────
app.get('/api/workflow', async (req, res) => {
    try {
        const [items] = await pool.query('SELECT * FROM Workflows');
        res.json({ success: true, total: items.length, items });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.patch('/api/workflow/:id', async (req, res) => {
    try {
        const updates = req.body;
        const keys = Object.keys(updates);
        if (keys.length === 0) return res.status(400).json({ success: false, message: 'No updates provided' });

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(new Date().toISOString().slice(0, 19).replace('T', ' ')); // updatedAt
        values.push(req.params.id);

        const [result] = await pool.query(`UPDATE Workflows SET ${setClause}, updatedAt = ? WHERE id = ?`, values);

        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });

        const [updatedItems] = await pool.query('SELECT * FROM Workflows WHERE id = ?', [req.params.id]);
        res.json({ success: true, item: updatedItems[0] });
    } catch (err) {
        console.error("Patch Workflow Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── STATS ────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
    try {
        const [[{ totalDocs }]] = await pool.query('SELECT COUNT(*) AS totalDocs FROM Documents');
        const [[{ pendingApprovals }]] = await pool.query('SELECT COUNT(*) AS pendingApprovals FROM Workflows WHERE status = "pending"');
        const [[{ ocrProcessed }]] = await pool.query('SELECT COUNT(*) AS ocrProcessed FROM Documents WHERE ocr = TRUE');
        const [[{ aiClassified }]] = await pool.query('SELECT COUNT(*) AS aiClassified FROM Documents WHERE aiClassified = TRUE');

        res.json({
            success: true,
            stats: {
                totalDocuments: totalDocs,
                pendingApprovals: pendingApprovals,
                ocrProcessed: ocrProcessed,
                aiClassified: aiClassified,
                activeUsers: 38, // Placeholder
                storageUsedGB: 246 // Placeholder
            }
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'AI-DMS Backend running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
