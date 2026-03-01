const mongoose = require('mongoose');
require('dotenv').config();
const Document = require('./models/Document');
const WorkflowItem = require('./models/WorkflowItem');
const User = require('./models/User');

async function setup() {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aidms';
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');

        console.log('Clearing existing data...');
        // Optional: clear existing collections for a fresh seed
        await Document.deleteMany({});
        await WorkflowItem.deleteMany({});
        await User.deleteMany({});

        console.log('Seeding data...');

        const wfItems = [
            { wf_id: 'wf1', document_name: 'Annual Safety Inspection Report 2024', department: 'Safety', requested_by: 'Rajesh Kumar', days_waiting: 3, status: 'pending', priority: 'high', type: 'PDF', size: '2.4 MB', description: 'Comprehensive safety audit covering all 25 stations. Fire systems, CCTV, emergency exits all evaluated.' },
            { wf_id: 'wf2', document_name: 'Procurement Tender for Rolling Stock', department: 'Procurement', requested_by: 'Priya Menon', days_waiting: 7, status: 'overdue', priority: 'critical', type: 'DOCX', size: '3.2 MB', description: 'Open tender for 15 new metro coaches. Bids from 4 vendors received. Evaluation in progress.' },
            { wf_id: 'wf3', document_name: 'Employee Leave Policy — HR Circular 2025', department: 'HR', requested_by: 'Divya Nair', days_waiting: 1, status: 'pending', priority: 'medium', type: 'PDF', size: '640 KB', description: 'Updated leave policy covering casual, sick, and earned leaves. New WFH provisions included.' },
            { wf_id: 'wf4', document_name: 'Revenue Collection Audit Report Jan 2025', department: 'Finance', requested_by: 'Suresh Pillai', days_waiting: 5, status: 'overdue', priority: 'high', type: 'XLSX', size: '5.1 MB', description: 'Monthly revenue audit for January 2025. Total collection: ₹18.6 Cr. 99.8% accuracy.' },
            { wf_id: 'wf5', document_name: 'Cloud Migration Plan — Phase II', department: 'IT', requested_by: 'Ananya Raj', days_waiting: 2, status: 'pending', priority: 'medium', type: 'DOCX', size: '3.4 MB', description: 'Plan to migrate 60% of workloads to AWS. Timeline: 8 months. Cost estimate: ₹1.2 Cr.' }
        ];

        await WorkflowItem.insertMany(wfItems);

        const docs = [
            { doc_id: 'doc1', title: 'Annual Safety Inspection Report 2024', department: 'Safety', type: 'PDF', tags: ['safety', 'inspection', 'annual', 'report'], relevance: 97, uploaded_at: '2024-12-15', author: 'Rajesh Kumar', status: 'Approved', size: '2.4 MB', description: 'Comprehensive safety audit covering all 25 stations. Fire systems, CCTV, emergency exits all evaluated.' },
            { doc_id: 'doc2', title: 'Procurement Tender for Rolling Stock', department: 'Procurement', type: 'DOCX', tags: ['tender', 'rolling stock', 'procurement', 'bid'], relevance: 91, uploaded_at: '2025-01-08', author: 'Priya Menon', status: 'Pending', size: '3.2 MB', description: 'Open tender for 15 new metro coaches. Bids from 4 vendors received. Evaluation in progress.' },
            { doc_id: 'doc3', title: 'Employee Leave Policy — HR Circular 2025', department: 'HR', type: 'PDF', tags: ['HR', 'leave', 'policy', 'circular', 'employee'], relevance: 85, uploaded_at: '2025-02-01', author: 'Divya Nair', status: 'Approved', size: '640 KB', description: 'Updated leave policy covering casual, sick, and earned leaves. New WFH provisions included.' }
        ];

        await Document.insertMany(docs);

        const users = [
            { email: 'admin@aidms.com', password: 'password123', name: 'System Admin', role: 'admin', department: 'IT', avatar: 'admin' },
            { email: 'manager@aidms.com', password: 'password123', name: 'Department Manager', role: 'manager', department: 'HR', avatar: 'user' },
            { email: 'staff@aidms.com', password: 'password123', name: 'General Staff', role: 'staff', department: 'General', avatar: 'user' }
        ];

        await User.insertMany(users);

        console.log('Database setup complete!');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await mongoose.disconnect();
    }
}

setup();
