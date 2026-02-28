const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, 'data');

function readData(file) {
    try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    } catch { return []; }
}

async function migrateData() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'aidms',
    });

    try {
        console.log("Starting Migration...");

        // Migrate Users
        const users = readData('users.json');
        for (const user of users) {
            await pool.query(
                `INSERT IGNORE INTO Users (id, name, email, password, role, department, avatar) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user.id, user.name, user.email, user.password, user.role, user.department, user.avatar]
            );
        }
        console.log(`Migrated ${users.length} Users.`);

        // Migrate Documents
        const docs = readData('documents.json');
        for (const doc of docs) {
            await pool.query(
                `INSERT IGNORE INTO Documents (id, name, category, department, size, pages, uploadedBy, uploadedAt, status, aiClassified, ocr, tags, confidence) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    doc.id, doc.name, doc.category, doc.department, doc.size, doc.pages,
                    doc.uploadedBy, new Date(doc.uploadedAt), doc.status, doc.aiClassified,
                    doc.ocr, JSON.stringify(doc.tags || []), doc.confidence
                ]
            );
        }
        console.log(`Migrated ${docs.length} Documents.`);

        // Migrate Workflows
        const workflows = readData('workflow.json');
        for (const wf of workflows) {
            await pool.query(
                `INSERT IGNORE INTO Workflows (id, documentId, documentName, requestedBy, department, status, priority, daysWaiting, approvers, currentStep, createdAt, updatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    wf.id, wf.documentId, wf.documentName, wf.requestedBy, wf.department,
                    wf.status, wf.priority, wf.daysWaiting, JSON.stringify(wf.approvers || []),
                    wf.currentStep, new Date(wf.createdAt), new Date(wf.updatedAt)
                ]
            );
        }
        console.log(`Migrated ${workflows.length} Workflows.`);

        console.log("Migration Completed Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
}

migrateData();
