const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool using environment variables or fallback to XAMPP defaults
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aidms',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initializeDatabase() {
    try {
        // We first connect without database to create it if it doesn't exist
        const initConnection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'aidms'}\`;`);
        await initConnection.end();

        console.log("Database initialized or already exists.");

        // Create tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(50),
                department VARCHAR(50),
                avatar VARCHAR(10)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Documents (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(50),
                department VARCHAR(50),
                size VARCHAR(20),
                pages INT,
                uploadedBy VARCHAR(100),
                uploadedAt DATETIME,
                status VARCHAR(50) DEFAULT 'pending',
                aiClassified BOOLEAN DEFAULT FALSE,
                ocr BOOLEAN DEFAULT FALSE,
                tags JSON,
                confidence INT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Workflows (
                id VARCHAR(50) PRIMARY KEY,
                documentId VARCHAR(50),
                documentName VARCHAR(255),
                requestedBy VARCHAR(100),
                department VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pending',
                priority VARCHAR(20),
                daysWaiting INT DEFAULT 0,
                approvers JSON,
                currentStep INT DEFAULT 0,
                createdAt DATETIME,
                updatedAt DATETIME,
                FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE SET NULL
            )
        `);

        console.log("Tables initialized successfully.");

    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

// Call initialization to ensure tables exist
initializeDatabase();

module.exports = pool;
