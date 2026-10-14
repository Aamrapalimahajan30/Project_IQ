const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  chunkIndex: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Scope search indexes by project to isolate queries
ChunkSchema.index({ project: 1, user: 1 });

module.exports = mongoose.model('Chunk', ChunkSchema);
