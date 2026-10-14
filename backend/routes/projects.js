const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const User = require('../models/User');
const Chunk = require('../models/Chunk');
const ChatHistory = require('../models/ChatHistory');
const { protect } = require('../middleware/auth');
const { awardXP } = require('../utils/xpService');
const { generateJSONContentWithFallback, generateContentWithFallback } = require('../utils/aiService');

// Isolated temporary upload directory
const UPLOAD_TEMP_DIR = path.join(os.tmpdir(), 'projectiq-uploads');
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create upload temp directory:', err);
  }
}

// Step 1: Storage setup - Saves uploaded file directly to disk instead of RAM
// This prevents server crashes from high memory usage on large files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `upload-${uniqueSuffix}.zip`);
  }
});

// Step 2: File type filter - Ensures only genuine .zip archives are accepted
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext !== '.zip') {
    return cb(new Error('Invalid file format. Only ZIP archives (.zip) are allowed.'), false);
  }
  const allowedMimetypes = [
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/octet-stream'
  ];
  if (file.mimetype && !allowedMimetypes.includes(file.mimetype.toLowerCase())) {
    return cb(new Error('Invalid file format. Disallowed archive MIME type.'), false);
  }
  cb(null, true);
};

// Step 3: Multer uploader configuration with 50MB maximum size limit
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
  fileFilter
});

// Step 4: Upload error handler - Catches file size errors and sends clear message to user
const handleMulterUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Uploaded file exceeds the maximum allowed size of 50MB. Please upload a smaller project archive.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to process uploaded file.'
      });
    }
    next();
  });
};

// Step 5: Magic bytes check - Reads first 4 bytes of file to make sure it's really a ZIP
// (Prevents someone renaming a text file or executable into a .zip)
const isValidZipHeader = (filePath) => {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    const bytesRead = fs.readSync(fd, buffer, 0, 4, 0);
    if (bytesRead < 4) return false;
    const magic = buffer.readUInt32LE(0);
    // 0x04034b50 represents the "PK" header signature of a valid ZIP archive
    return magic === 0x04034b50 || magic === 0x06054b50 || magic === 0x08074b50;
  } catch (err) {
    return false;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (e) {}
    }
  }
};

// Step 6: Cleanup helper - Deletes temporary ZIP and extracted folders so disk space stays clean
const safeCleanup = (filePath, dirPath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('[Cleanup] Failed to unlink temp archive:', filePath, e.message);
    }
  }
  if (dirPath && fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (e) {
      console.warn('[Cleanup] Failed to remove temp sandbox directory:', dirPath, e.message);
    }
  }
};

// Helper: Prioritize codebase files for analysis (Task 13)
const getFilePriority = (fileName) => {
  const name = fileName.toLowerCase();
  
  if (name.endsWith('package.json') || name.endsWith('requirements.txt') || name.endsWith('pom.xml') || name.endsWith('cargo.toml')) {
    return 100;
  }
  if (name.includes('readme.md') || name.includes('readme.txt')) {
    return 90;
  }
  const entryNames = ['app.js', 'server.js', 'index.js', 'main.py', 'index.ts', 'main.go', 'index.jsx', 'index.tsx'];
  if (entryNames.some(e => name.endsWith(e))) {
    return 80;
  }
  if (name.includes('/routes/') || name.includes('/routing/') || name.includes('route')) {
    return 70;
  }
  if (name.includes('/controllers/') || name.includes('controller')) {
    return 60;
  }
  if (name.includes('/services/') || name.includes('service')) {
    return 50;
  }
  if (name.includes('/models/') || name.includes('model') || name.includes('/schema/') || name.includes('schema')) {
    return 40;
  }
  if (name.includes('/middleware/') || name.includes('middleware')) {
    return 30;
  }
  if (name.includes('/config/') || name.includes('config') || name.endsWith('.env.example')) {
    return 20;
  }
  return 10;
};

