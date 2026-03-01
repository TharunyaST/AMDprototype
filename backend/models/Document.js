const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    doc_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    department: { type: String, required: true },
    type: { type: String },
    tags: [String],
    relevance: { type: Number, default: 90 },
    fileUrl: { type: String, required: false }, // URL to download the actual file
    uploaded_at: { type: String },
    author: { type: String },
    status: { type: String, default: 'Pending' },
    size: { type: String },
    description: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Document', documentSchema);
