const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'qwertyuiop#71118',
    });

    try {
        console.log('Connecting to MySQL...');
        await connection.query('CREATE DATABASE IF NOT EXISTS aidms;');
        console.log('Database aidms created or exists.');

        await connection.query('USE aidms;');

        console.log('Creating tables...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100),
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doc_id VARCHAR(50) UNIQUE,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        type VARCHAR(20),
        tags JSON,
        relevance INT DEFAULT 90,
        uploaded_at DATE,
        author VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        size VARCHAR(20),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS workflow_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wf_id VARCHAR(50) UNIQUE,
        document_name VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        requested_by VARCHAR(255) NOT NULL,
        days_waiting INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        type VARCHAR(20),
        size VARCHAR(20),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Tables created.');

        console.log('Seeding data...');
        // Seed Workflow Items
        const wfItems = [
            ['wf1', 'Annual Safety Inspection Report 2024', 'Safety', 'Rajesh Kumar', 3, 'pending', 'high', 'PDF', '2.4 MB', 'Comprehensive safety audit covering all 25 stations. Fire systems, CCTV, emergency exits all evaluated.'],
            ['wf2', 'Procurement Tender for Rolling Stock', 'Procurement', 'Priya Menon', 7, 'overdue', 'critical', 'DOCX', '3.2 MB', 'Open tender for 15 new metro coaches. Bids from 4 vendors received. Evaluation in progress.'],
            ['wf3', 'Employee Leave Policy — HR Circular 2025', 'HR', 'Divya Nair', 1, 'pending', 'medium', 'PDF', '640 KB', 'Updated leave policy covering casual, sick, and earned leaves. New WFH provisions included.'],
            ['wf4', 'Revenue Collection Audit Report Jan 2025', 'Finance', 'Suresh Pillai', 5, 'overdue', 'high', 'XLSX', '5.1 MB', 'Monthly revenue audit for January 2025. Total collection: ₹18.6 Cr. 99.8% accuracy.'],
            ['wf5', 'Cloud Migration Plan — Phase II', 'IT', 'Ananya Raj', 2, 'pending', 'medium', 'DOCX', '3.4 MB', 'Plan to migrate 60% of workloads to AWS. Timeline: 8 months. Cost estimate: ₹1.2 Cr.']
        ];

        for (const item of wfItems) {
            await connection.query(
                'INSERT IGNORE INTO workflow_items (wf_id, document_name, department, requested_by, days_waiting, status, priority, type, size, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                item
            );
        }

        // Seed Documents
        const docs = [
            ['doc1', 'Annual Safety Inspection Report 2024', 'Safety', 'PDF', JSON.stringify(['safety', 'inspection', 'annual', 'report']), 97, '2024-12-15', 'Rajesh Kumar', 'Approved', '2.4 MB', 'Comprehensive safety audit covering all 25 stations. Fire systems, CCTV, emergency exits all evaluated.'],
            ['doc2', 'Procurement Tender for Rolling Stock', 'Procurement', 'DOCX', JSON.stringify(['tender', 'rolling stock', 'procurement', 'bid']), 91, '2025-01-08', 'Priya Menon', 'Pending', '3.2 MB', 'Open tender for 15 new metro coaches. Bids from 4 vendors received. Evaluation in progress.'],
            ['doc3', 'Employee Leave Policy — HR Circular 2025', 'HR', 'PDF', JSON.stringify(['HR', 'leave', 'policy', 'circular', 'employee']), 85, '2025-02-01', 'Divya Nair', 'Approved', '640 KB', 'Updated leave policy covering casual, sick, and earned leaves. New WFH provisions included.']
        ];

        for (const doc of docs) {
            await connection.query(
                'INSERT IGNORE INTO documents (doc_id, title, department, type, tags, relevance, uploaded_at, author, status, size, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                doc
            );
        }

        console.log('Database setup complete!');

    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await connection.end();
    }
}

setup();