// Helper: Programmatic Static Code Analyzer (Hybrid Phase 1, 2, 3) - Project Agnostic
const analyzeProjectFilesProgrammatically = (fileContentsMap, filePaths) => {
  const totalFiles = filePaths.length;
  let sourceFiles = 0;
  let linesOfCode = 0;
  const languageDistribution = {};
  const dependencies = [];
  const codeIssues = [];
  const dependencyGraph = [];
  const endpointRoutes = [];
  let apiEndpointsCount = 0;
  const techStackSet = new Set();

  const extensionMap = {
    'js': 'JavaScript', 'jsx': 'React JSX',
    'ts': 'TypeScript', 'tsx': 'React TSX',
    'py': 'Python', 'go': 'Go',
    'java': 'Java', 'kt': 'Kotlin',
    'php': 'PHP', 'cs': 'C#',
    'rs': 'Rust', 'rb': 'Ruby',
    'swift': 'Swift', 'dart': 'Dart',
    'cpp': 'C++', 'cc': 'C++', 'c': 'C', 'h': 'C/C++ Header',
    'html': 'HTML', 'css': 'CSS', 'sql': 'SQL'
  };

  // 1. Language and File Distribution checks
  filePaths.forEach(p => {
    const ext = p.split('.').pop().toLowerCase();
    if (extensionMap[ext]) {
      sourceFiles++;
      const lang = extensionMap[ext];
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      techStackSet.add(lang);
    }
  });

  let connectionStringFile = 'None';
  let dbType = 'None detected';
  const detectedTablesOrCollections = [];

  // 2. Scan file content for code smells, secrets, APIs, and import maps
  Object.keys(fileContentsMap).forEach(filePath => {
    const content = fileContentsMap[filePath];
    const ext = filePath.split('.').pop().toLowerCase();
    const lines = content.split('\n');
    linesOfCode += lines.length;

    // A. Verify large files (Code Smell)
    if (lines.length > 500) {
      codeIssues.push({
        filePath,
        line: 1,
        severity: 'Medium',
        issueType: 'Large File',
        message: `File exceeds 500 lines of code (${lines.length} lines). Consider modular breakdown.`
      });
    }

    // B. Hardcoded Secrets Check (Security Checker)
    const secretRegex = /(api_key|jwt_secret|password|client_secret|client_id|private_key|token|mongo_uri)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\:\/]{6,}['"`]/i;
    lines.forEach((lineText, idx) => {
      if (secretRegex.test(lineText)) {
        codeIssues.push({
          filePath,
          line: idx + 1,
          severity: 'High',
          issueType: 'Hardcoded Secret',
          message: `Potential hardcoded authentication credentials or API Key parameters detected.`
        });
      }
    });

    // C. Code Smells & Unsafe Patterns
    if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
      let tryCount = 0;
      let catchCount = 0;
      lines.forEach((lineText, idx) => {
        if (lineText.includes('try {')) tryCount++;
        if (lineText.includes('catch') || lineText.includes('.catch(')) catchCount++;
        if (lineText.includes('console.log(')) {
          codeIssues.push({
            filePath,
            line: idx + 1,
            severity: 'Low',
            issueType: 'Code Smell',
            message: `Active debug printing console.log() output statement.`
          });
        }
      });
      if (tryCount > catchCount) {
        codeIssues.push({
          filePath,
          line: 1,
          severity: 'Medium',
          issueType: 'Safety Risk',
          message: `Try-catch block count mismatch. Ensure all asynchronous exceptions are caught.`
        });
      }
    }

    if (ext === 'py') {
      lines.forEach((lineText, idx) => {
        if (lineText.includes('print(')) {
          codeIssues.push({
            filePath,
            line: idx + 1,
            severity: 'Low',
            issueType: 'Code Smell',
            message: `Active debug print() statement detected.`
          });
        }
      });
    }

    // D. Multi-Language Route Scanner (Project-Agnostic)
    // Node Express
    const expressApiRegex = /(router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`](\/[a-zA-Z0-9_\-\/\:]*)['"`]/g;
    let match;
    while ((match = expressApiRegex.exec(content)) !== null) {
      endpointRoutes.push({ path: match[3], method: match[2].toUpperCase(), handlerFile: filePath, type: 'REST Endpoint' });
      apiEndpointsCount++;
    }
    // Python (Flask/FastAPI)
    const pythonApiRegex = /@(app|router)\.(route|get|post|put|delete|patch)\s*\(\s*['"`](\/[a-zA-Z0-9_\-\/\:]*)['"`]/g;
    while ((match = pythonApiRegex.exec(content)) !== null) {
      endpointRoutes.push({ path: match[3], method: match[2] === 'route' ? 'GET/POST' : match[2].toUpperCase(), handlerFile: filePath, type: 'REST Endpoint' });
      apiEndpointsCount++;
    }
    // Django
    const djangoApiRegex = /path\s*\(\s*['"`]([a-zA-Z0-9_\-\/\:]*)['"`]/g;
    while ((match = djangoApiRegex.exec(content)) !== null) {
      endpointRoutes.push({ path: '/' + match[1], method: 'GET/POST', handlerFile: filePath, type: 'Web Route' });
      apiEndpointsCount++;
    }
    // Java Spring Boot
    const javaApiRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping)\s*\(\s*(?:value\s*=\s*)?['"`](\/[a-zA-Z0-9_\-\/\:]*)['"`]/g;
    while ((match = javaApiRegex.exec(content)) !== null) {
      const method = match[1] === 'RequestMapping' ? 'ANY' : match[1].replace('Mapping', '').toUpperCase();
      endpointRoutes.push({ path: match[2], method, handlerFile: filePath, type: 'REST Endpoint' });
      apiEndpointsCount++;
    }
    // Go routers
    const goApiRegex = /\.(GET|POST|PUT|DELETE|HandleFunc)\s*\(\s*['"`](\/[a-zA-Z0-9_\-\/\:]*)['"`]/g;
    while ((match = goApiRegex.exec(content)) !== null) {
      endpointRoutes.push({ path: match[2], method: match[1] === 'HandleFunc' ? 'GET/POST' : match[1].toUpperCase(), handlerFile: filePath, type: 'API Route' });
      apiEndpointsCount++;
    }

    // E. Dynamic Database Scanner
    const dbUriRegex = /(mongodb(?:\+srv)?:\/\/[a-zA-Z0-9_\-\.\:\/]+|mysql:\/\/[a-zA-Z0-9_\-\.\:\/]+|postgres(?:ql)?:\/\/[a-zA-Z0-9_\-\.\:\/]+|jdbc:[a-z0-9]+:\/\/[a-zA-Z0-9_\-\.\:\/]+)/i;
    const dbMatch = dbUriRegex.exec(content);
    if (dbMatch) {
      connectionStringFile = filePath;
      if (dbMatch[1].startsWith('mongodb')) dbType = 'MongoDB';
      else if (dbMatch[1].startsWith('mysql')) dbType = 'MySQL';
      else if (dbMatch[1].startsWith('postgres')) dbType = 'PostgreSQL';
      else if (dbMatch[1].startsWith('jdbc:mysql')) dbType = 'MySQL';
      else if (dbMatch[1].startsWith('jdbc:postgresql')) dbType = 'PostgreSQL';
    }

    // Capture schemas / collections
    if (content.includes('mongoose.model') || content.includes('Schema({')) {
      const schemaMatch = /mongoose\.model\(\s*['"`]([a-zA-Z0-9_\-]+)['"`]/i.exec(content);
      if (schemaMatch) detectedTablesOrCollections.push(schemaMatch[1]);
    }
    if (content.includes('@Entity') || content.includes('@Table')) {
      const entityMatch = /@Table\(\s*name\s*=\s*['"`]([a-zA-Z0-9_\-]+)['"`]/i.exec(content);
      if (entityMatch) detectedTablesOrCollections.push(entityMatch[1]);
    }

    // F. Dependency graph (imports analysis across languages)
    const jsImportRegex = /(?:import\s+.*\s+from\s+|require\s*\(\s*)['"`]\.?\.?\/([a-zA-Z0-9_\-\.\/]+)['"`]/g;
    while ((match = jsImportRegex.exec(content)) !== null) {
      let targetFile = match[1];
      if (!targetFile.includes('.')) targetFile += '.js';
      dependencyGraph.push({ from: filePath, to: targetFile, relationType: 'imports' });
    }

    const pyImportRegex = /(?:import\s+|from\s+)([a-zA-Z0-9_\-\.]+)/g;
    while ((match = pyImportRegex.exec(content)) !== null) {
      dependencyGraph.push({ from: filePath, to: match[1], relationType: 'imports' });
    }

    const javaImportRegex = /import\s+([a-zA-Z0-9_\-\.]+);/g;
    while ((match = javaImportRegex.exec(content)) !== null) {
      dependencyGraph.push({ from: filePath, to: match[1], relationType: 'imports' });
    }
  });

  // 3. Dependency manifest parsers
  // Node.js package.json
  const pkgFile = Object.keys(fileContentsMap).find(k => k.endsWith('package.json'));
  if (pkgFile) {
    try {
      const pkg = JSON.parse(fileContentsMap[pkgFile]);
      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      dependencies.push(...deps, ...devDeps);
      if (deps.includes('react')) techStackSet.add('React');
      if (deps.includes('express')) techStackSet.add('Express');
      if (deps.includes('next')) techStackSet.add('Next.js');
      if (deps.includes('mongoose')) {
        techStackSet.add('MongoDB');
        dbType = 'MongoDB';
      }
    } catch (e) {}
  }

  // Python requirements.txt
  const reqFile = Object.keys(fileContentsMap).find(k => k.endsWith('requirements.txt'));
  if (reqFile) {
    const lines = fileContentsMap[reqFile].split('\n');
    lines.forEach(l => {
      const depName = l.split('==')[0].trim();
      if (depName && !depName.startsWith('#')) {
        dependencies.push(depName);
        if (depName.toLowerCase() === 'django') techStackSet.add('Django');
        if (depName.toLowerCase() === 'flask') techStackSet.add('Flask');
        if (depName.toLowerCase() === 'fastapi') techStackSet.add('FastAPI');
        if (depName.toLowerCase() === 'pymongo') {
          techStackSet.add('MongoDB');
          dbType = 'MongoDB';
        }
        if (depName.toLowerCase().includes('sql')) {
          techStackSet.add('SQL Database');
        }
      }
    });
  }

  // Rust Cargo.toml
  const cargoFile = Object.keys(fileContentsMap).find(k => k.endsWith('Cargo.toml'));
  if (cargoFile) {
    techStackSet.add('Rust');
    const lines = fileContentsMap[cargoFile].split('\n');
    let inDeps = false;
    lines.forEach(l => {
      const lineText = l.trim();
      if (lineText.startsWith('[dependencies]')) {
        inDeps = true;
      } else if (lineText.startsWith('[')) {
        inDeps = false;
      } else if (inDeps && lineText.includes('=')) {
        const dep = lineText.split('=')[0].trim();
        if (dep) dependencies.push(dep);
      }
    });
  }

  // Java Maven pom.xml
  const pomFile = Object.keys(fileContentsMap).find(k => k.endsWith('pom.xml'));
  if (pomFile) {
    techStackSet.add('Java');
    const content = fileContentsMap[pomFile];
    const depRegex = /<artifactId>([a-zA-Z0-9_\-]+)<\/artifactId>/g;
    let match;
    while ((match = depRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
      if (match[1].includes('spring-boot')) techStackSet.add('Spring Boot');
      if (match[1].includes('hibernate') || match[1].includes('jpa')) {
        techStackSet.add('JPA/Hibernate');
      }
    }
  }

  // PHP composer.json
  const composerFile = Object.keys(fileContentsMap).find(k => k.endsWith('composer.json'));
  if (composerFile) {
    techStackSet.add('PHP');
    try {
      const comp = JSON.parse(fileContentsMap[composerFile]);
      const req = Object.keys(comp.require || {});
      const reqDev = Object.keys(comp['require-dev'] || {});
      dependencies.push(...req, ...reqDev);
      if (req.includes('laravel/framework')) techStackSet.add('Laravel');
      if (req.includes('symfony/symfony')) techStackSet.add('Symfony');
    } catch (e) {}
  }

  // Go go.mod
  const goModFile = Object.keys(fileContentsMap).find(k => k.endsWith('go.mod'));
  if (goModFile) {
    techStackSet.add('Go');
    const lines = fileContentsMap[goModFile].split('\n');
    lines.forEach(l => {
      const lineText = l.trim();
      if (lineText.startsWith('require ') && !lineText.includes('(')) {
        const parts = lineText.split(/\s+/);
        if (parts[1]) dependencies.push(parts[1]);
      }
    });
  }

  // Clean list of detected tech stacks
  const finalTechStack = [...techStackSet];
  if (finalTechStack.length === 0) finalTechStack.push('Vanilla Codebase');

  // Generate dynamic Architecture Flow
  const architectureFlow = [];
  if (finalTechStack.some(t => ['React', 'Vue', 'Angular', 'HTML'].includes(t))) {
    architectureFlow.push({ from: 'Client Web View', to: 'API Gateway Router', relationType: 'JSON HTTP' });
  } else {
    architectureFlow.push({ from: 'Client Console / HTTP Request', to: 'Entry Controller Router', relationType: 'Requests' });
  }

  if (apiEndpointsCount > 0) {
    architectureFlow.push({ from: 'API Gateway Router', to: 'Controller Logic layer', relationType: 'Route mapping' });
    architectureFlow.push({ from: 'Controller Logic layer', to: 'Data Access Entity models', relationType: 'Context calls' });
  } else {
    architectureFlow.push({ from: 'Entry Controller Router', to: 'Data Access Entity models', relationType: 'Procedural calls' });
  }

  if (dbType !== 'None detected') {
    architectureFlow.push({ from: 'Data Access Entity models', to: `Database Core (${dbType})`, relationType: 'Persist queries' });
  }

  // G. Dynamic Project Modules Detection (Grounded in Actual Scanned Files)
  const modules = detectProjectModules(fileContentsMap, filePaths, dependencyGraph, finalTechStack, dependencies);

  return {
    techStack: finalTechStack,
    dependencies: [...new Set(dependencies)].slice(0, 30),
    apiEndpointsCount,
    codeIssues: codeIssues.slice(0, 15),
    dependencyGraph: dependencyGraph.slice(0, 20),
    linesOfCode,
    totalFiles,
    sourceFiles,
    languageDistribution,
    architectureFlow,
    endpointRoutes,
    databaseInfo: {
      dbType,
      connectionStringFile,
      detectedTablesOrCollections: [...new Set(detectedTablesOrCollections)]
    },
    modules
  };
};

// Helper: Extract actual project modules deterministically from codebase files & AST patterns
const detectProjectModules = (fileContentsMap = {}, filePaths = [], dependencyGraph = [], techStack = [], globalDependencies = []) => {
  const detectedModules = [];
  const processedFiles = new Set();

  // Helper to extract classes/components and primary functions from file contents
  const extractClassesAndExports = (filesList) => {
    const symbols = new Set();
    filesList.forEach(fp => {
      const code = fileContentsMap[fp] || '';
      if (!code) return;
      // Class declarations
      const classRegex = /class\s+([A-Z][a-zA-Z0-9_]+)/g;
      let m;
      while ((m = classRegex.exec(code)) !== null) {
        symbols.add(m[1]);
      }
      // React components / functions
      const compRegex = /(?:export\s+(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9_]+))/g;
      while ((m = compRegex.exec(code)) !== null) {
        symbols.add(m[1]);
      }
      // Regular exported functions / routers
      const fnRegex = /(?:exports\.([a-zA-Z0-9_]+)\s*=|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\()/g;
      while ((m = fnRegex.exec(code)) !== null) {
        const fnName = m[1] || m[2];
        if (fnName && !['req', 'res', 'next', 'error', 'err', 'require', 'router'].includes(fnName)) {
          symbols.add(fnName);
        }
      }
    });
    return Array.from(symbols).slice(0, 8);
  };

  // Helper to find specific package dependencies used by a set of files
  const extractFileDependencies = (filesList) => {
    const deps = new Set();
    filesList.forEach(fp => {
      const code = fileContentsMap[fp] || '';
      if (!code) return;
      globalDependencies.forEach(dep => {
        if (code.includes(`'${dep}'`) || code.includes(`"${dep}"`) || code.includes(`from '${dep}'`) || code.includes(`require('${dep}')`)) {
          deps.add(dep);
        }
      });
    });
    return Array.from(deps);
  };

  // Architectural category definitions
  const categories = [
    {
      key: 'controllers',
      name: 'API Controllers & Request Handlers',
      match: (p) => /controller/i.test(p) || (/\/handlers?\//i.test(p) && !/\/middleware/i.test(p)),
      purpose: 'Processes incoming HTTP requests, performs input parameter validation, orchestrates domain logic, and serializes response payloads.',
      techs: techStack.filter(t => ['Express', 'Node.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Go', 'PHP'].includes(t)),
      defaultConnections: ['Called by API Routing module to handle endpoint requests', 'Queries Data Models to fetch and persist data', 'Uses Middleware for authentication and validation'],
      explanation: 'In a technical interview, describe this as the controller/handler layer in MVC or layered architectures. It keeps HTTP-specific logic (status codes, headers, body parsing) isolated from persistence and UI logic.'
    },
    {
      key: 'models',
      name: 'Data Models & Persistence Layer',
      match: (p) => /models?\//i.test(p) || /schemas?\//i.test(p) || /entities?\//i.test(p) || /_model\./i.test(p),
      purpose: 'Encapsulates database schemas, document definitions, validation rules, indexing structures, and relational entity mappings.',
      techs: techStack.filter(t => ['MongoDB', 'Mongoose', 'PostgreSQL', 'MySQL', 'Prisma', 'Sequelize', 'SQL', 'Hibernate'].includes(t)),
      defaultConnections: ['Queried by API Controllers and Service layers', 'Communicates with database engine for CRUD transactions', 'Enforces schema validation rules on data entry'],
      explanation: 'In interviews, explain this as the single source of truth for your application entities. It guarantees type safety, data integrity, and separates database querying from presentation logic.'
    },
    {
      key: 'routes',
      name: 'Routing & Endpoint Dispatchers',
      match: (p) => /routes?\//i.test(p) || /routing\//i.test(p) || /urls\.py/i.test(p) || /router\./i.test(p),
      purpose: 'Registers REST endpoints and URI patterns, mapping incoming HTTP methods (GET, POST, PUT, DELETE) to specific controller actions.',
      techs: techStack.filter(t => ['Express', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'Laravel', 'Go'].includes(t)),
      defaultConnections: ['Receives incoming client HTTP traffic', 'Attaches Middleware security guards (JWT, CORS, rate limits)', 'Dispatches validated requests to API Controllers'],
      explanation: 'This module defines the external API contract. Interviewers often ask how routes are structured, versioned, and secured against unauthorized access.'
    },
    {
      key: 'middleware',
      name: 'Middleware & Security Guards',
      match: (p) => /middlewares?\//i.test(p) || /auth\//i.test(p) || /guards?\//i.test(p) || /interceptors?\//i.test(p),
      purpose: 'Intercepts HTTP traffic to enforce JWT authentication, authorization policies, CORS configuration, and centralized error handling.',
      techs: techStack.filter(t => ['JWT', 'Express', 'Node.js', 'Python', 'Spring Boot'].includes(t)),
      defaultConnections: ['Intercepts requests across API Routing endpoints', 'Decodes and verifies user identity tokens (JWT)', 'Catches unhandled errors and formats centralized error responses'],
      explanation: 'Acts as a pipeline filter. Explain to interviewers how this module prevents unauthorized access and stops invalid requests before they reach core business logic.'
    },
    {
      key: 'services',
      name: 'Domain Services & Business Logic',
      match: (p) => /services?\//i.test(p) || /managers?\//i.test(p) || /usecases?\//i.test(p) || /core\//i.test(p),
      purpose: 'Implements core business rules, algorithms, third-party API integrations, and complex transactional workflows.',
      techs: techStack,
      defaultConnections: ['Invoked by API Controllers to execute business operations', 'Queries Data Models for atomic persistence', 'Interacts with external APIs and services'],
      explanation: 'This layer implements pure business rules. Decoupling it from controllers ensures high testability, reuse across multiple endpoints, and clean separation of concerns.'
    },
    {
      key: 'ui',
      name: 'Client Presentation & UI Views',
      match: (p) => /\.(jsx|tsx|vue|svelte)$/i.test(p) || /components?\//i.test(p) || /pages?\//i.test(p) || /views?\//i.test(p) || /screens?\//i.test(p),
      purpose: 'Renders reactive user interfaces, manages component lifecycle and state, captures user interactions, and coordinates API queries.',
      techs: techStack.filter(t => ['React', 'React JSX', 'React TSX', 'Vue', 'Angular', 'Svelte', 'HTML', 'CSS', 'Next.js'].includes(t)),
      defaultConnections: ['Sends asynchronous HTTP requests to backend API Routes', 'Consumes JSON payloads and updates reactive component state', 'Renders interactive user views and form controls'],
      explanation: 'Explain this as the frontend presentation layer. It manages unidirectional data flow, handles user interactions, and consumes backend REST endpoints.'
    },
    {
      key: 'utils',
      name: 'Shared Utilities & Helper Libraries',
      match: (p) => /utils?\//i.test(p) || /helpers?\//i.test(p) || /lib\//i.test(p) || /common\//i.test(p),
      purpose: 'Provides reusable helper routines, string manipulation tools, cryptographic helpers, logging, and mathematical utilities.',
      techs: techStack,
      defaultConnections: ['Imported by Controllers, Middleware, and Services for shared functionality', 'Provides standardized formatting, logging, and token generation'],
      explanation: 'Shared utility modules prevent code duplication (DRY principle). They encapsulate stateless, pure functions that are easily unit-tested.'
    },
    {
      key: 'config',
      name: 'Configuration & Build Setup',
      match: (p) => /config/i.test(p) || /settings\.py/i.test(p) || /vite\.config/i.test(p) || /webpack/i.test(p) || /package\.json/i.test(p),
      purpose: 'Initializes environment variables, database connections, server ports, build bundlers, and package dependencies.',
      techs: techStack,
      defaultConnections: ['Loaded during Application Bootstrap', 'Supplies connection strings and environment keys to Database and Security modules'],
      explanation: 'Centralizing configurations ensures 12-factor application compliance by keeping credentials and environment-specific settings out of source code.'
    },
    {
      key: 'bootstrap',
      name: 'Application Entry & Bootstrap',
      match: (p) => /(server|app|index|main)\.(js|ts|py|go|java)$/i.test(p),
      purpose: 'Serves as the root entry point: bootstraps runtime configurations, registers routes and middlewares, and binds network socket listeners.',
      techs: techStack,
      defaultConnections: ['Initializes and launches the runtime server', 'Mounts API Routing Dispatchers and Middleware guards', 'Establishes database connection pools'],
      explanation: 'The initial bootstrap file executed by the runtime. Explain how it orchestrates dependency injection, middleware registration, and server port binding.'
    }
  ];

  // Group files into categories
  const fileToModuleMap = {};

  categories.forEach(cat => {
    const matchedFiles = filePaths.filter(p => cat.match(p) && !processedFiles.has(p));
    if (matchedFiles.length > 0) {
      matchedFiles.forEach(f => {
        processedFiles.add(f);
        fileToModuleMap[f] = cat.name;
        fileToModuleMap[f.split('/').pop()] = cat.name;
      });

      const classesOrComponents = extractClassesAndExports(matchedFiles);
      const moduleDeps = extractFileDependencies(matchedFiles);

      detectedModules.push({
        name: cat.name,
        purpose: cat.purpose,
        techs: cat.techs.length > 0 ? cat.techs : techStack.slice(0, 3),
        files: matchedFiles,
        dependencies: moduleDeps.length > 0 ? moduleDeps : globalDependencies.slice(0, 4),
        connections: cat.defaultConnections,
        explanation: cat.explanation,
        classesOrComponents
      });
    }
  });

  // Check remaining files - if any folder has 2+ remaining files, create a domain module
  const remainingFiles = filePaths.filter(p => !processedFiles.has(p));
  const folderBuckets = {};
  remainingFiles.forEach(p => {
    const parts = p.split('/');
    if (parts.length > 1) {
      const folder = parts[0] === 'src' && parts.length > 2 ? parts[1] : parts[0];
      if (!['node_modules', 'dist', 'build', '.git'].includes(folder.toLowerCase())) {
        folderBuckets[folder] = folderBuckets[folder] || [];
        folderBuckets[folder].push(p);
      }
    }
  });

  Object.keys(folderBuckets).forEach(folder => {
    const files = folderBuckets[folder];
    if (files.length >= 2) {
      files.forEach(f => processedFiles.add(f));
      const formattedName = folder.charAt(0).toUpperCase() + folder.slice(1) + ' Module';
      detectedModules.push({
        name: formattedName,
        purpose: `Encapsulates ${folder}-related features and functional routines across ${files.length} project files.`,
        techs: techStack.slice(0, 3),
        files,
        dependencies: extractFileDependencies(files),
        connections: [`Interacts with core application modules across ${folder} directory`],
        explanation: `This domain module organizes feature-specific logic within the ${folder} directory, grouping related functions and components together.`,
        classesOrComponents: extractClassesAndExports(files)
      });
    }
  });

  // If still empty or 0 modules found, fallback to entry files grouping
  if (detectedModules.length === 0) {
    const allFiles = filePaths.slice(0, 10);
    detectedModules.push({
      name: 'Core Application Module',
      purpose: `Orchestrates main project logic across ${filePaths.length} scanned repository files.`,
      techs: techStack,
      files: allFiles,
      dependencies: globalDependencies.slice(0, 5),
      connections: ['Manages primary project execution flow and script imports'],
      explanation: 'The primary functional module containing the application entry files and source scripts.',
      classesOrComponents: extractClassesAndExports(allFiles)
    });
  }

  // Enrich connections using dependencyGraph
  detectedModules.forEach(mod => {
    const dynamicConn = [];
    mod.files.forEach(file => {
      const baseName = file.split('/').pop();
      dependencyGraph.forEach(edge => {
        if (edge.from === file || edge.from.endsWith(baseName)) {
          const targetBase = edge.to.split('/').pop();
          const targetModName = fileToModuleMap[edge.to] || fileToModuleMap[targetBase];
          if (targetModName && targetModName !== mod.name) {
            dynamicConn.push(`Imports from ${targetModName} (${targetBase})`);
          }
        }
      });
    });
    if (dynamicConn.length > 0) {
      mod.connections = [...new Set([...dynamicConn, ...mod.connections])].slice(0, 4);
    }
  });

  return detectedModules;
};

// Helper: Build directory trees in memory from path arrays
const buildTree = (paths) => {
  const root = { name: 'root', type: 'directory', children: [] };
  paths.forEach(p => {
    const parts = p.split('/').filter(x => x);
    let current = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1 && !p.endsWith('/');
      let existing = current.children.find(c => c.name === part);
      if (!existing) {
        existing = { name: part, type: isFile ? 'file' : 'directory' };
        if (!isFile) existing.children = [];
        current.children.push(existing);
      }
      current = existing;
    });
  });
  return root.children[0] || root;
};

// Sensitive and Binary assets checker (Phase 5 Security)
const isSensitiveOrBinary = (fileName) => {
  const lowerName = fileName.toLowerCase();
  
  const sensitivePatterns = [
    '.env', 'config.env', 'secrets', '.pem', '.key', '.crt', '.cer', '.pfx', '.p12',
    'id_rsa', 'id_dsa', 'credentials', 'token', '.passwd'
  ];
  if (sensitivePatterns.some(p => lowerName.includes(p))) return true;

  const ignoredFolders = [
    'node_modules/', 'dist/', 'build/', '.git/', 'venv/', '.venv/', 
    '__pycache__/', '.next/', 'out/', 'target/'
  ];
  if (ignoredFolders.some(f => lowerName.includes(f))) return true;

  const excludedExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'pdf', 'zip', 'tar', 'gz', 'rar',
    'mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'exe', 'dll', 'so', 'bin', 'dmg', 'class',
    'jar', 'war', 'db', 'sqlite', 'log'
  ];
  const ext = lowerName.split('.').pop();
  if (excludedExtensions.includes(ext)) return true;

  return false;
};

// Helper: Segment code into overlapping chunks (RAG Phase 9)
const createChunks = (content, filePath) => {
  const lines = content.split('\n');
  const chunks = [];
  const chunkSize = 40;
  const overlap = 10;
  
  for (let i = 0; i < lines.length; i += (chunkSize - overlap)) {
    const chunkLines = lines.slice(i, i + chunkSize);
    chunks.push(chunkLines.join('\n'));
    if (i + chunkSize >= lines.length) break;
  }
  return chunks;
};

// Helper: Query Gemini embedding model (gemini-embedding-2) (Strictly production-ready)
const getEmbedding = async (text, apiKey) => {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please configure it in your backend environment variables.');
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(text);
    if (!result || !result.embedding || !result.embedding.values) {
      throw new Error('Failed to retrieve valid embeddings values from Gemini API.');
    }
    return result.embedding.values;
  } catch (err) {
    throw new Error('Gemini embedding generation failed: ' + err.message);
  }
};

// Helper: Compute cosine similarity between two float vectors
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Helper: Safely parse JSON from Gemini markdown wrappers
const safeJsonParse = (text) => {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    throw new Error('Malformed AI response. Failed to parse valid JSON payload.');
  }
};

// Helper: Generate content with 2 retries and 2s delay on JSON validation or API failure (Task 18)
const generateAIContentWithRetry = async (model, prompt, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const parsed = safeJsonParse(result.response.text());
      return parsed;
    } catch (err) {
      if (i === retries) {
        throw new Error('AI content parsing failed consistently: ' + err.message);
      }
      console.warn(`[AI-Retry] Attempt ${i + 1} failed. Retrying in 2 seconds... Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// @route   POST /api/projects/upload
// @desc    Upload ZIP file, run programmatic static scanning, store analysis stats, and run Gemini Hybrid analysis (USP)
router.post('/upload', protect, handleMulterUpload, async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a ZIP file.' });

  const uploadedFilePath = req.file.path;
  let extractionSandboxDir = null;

  try {
    // 1. Verify file extension
    if (!req.file.originalname.toLowerCase().endsWith('.zip')) {
      return res.status(400).json({ success: false, message: 'Invalid file format. Upload must be a valid ZIP archive.' });
    }

    // 2. Binary magic byte check on disk (prevents non-ZIP files disguised as .zip)
    if (!isValidZipHeader(uploadedFilePath)) {
      return res.status(400).json({ success: false, message: 'Invalid file format. Upload must be a valid ZIP archive.' });
    }

    // 3. Isolated sandbox directory for extraction
    const sandboxId = `sandbox-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    extractionSandboxDir = path.join(UPLOAD_TEMP_DIR, sandboxId);
    fs.mkdirSync(extractionSandboxDir, { recursive: true });
    const resolvedSandboxDir = path.resolve(extractionSandboxDir);

    // 4. Inspect ZIP entries directly from disk
    const zip = new AdmZip(uploadedFilePath);
    const zipEntries = zip.getEntries();

    // 5. ZIP Bomb Protections
    const MAX_ENTRIES = 2000;
    const MAX_EXTRACTED_SIZE = 200 * 1024 * 1024; // 200 MB
    const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

    if (zipEntries.length > MAX_ENTRIES) {
      return res.status(400).json({ success: false, message: 'Security Alert: ZIP contains too many files (max 2000).' });
    }

    let totalUncompressedSize = 0;
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const size = entry.header ? entry.header.size : (entry.entryName ? entry.entryName.length : 0);
        if (size > MAX_SINGLE_FILE_SIZE) {
          return res.status(400).json({ success: false, message: `Security Alert: File ${entry.entryName} exceeds single file size limit (max 50MB).` });
        }
        totalUncompressedSize += size;
      }
    }

    if (totalUncompressedSize > MAX_EXTRACTED_SIZE) {
      return res.status(400).json({ success: false, message: 'Security Alert: Total extracted size exceeds limit (max 200MB).' });
    }
    
    const filePaths = [];
    let packageJsonContent = '';
    const fileContentsMap = {};

    // Sort zipEntries by priority (Task 13)
    const sortedEntries = [...zipEntries].sort((a, b) => {
      return getFilePriority(b.entryName) - getFilePriority(a.entryName);
    });

    for (const entry of sortedEntries) {
      if (!entry.isDirectory) {
        const entryName = entry.entryName;

        // 6. Path Traversal, Null Byte & Zip Slip Protections
        if (entryName.includes('\0')) {
          return res.status(400).json({
            success: false,
            message: 'Security Alert: Null byte detected in ZIP entry path.'
          });
        }

        if (
          entryName.includes('..') ||
          entryName.includes('\\..') ||
          entryName.includes('/..') ||
          entryName.startsWith('/') ||
          entryName.startsWith('\\') ||
          /^[a-zA-Z]:/.test(entryName) ||
          path.isAbsolute(entryName)
        ) {
          return res.status(400).json({
            success: false,
            message: `Security Alert: Suspicious file path detected in ZIP entry: ${entryName}`
          });
        }

        // Ignore/Skip symbolic links to prevent escaping extraction sandbox
        if (entry.isSymbolicLink || (entry.attr && (entry.attr >>> 16) & 0o120000) === 0o120000) {
          continue;
        }

        // Verify resolved path remains strictly within the extraction sandbox
        const safeNormalizedPath = path.normalize(entryName).replace(/^(\.\.[\/\\])+/, '');
        const targetResolvedPath = path.resolve(resolvedSandboxDir, safeNormalizedPath);
        if (!targetResolvedPath.startsWith(resolvedSandboxDir + path.sep)) {
          return res.status(400).json({
            success: false,
            message: `Security Alert: Path traversal attempt detected outside target sandbox: ${entryName}`
          });
        }

        // 7. Sensitive file filtering
        if (isSensitiveOrBinary(entryName)) {
          continue; 
        }

        filePaths.push(entryName);

        if (entryName.endsWith('package.json')) {
          packageJsonContent = entry.getData().toString('utf8');
        }

        const ext = entryName.split('.').pop().toLowerCase();
        const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'php', 'rb', 'cpp', 'h', 'c', 'cs', 'kt', 'json', 'rs', 'swift', 'dart', 'html', 'css', 'sql'];
        
        // Extract key script contents (limit size for memory buffer parsing)
        if (codeExtensions.includes(ext) && Object.keys(fileContentsMap).length < 25) {
          const content = entry.getData().toString('utf8');
          fileContentsMap[entryName] = content;
        }
      }
    }

    if (filePaths.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid source code files found in the project ZIP.' });
    }

    const folderStructure = buildTree(filePaths);

    // 8. Executing Programmatic / Static Analysis (Hybrid Core)
    const staticAnalysis = analyzeProjectFilesProgrammatically(fileContentsMap, filePaths);

    const apiKey = process.env.GEMINI_API_KEY;
    let aiResult;

    if (!apiKey) {
      console.warn('[IQ-Backend] GEMINI_API_KEY is missing. Using static analysis fallback mode.');
      aiResult = {
        name: req.file.originalname.replace('.zip', '').replace(/[-_]/g, ' '),
        description: `Analyzed programmatically. Identified ${staticAnalysis.techStack.join(', ')} frameworks. Holds ${staticAnalysis.linesOfCode} lines of code.`,
        metrics: {
          understanding: 85,
          interviewReadiness: 60,
          confidence: 70,
          architecture: 80
        },
        importantFiles: Object.keys(fileContentsMap).slice(0, 3).map(fileName => ({
          name: fileName,
          purpose: 'Source Module Script',
          explanation: `Programmatic scanner isolated ${fileName} comprising lines imports mappings.`,
          code: fileContentsMap[fileName].slice(0, 1500)
        })),
        modules: staticAnalysis.modules
      };
    } else {
      // Feed static analysis results as structured factual inputs to Gemini
      let codeSummariesPrompt = '';
      Object.keys(fileContentsMap).forEach(fileName => {
        codeSummariesPrompt += `\n\n--- FILE: ${fileName} ---\n${fileContentsMap[fileName].slice(0, 1500)}`;
      });

      // strict grounding instructions added (Task 14)
      const prompt = `
You are a Lead Software Architect reviewing a project.
I have run a local programmatic static analyzer on the ZIP files and extracted these facts:
- Total Files: ${staticAnalysis.totalFiles}
- Source Code Files: ${staticAnalysis.sourceFiles}
- Total Lines of Code: ${staticAnalysis.linesOfCode}
- Detected Languages: ${JSON.stringify(staticAnalysis.languageDistribution)}
- Extracted Dependencies: ${JSON.stringify(staticAnalysis.dependencies)}
- API Endpoints Count: ${staticAnalysis.apiEndpointsCount}
- Programmatic Code Quality Issues: ${JSON.stringify(staticAnalysis.codeIssues)}
- File dependency relationships: ${JSON.stringify(staticAnalysis.dependencyGraph)}

Here are some actual files content code:
${codeSummariesPrompt}

Strict Grounding Instructions:
1. Use only the supplied project information and code context.
2. Do not invent files, APIs, features, databases, authentication mechanisms, libraries or architectural components that are not present.
3. If information is unavailable, explicitly state that it is unavailable.
4. Distinguish between: (1) Observed implementation, (2) Inferred architecture, (3) Recommended improvement.

Analyze the project facts and return a JSON object strictly matching this format (no markdown blocks, no leading \`\`\`json, just pure JSON text):
{
  "name": "Clean name of the project",
  "description": "2-3 sentence project description summarizing what it is and what it does.",
  "metrics": {
    "understanding": 88,
    "interviewReadiness": 75,
    "confidence": 80,
    "architecture": 90
  },
  "importantFiles": [
    {
      "name": "path/to/file.js",
      "purpose": "1-5 word summary of purpose",
      "explanation": "A paragraph explaining exactly what this file does in the architecture, including key functions, hooks, or configurations used.",
      "code": "A matching snippet of code from that file."
    }
  ],
  "modules": [
    {
      "name": "Module Name (e.g. API Controllers & Handlers)",
      "purpose": "1-2 sentence description of module purpose and responsibility in the architecture",
      "techs": ["Express", "Node.js"],
      "files": ["backend/controllers/authController.js"],
      "classesOrComponents": ["AuthController", "loginUser", "registerUser"],
      "dependencies": ["jsonwebtoken", "bcrypt"],
      "connections": ["Called by API Routing module to handle endpoint requests", "Queries Data Models module to persist data"],
      "explanation": "Clear, student-friendly explanation of how this module works in this project and why it is organized this way."
    }
  ]
}
`;

      const aiResponse = await generateJSONContentWithFallback(prompt, req.user);
      aiResult = aiResponse.data;
    }

    // Combine static analysis parameters and AI narrative explanations
    const finalModules = (aiResult.modules && aiResult.modules.length > 0 && aiResult.modules[0].name !== 'Core Codebase Bundle')
      ? aiResult.modules.map(m => {
          const staticMatch = staticAnalysis.modules.find(sm => sm.name.toLowerCase() === m.name.toLowerCase() || (sm.files && m.files && sm.files.some(f => m.files.includes(f))));
          return {
            name: m.name,
            purpose: m.purpose,
            techs: m.techs?.length > 0 ? m.techs : (staticMatch?.techs || staticAnalysis.techStack.slice(0, 3)),
            files: m.files?.length > 0 ? m.files : (staticMatch?.files || []),
            dependencies: m.dependencies?.length > 0 ? m.dependencies : (staticMatch?.dependencies || []),
            connections: m.connections?.length > 0 ? m.connections : (staticMatch?.connections || []),
            explanation: m.explanation || staticMatch?.explanation || m.purpose,
            classesOrComponents: m.classesOrComponents?.length > 0 ? m.classesOrComponents : (staticMatch?.classesOrComponents || [])
          };
        })
      : staticAnalysis.modules;

    const project = await Project.create({
      user: req.user.id,
      name: aiResult.name || req.file.originalname.replace('.zip', ''),
      description: aiResult.description || 'AI analyzed project structure',
      techStack: staticAnalysis.techStack.length > 0 ? staticAnalysis.techStack : (aiResult.techStack || ['General']),
      status: 'Analyzed',
      understanding: aiResult.metrics?.understanding || 85,
      metrics: {
        understanding: aiResult.metrics?.understanding || 85,
        interviewReadiness: aiResult.metrics?.interviewReadiness || 70,
        confidence: aiResult.metrics?.confidence || 75,
        architecture: aiResult.metrics?.architecture || 80,
        
        // Save static counts (Phase 8 integration)
        totalFiles: staticAnalysis.totalFiles,
        sourceFiles: staticAnalysis.sourceFiles,
        linesOfCode: staticAnalysis.linesOfCode,
        apiEndpointsCount: staticAnalysis.apiEndpointsCount,
        codeIssuesCount: staticAnalysis.codeIssues.length
      },
      languageDistribution: staticAnalysis.languageDistribution,
      dependencies: staticAnalysis.dependencies,
      codeIssues: staticAnalysis.codeIssues,
      dependencyGraph: staticAnalysis.dependencyGraph,
      folderStructure,
      importantFiles: aiResult.importantFiles || [],
      modules: finalModules,
      architectureFlow: staticAnalysis.architectureFlow,
      endpointRoutes: staticAnalysis.endpointRoutes,
      databaseInfo: staticAnalysis.databaseInfo
    });

    // Step 9: Ingest code chunks and embeddings for AI question-answering (RAG search)
    console.log(`[RAG-Ingest] Chunking source scripts for project: ${project.name}`);
    for (const fileName of Object.keys(fileContentsMap)) {
      const ext = fileName.split('.').pop().toLowerCase();
      const chunks = createChunks(fileContentsMap[fileName], fileName);
      
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunkText = chunks[idx];
        const embedding = await getEmbedding(chunkText, apiKey);
        
        await Chunk.create({
          user: req.user.id,
          project: project._id,
          filePath: fileName,
          language: ext,
          content: chunkText,
          embedding: embedding,
          chunkIndex: idx
        });
      }
    }
    console.log(`[RAG-Ingest] Completed embedding ingestion for ${Object.keys(fileContentsMap).length} files.`);

    // Step 10: Award 300 XP to the user for successfully analyzing their project
    const user = await User.findById(req.user.id);
    if (user) {
      await awardXP(user, 300, 'first_analysis');
    }

    // Step 11: Send back the analyzed project details
    res.status(201).json(project);
  } catch (error) {
    next(error);
  } finally {
    // Step 12: Always clean up temporary files from disk (runs on success or failure)
    safeCleanup(uploadedFilePath, extractionSandboxDir);
  }
});

// @route   GET /api/projects/
router.get('/', protect, async (req, res, next) => {
  try {
    const list = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// Helper to recursively collect file paths from folderStructure
const extractPathsFromTree = (node, currentPath = '') => {
  if (!node) return [];
  const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
  if (node.type === 'file') return [fullPath];
  let files = [];
  if (node.children) {
    node.children.forEach(child => {
      files.push(...extractPathsFromTree(child, fullPath));
    });
  }
  return files;
};

// @route   GET /api/projects/:id/modules
// @desc    Retrieve or enrich detailed modules for a project
router.get('/:id/modules', protect, async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check if project already has rich modules
    const hasRichModules = project.modules && 
      project.modules.length > 0 && 
      project.modules[0].name !== 'Core Codebase Bundle' &&
      project.modules.some(m => m.connections && m.connections.length > 0);

    if (hasRichModules) {
      return res.json(project.modules);
    }

    // Reconstruct file paths from folderStructure or importantFiles
    let allFilePaths = extractPathsFromTree(project.folderStructure);
    if (allFilePaths.length === 0 && project.importantFiles) {
      allFilePaths = project.importantFiles.map(f => f.name);
    }

    const fileContentsMap = {};
    if (project.importantFiles) {
      project.importantFiles.forEach(f => {
        fileContentsMap[f.name] = f.code || '';
      });
    }

    const enrichedModules = detectProjectModules(
      fileContentsMap,
      allFilePaths,
      project.dependencyGraph || [],
      project.techStack || [],
      project.dependencies || []
    );

    project.modules = enrichedModules;
    await project.save();

    res.json(project.modules);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects/:id/chat
// @desc    RAG similarity retrieval context AI chat using Mongoose (Phase 9/10/11)
router.post('/:id/chat', protect, async (req, res, next) => {
  const { question } = req.body;
  const projectId = req.params.id;

  try {
    // IDOR Protection (Task 7 & 8)
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Generate query embedding vector (throws errors securely if key missing)
    const queryVector = await getEmbedding(question, apiKey);

    // 2. Retrieve only chunks matching active user + project scope (Task 8)
    const chunks = await Chunk.find({ project: projectId, user: req.user.id });

    // 3. Compute cosine similarity metrics in JS
    const scored = chunks.map(c => ({
      chunk: c,
      similarity: cosineSimilarity(queryVector, c.embedding)
    }));

    // 4. Retrieve top 4 matching blocks
    const topChunks = scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 4);

    let retrievedContext = '';
    topChunks.forEach((item, index) => {
      retrievedContext += `\n\n--- RETRIEVED CODE CHUNK ${index + 1} (File: ${item.chunk.filePath}) ---\n${item.chunk.content}`;
    });

    let answerText = '';

    if (!apiKey) {
      answerText = `[Fallback Offline Mode] I analyzed your **${project.techStack.join(', ')}** project files. Based on retrieved code chunks, directories contain modular bindings. Connect your Gemini API Key to enable complete chat evaluations.`;
      if (question.toLowerCase().includes('architecture')) {
        answerText = `Based on retrieved files like \`${project.importantFiles[0]?.name || 'server.js'}\`, your app follows modular layered routes structures communicating through API gateways.`;
      }
    } else {
      // strict grounding instructions added (Task 14)
      const promptContext = `
You are an expert AI software coding mentor.
The developer is asking a question about their project: "${project.name}".
We have performed a RAG vector similarity search and retrieved these relevant code blocks from their repository:
${retrievedContext}

Developer's Question: "${question}"

Strict Grounding Instructions:
1. Use only the supplied project information and code context.
2. Do not invent files, APIs, features, databases, or libraries that are not present.
3. If information is unavailable, explicitly state that it is unavailable.

Using the retrieved codebase context, answer the developer's question accurately. Mention filenames, parameters, and design logic found in the code chunks.
Use markdown formatting for lists, bolding, and inline code blocks.
`;

      const aiResponse = await generateContentWithFallback(promptContext, req.user);
      answerText = aiResponse.text;
    }

    // 5. Persist dialogue in MongoDB ChatHistory (Phase 11)
    let history = await ChatHistory.findOne({ project: projectId, user: req.user.id });
    if (!history) {
      history = await ChatHistory.create({
        user: req.user.id,
        project: projectId,
        messages: []
      });
    }

    history.messages.push({ sender: 'user', text: question });
    history.messages.push({ sender: 'bot', text: answerText });
    await history.save();

    // Return RAG matched sources metadata to client (Task 19)
    res.json({
      text: answerText,
      sources: topChunks.map(item => ({
        file: item.chunk.filePath,
        similarity: parseFloat(item.similarity.toFixed(2))
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/projects/:id/chat
router.get('/:id/chat', protect, async (req, res, next) => {
  try {
    const history = await ChatHistory.findOne({ project: req.params.id, user: req.user.id });
    if (!history) {
      return res.json({ messages: [] });
    }
    res.json({ messages: history.messages });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
