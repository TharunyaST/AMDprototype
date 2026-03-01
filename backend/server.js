// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./db');
// const Document = require('./models/Document');
// const WorkflowItem = require('./models/WorkflowItem');
// const User = require('./models/User');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Ensure uploads directory exists
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });
// const upload = multer({ storage: storage });

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Serve the frontend static files from the parent directory
// app.use(express.static(require('path').join(__dirname, '../')));

// // Serve uploaded files statically
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // 1. Health check
// app.get('/api/health', (req, res) => {
//   res.json({ success: true, message: 'Backend is online' });
// });

// // 2. Stats
// app.get('/api/stats', async (req, res) => {
//   try {
//     const docsCount = await Document.countDocuments();
//     const pendingWf = await WorkflowItem.countDocuments({ status: { $in: ['pending', 'overdue'] } });

//     res.json({
//       success: true,
//       stats: {
//         totalDocuments: docsCount + 15200,
//         pendingApprovals: pendingWf,
//         ocrProcessed: 12450,
//         aiClassified: 14800,
//         activeUsers: 84,
//         storageUsedGB: 142.5
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// // 3. Get Workflow Items
// app.get('/api/workflow', async (req, res) => {
//   try {
//     const items = await WorkflowItem.find().sort({ days_waiting: -1 });
//     // Map db columns back to what frontend expects
//     const formattedItems = items.map(i => ({
//       id: i.wf_id,
//       documentName: i.document_name,
//       department: i.department,
//       requestedBy: i.requested_by,
//       daysWaiting: i.days_waiting,
//       status: i.status,
//       priority: i.priority,
//       type: i.type,
//       size: i.size,
//       desc: i.description
//     }));
//     res.json({ success: true, items: formattedItems });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// // 4. Update Workflow Item Status
// app.patch('/api/workflow/:id', async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   try {
//     await WorkflowItem.findOneAndUpdate({ wf_id: id }, { status });
//     res.json({ success: true, id, status });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// // 5. Get Documents (Search)
// app.get('/api/documents', async (req, res) => {
//   const query = req.query.q || '';
//   try {
//     let filter = {};
//     if (query.trim()) {
//       filter = {
//         $or: [
//           { title: { $regex: query, $options: 'i' } },
//           { department: { $regex: query, $options: 'i' } },
//           { author: { $regex: query, $options: 'i' } },
//           { description: { $regex: query, $options: 'i' } }
//         ]
//       };
//     }
//     const docs = await Document.find(filter).sort({ relevance: -1 });

//     const formattedDocs = docs.map(d => ({
//       id: d.doc_id,
//       name: d.title,
//       department: d.department,
//       tags: d.tags || [],
//       confidence: d.relevance,
//       uploadedAt: d.uploaded_at,
//       uploadedBy: d.author,
//       status: d.status,
//       size: d.size,
//       desc: d.description,
//       fileUrl: d.fileUrl
//     }));

//     res.json({ success: true, documents: formattedDocs });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// // 6. Upload Document
// app.post('/api/documents', upload.single('file'), async (req, res) => {
//   const { category, department, uploadedBy, tags, confidence } = req.body;
//   const file = req.file;

//   if (!file) {
//     return res.status(400).json({ success: false, message: 'No file uploaded' });
//   }

//   try {
//     const docId = 'doc' + Date.now();
//     const type = file.originalname.split('.').pop().toUpperCase() || 'UNKNOWN';
//     const date = new Date().toISOString().substring(0, 10);
//     const desc = 'Newly uploaded document awaiting full analysis.';

//     // Store url relative to the backend server
//     const fileUrl = '/uploads/' + file.filename;

//     // Convert bytes to MB format
//     const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

//     const newDoc = new Document({
//       doc_id: docId,
//       title: file.originalname,
//       department: department || 'General',
//       type,
//       tags: tags ? JSON.parse(tags) : [],
//       relevance: confidence || 90,
//       uploaded_at: date,
//       author: uploadedBy || 'Unknown',
//       status: 'Pending',
//       size: sizeInMB,
//       description: desc,
//       fileUrl: fileUrl
//     });

//     await newDoc.save();

//     res.status(201).json({ success: true, docId });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });

// // 7. Auth Login
// app.post('/api/auth/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user || user.password !== password) {
//       return res.status(401).json({ success: false, message: 'Invalid email or password' });
//     }
//     const userObj = user.toObject();
//     delete userObj.password;
//     res.json({ success: true, user: userObj });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`AI-DMS Database API Backend running on http://localhost:${PORT}`);
// });
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const Document = require('./models/Document');
const WorkflowItem = require('./models/WorkflowItem');
const User = require('./models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Connect to MongoDB Atlas
connectDB();

// ✅ Middleware
app.use(cors()); 
app.use(express.json());

// ✅ Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ✅ Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// ===================== ROUTES =====================

// 1️⃣ Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is online 🚀' });
});

// 2️⃣ Stats
app.get('/api/stats', async (req, res) => {
  try {
    const docsCount = await Document.countDocuments();
    const pendingWf = await WorkflowItem.countDocuments({
      status: { $in: ['pending', 'overdue'] }
    });

    res.json({
      success: true,
      stats: {
        totalDocuments: docsCount,
        pendingApprovals: pendingWf,
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

// 3️⃣ Get Workflow Items
app.get('/api/workflow', async (req, res) => {
  try {
    const items = await WorkflowItem.find().sort({ days_waiting: -1 });

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

// 4️⃣ Update Workflow Status
app.patch('/api/workflow/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await WorkflowItem.findOneAndUpdate({ wf_id: id }, { status });
    res.json({ success: true, id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 5️⃣ Search Documents
app.get('/api/documents', async (req, res) => {
  const query = req.query.q || '';

  try {
    let filter = {};
    if (query.trim()) {
      filter = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { department: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };
    }

    const docs = await Document.find(filter);

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
      desc: d.description,
      fileUrl: d.fileUrl
    }));

    res.json({ success: true, documents: formattedDocs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 6️⃣ Upload Document
app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { department, uploadedBy, tags, confidence } = req.body;
    const file = req.file;

    const newDoc = new Document({
      doc_id: 'doc' + Date.now(),
      title: file.originalname,
      department: department || 'General',
      type: file.originalname.split('.').pop().toUpperCase(),
      tags: tags ? JSON.parse(tags) : [],
      relevance: confidence || 90,
      uploaded_at: new Date(),
      author: uploadedBy || 'Unknown',
      status: 'Pending',
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      description: 'Newly uploaded document awaiting full analysis.',
      fileUrl: '/uploads/' + file.filename
    });

    await newDoc.save();
    res.status(201).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 7️⃣ Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, user: userObj });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 AI-DMS Backend running on port ${PORT}`);
});