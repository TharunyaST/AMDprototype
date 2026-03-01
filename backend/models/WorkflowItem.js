const mongoose = require('mongoose');

const workflowItemSchema = new mongoose.Schema({
    wf_id: { type: String, required: true, unique: true },
    document_name: { type: String, required: true },
    department: { type: String, required: true },
    requested_by: { type: String, required: true },
    days_waiting: { type: Number, default: 0 },
    status: { type: String, default: 'pending' },
    priority: { type: String, default: 'medium' },
    type: { type: String },
    size: { type: String },
    description: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('WorkflowItem', workflowItemSchema);
