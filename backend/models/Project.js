const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a project name']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  techStack: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Pending', 'Analyzing', 'Analyzed', 'Failed'],
    default: 'Pending'
  },
  understanding: {
    type: Number,
    default: 0
  },
  metrics: {
    understanding: { type: Number, default: 0 },
    interviewReadiness: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    architecture: { type: Number, default: 0 },
    
    // Programmatic metrics (Hybrid Phase 1)
    totalFiles: { type: Number, default: 0 },
    sourceFiles: { type: Number, default: 0 },
    linesOfCode: { type: Number, default: 0 },
    apiEndpointsCount: { type: Number, default: 0 },
    codeIssuesCount: { type: Number, default: 0 }
  },
  
  // Dynamic distributions and structures
  languageDistribution: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dependencies: {
    type: [String],
    default: []
  },
  codeIssues: [
    {
      filePath: { type: String, required: true },
      line: { type: Number, default: 0 },
      severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      issueType: { type: String, required: true },
      message: { type: String, required: true }
    }
  ],
  dependencyGraph: [
    {
      from: { type: String, required: true },
      to: { type: String, required: true },
      relationType: { type: String, default: 'imports' }
    }
  ],
  
  folderStructure: {
    type: mongoose.Schema.Types.Mixed
  },
  importantFiles: [
    {
      name: { type: String, required: true },
      purpose: { type: String, required: true },
      explanation: { type: String, required: true },
      code: { type: String, default: '' }
    }
  ],
  modules: [
    {
      name: { type: String, required: true },
      purpose: { type: String, required: true },
      techs: { type: [String], default: [] },
      files: { type: [String], default: [] },
      dependencies: { type: [String], default: [] },
      connections: { type: [String], default: [] },
      explanation: { type: String, default: '' },
      classesOrComponents: { type: [String], default: [] }
    }
  ],
  architectureFlow: [
    {
      from: { type: String, required: true },
      to: { type: String, required: true },
      relationType: { type: String, default: 'calls' }
    }
  ],
  endpointRoutes: [
    {
      path: { type: String, required: true },
      method: { type: String, required: true },
      handlerFile: { type: String },
      type: { type: String, default: 'API Route' }
    }
  ],
  databaseInfo: {
    dbType: { type: String, default: 'None detected' },
    connectionStringFile: { type: String },
    detectedTablesOrCollections: { type: [String], default: [] }
  },
  quizQuestions: {
    Easy: { type: [mongoose.Schema.Types.Mixed], default: [] },
    Medium: { type: [mongoose.Schema.Types.Mixed], default: [] },
    Hard: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  vivaQuestions: {
    Easy: { type: [mongoose.Schema.Types.Mixed], default: [] },
    Medium: { type: [mongoose.Schema.Types.Mixed], default: [] },
    Hard: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  interviewQuestions: {
    Easy: { type: [mongoose.Schema.Types.Mixed], default: [] },
    Medium: { type: [mongoose.Schema.Types.Mixed], default: [] },
    Hard: { type: [mongoose.Schema.Types.Mixed], default: [] }
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
