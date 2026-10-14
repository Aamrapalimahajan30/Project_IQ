const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const User = require('../models/User');
const LearningProgress = require('../models/LearningProgress');
const QuizAttempt = require('../models/QuizAttempt');
const VivaAttempt = require('../models/VivaAttempt');
const MockInterview = require('../models/MockInterview');
const { awardXP } = require('../utils/xpService');
const { generateJSONContentWithFallback } = require('../utils/aiService');

// Helper to generate evidence-based, project-specific multi-section roadmap modules
const buildProjectRoadmap = (project) => {
  const tech = project.techStack || [];
  const importantFiles = project.importantFiles || [];
  const keyFileNames = importantFiles.map(f => f.name.split('/').pop()).filter(Boolean);
  const endpoints = project.endpointRoutes || [];
  const modulesList = project.modules || [];
  const totalFiles = project.metrics?.totalFiles || 0;
  const loc = project.metrics?.linesOfCode || 0;
  const issues = project.codeIssues || [];
  const dbInfo = project.databaseInfo;
  const depGraph = project.dependencyGraph || [];
  const archFlow = project.architectureFlow || [];

  const roadmapModules = [];

  // ==========================================
  // Module 1: Project Architecture & Structure
  // ==========================================
  const primaryEntryFile = keyFileNames[0] || (importantFiles[0]?.name ? importantFiles[0].name.split('/').pop() : 'main script');
  const sampleEntryCode = importantFiles[0]?.code ? importantFiles[0].code.split('\n').slice(0, 15).join('\n') : `// Entry point initialization\n// Scanned files: ${totalFiles}\n// Tech: ${tech.join(', ')}`;

  roadmapModules.push({
    id: 'fundamental',
    name: `${project.name} Structure & Core Entry Points`,
    duration: '15 mins',
    difficulty: 'Easy',
    xp: 150,
    sections: [
      {
        title: '1. Concept & Fundamentals',
        subtitle: 'Core principles of project architecture and structure',
        content: `Every production software application begins with a well-defined codebase structure and designated entry points. In software engineering, separating concerns into logical directories (controllers, models, views, utilities, routes) prevents tight coupling, simplifies testing, and ensures maintainability.`,
        keyTakeaways: [
          'Entry points serve as the bootstrap origin for the entire application runtime.',
          'Clear folder boundaries ensure separation of concerns between business logic, data models, and transport layers.',
          'Understanding project structure is the critical first step before diving into code logic or interview discussions.'
        ]
      },
      {
        title: '2. How It Works',
        subtitle: 'Application bootstrap and runtime initialization lifecycle',
        content: `When the application starts, the runtime environment executes the primary entry script. This script orchestrates three critical initialization phases: (1) loading environment variables and configuration settings, (2) initializing database connections and external dependencies, and (3) registering routing tables or mounting UI component trees.`,
        steps: [
          'Step 1: Environment & Config Loading — Reads environment variables and initializes core application settings.',
          'Step 2: Dependency & Service Registration — Establishes connection pools (e.g. database, caching) and imports internal modules.',
          'Step 3: Server/UI Mounting — Binds network listeners to designated ports or mounts the top-level application component.'
        ]
      },
      {
        title: '3. Actual Project Implementation',
        subtitle: `Dissecting the structure of ${project.name}`,
        content: `In this repository (${project.name}), the codebase comprises ${totalFiles} total files spanning approximately ${loc} lines of code. The core technologies detected include ${tech.join(', ') || 'Standard languages'}.`,
        files: keyFileNames.slice(0, 5),
        techStack: tech,
        details: [
          `Primary Entry Points: ${keyFileNames.slice(0, 4).join(', ') || 'Standard entry scripts'}`,
          `Detected System Modules: ${modulesList.map(m => m.name).slice(0, 5).join(', ') || 'General project modules'}`,
          `Total Source Scripts: ${project.metrics?.sourceFiles || totalFiles} files analyzed by static scanner.`
        ]
      },
      {
        title: '4. Project Example & Code Flow',
        subtitle: `Walkthrough of primary entry point: ${primaryEntryFile}`,
        content: `Below is an excerpt from the primary entry file (${primaryEntryFile}) identified in your repository. Notice how the file sets up configurations, imports necessary sub-modules, and establishes runtime boundaries.`,
        codeSnippet: sampleEntryCode,
        flow: [
          `Execute ${primaryEntryFile}`,
          'Load dependencies & middleware',
          'Register routing & module boundaries',
          'Start runtime server / render view'
        ]
      },
      {
        title: '5. Interview Perspective',
        subtitle: 'Key questions and model technical answers',
        content: 'Technical interviewers frequently ask candidates to explain their codebase architecture and folder conventions to evaluate structural design thinking.',
        qaList: [
          {
            question: `How is the codebase structured in ${project.name}, and why?`,
            answer: `The project organizes code modularly across ${modulesList.length > 0 ? modulesList.length + ' primary functional areas' : 'distinct layers'}. Entry points like ${primaryEntryFile} isolate bootstrap setup from core business logic, ensuring code is testable and easy to maintain.`
          },
          {
            question: 'What happens from the moment the application is launched until it is ready to handle requests/interactions?',
            answer: 'The runtime loads the entry script, resolves environment variables, establishes necessary database/service connections, registers routing endpoints, and finally initiates the server listener or mounts the root component tree.'
          }
        ]
      },
      {
        title: '6. Knowledge Check',
        subtitle: 'Verify your understanding before completing this module',
        quiz: {
          question: `In the context of ${project.name}, what is the primary role of the entry file (${primaryEntryFile})?`,
          options: [
            'Bootstrapping the application, loading configurations, and registering core modules/routes.',
            'Directly rendering database tables as static HTML files without routing.',
            'Serving only as a backup copy of production logs and temporary caches.',
            'Compiling external binary drivers on the client machine.'
          ],
          correctIndex: 0,
          explanation: `In ${project.name}, ${primaryEntryFile} acts as the primary entry point responsible for initializing dependencies, setting up configurations, and starting the application lifecycle.`
        }
      }
    ]
  });

  // ==========================================
  // Module 2: System Architecture & Data Flow
  // ==========================================
  const sampleDeps = depGraph.slice(0, 3).map(e => `${e.from.split('/').pop()} ➔ ${e.to.split('/').pop()}`);
  const archFlowDetails = archFlow.map(a => `${a.from} ──[${a.relationType}]──> ${a.to}`).join('\n') || 'Client / UI ──[HTTP Request]──> API Controller ──[Query]──> Database';

  roadmapModules.push({
    id: 'architecture',
    name: 'System Architecture & Data Flows',
    duration: '15 mins',
    difficulty: 'Medium',
    xp: 200,
    sections: [
      {
        title: '1. Architecture & Layering Concepts',
        subtitle: 'Understanding software architecture and decoupling',
        content: `Software architecture defines how various subsystems, modules, and components interact to fulfill user requirements. Clean architecture emphasizes decoupling, where high-level policy does not depend on low-level implementation details. Data moves predictably through explicit boundaries.`,
        keyTakeaways: [
          'Layered architecture ensures that UI, business logic, and persistence are independently maintainable.',
          'Import graphs reveal the coupling between files — clean architectures minimize circular dependencies.',
          'Tracing data flow from input to storage is essential for identifying bottlenecks and security vulnerabilities.'
        ]
      },
      {
        title: '2. How Data Flow Works',
        subtitle: 'The journey of data across layers',
        content: `In a modern multi-tier architecture, an operation begins with an event or HTTP request at the presentation layer. The request passes through validation/middleware, reaches the business logic controllers, queries or persists data in the storage layer, and returns a formatted response.`,
        steps: [
          '1. Ingestion: Presentation layer receives user input or network payload.',
          '2. Validation & Auth: Middleware inspects tokens, sanitizes parameters, and verifies permissions.',
          '3. Execution: Service/Controller executes business logic algorithms and orchestrates data flow.',
          '4. Persistence: Data layer performs atomic database reads/writes and maps records.',
          '5. Response: Formatted payload (JSON/HTML) is returned with standard status codes.'
        ]
      },
      {
        title: '3. Actual Project Implementation',
        subtitle: `Architectural layers mapped in ${project.name}`,
        content: `The static analyzer identified ${modulesList.length} distinct functional modules in this repository with ${depGraph.length} inter-file dependency connections.`,
        files: depGraph.slice(0, 6).map(d => d.from.split('/').pop()),
        techStack: tech,
        details: [
          `Detected Architecture Flow:\n${archFlowDetails}`,
          `Key Module Boundaries: ${modulesList.map(m => m.name).join(', ') || 'Application Layers'}`
        ]
      },
      {
        title: '4. Dependency Walkthrough & Code Flow',
        subtitle: 'Tracing import relationships in your codebase',
        content: `Examining file import paths helps clarify how control flows through the codebase without unexpected side effects.`,
        codeSnippet: sampleDeps.length > 0 ? `// Detected Import Dependencies:\n${sampleDeps.join('\n')}` : `// Project imports map dependencies across ${modulesList.length} functional areas.`,
        flow: [
          'Client / Request Entry',
          'Route Dispatcher & Middleware',
          'Business Logic Handler',
          'Data Persistence Layer'
        ]
      },
      {
        title: '5. Interview Perspective',
        subtitle: 'Architectural questions and justification strategies',
        content: 'Interviewers often ask candidates why they chose their architecture over alternatives (like microservices vs monolith or MVC vs clean architecture).',
        qaList: [
          {
            question: `What architectural pattern does ${project.name} follow, and why is it suitable?`,
            answer: `The project follows a modular, layered architecture separating routing, business logic, and data storage. This design keeps the codebase cohesive, avoids circular dependencies, and allows individual layers to scale or be tested independently.`
          },
          {
            question: 'How do you trace and debug data flow issues in your system?',
            answer: 'By following the request lifecycle step-by-step: checking route parameters at the entry controller, verifying middleware execution, inspecting database query output, and monitoring response payloads and error boundaries.'
          }
        ]
      },
      {
        title: '6. Knowledge Check',
        subtitle: 'Verify your architectural understanding',
        quiz: {
          question: 'Why is it important to separate routing controllers from direct database query logic?',
          options: [
            'To maintain separation of concerns, improve testability, and allow database logic to change without breaking route definitions.',
            'To force the operating system to allocate double memory buffers.',
            'Because modern compilers reject files that contain both routes and database models.',
            'To ensure that all API requests are permanently cached in browser cookies.'
          ],
          correctIndex: 0,
          explanation: 'Separating controllers from database logic isolates transport/HTTP concerns from persistence concerns, making unit testing simpler and enabling easy refactoring.'
        }
      }
    ]
  });

  // ==========================================
  // Module 3: API Routing & Request Handling
  // ==========================================
  if (endpoints.length > 0 || tech.some(t => ['Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Go', 'PHP', 'ASP.NET'].includes(t))) {
    const routeExamples = endpoints.slice(0, 5).map(r => `[${r.method}] ${r.path}`);
    const sampleRoute = endpoints[0] ? `[${endpoints[0].method}] ${endpoints[0].path}` : '[GET] /api/resource';

    roadmapModules.push({
      id: 'backend',
      name: 'API Endpoints & Request Controllers',
      duration: '15 mins',
      difficulty: 'Hard',
      xp: 300,
      sections: [
        {
          title: '1. REST & API Routing Principles',
          subtitle: 'Core concepts of request dispatching and RESTful design',
          content: `REST (Representational State Transfer) organizes network interfaces around resources identified by URIs. HTTP verbs (GET, POST, PUT, DELETE, PATCH) express the intended action, while standard HTTP status codes (200, 201, 400, 401, 404, 500) convey the outcome.`,
          keyTakeaways: [
            'GET requests must be safe and idempotent (retrieving resources without side-effects).',
            'POST creates new resources, while PUT/PATCH updates existing records.',
            'Clear status code conventions ensure client applications can handle responses deterministically.'
          ]
        },
        {
          title: '2. How Request Handling Works',
          subtitle: 'From incoming HTTP packet to serialized JSON response',
          content: `When an HTTP request arrives, the web framework matches the URL and method against registered route definitions. Middleware functions inspect headers (e.g. Bearer JWT tokens), parse JSON bodies, and validate parameters before passing execution to the controller.`,
          steps: [
            '1. Route Matching: The router matches the incoming method and URI path against registered endpoints.',
            '2. Middleware Pipeline: CORS, body parsers, rate limiters, and authentication guards execute sequentially.',
            '3. Controller Execution: The controller parses input, invokes service logic, and prepares data.',
            '4. Response Dispatch: The response is serialized to JSON with appropriate headers and status code.'
          ]
        },
        {
          title: '3. Actual Project Implementation',
          subtitle: `Scanned endpoints in ${project.name}`,
          content: `The static analyzer detected ${endpoints.length} active API endpoints in this repository.`,
          files: keyFileNames.filter(f => f.toLowerCase().includes('route') || f.toLowerCase().includes('controller') || f.toLowerCase().includes('server') || f.toLowerCase().includes('api')),
          techStack: tech.filter(t => ['Express', 'Node.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Go', 'PHP'].includes(t)),
          details: [
            `Detected Routes: ${routeExamples.join(', ') || 'Standard REST endpoints'}`,
            `Total Scanned Endpoints: ${endpoints.length} paths registered.`
          ]
        },
        {
          title: '4. Endpoint Walkthrough & Code Flow',
          subtitle: `Examining ${sampleRoute}`,
          content: `Here is the execution trace for ${sampleRoute} detected in your codebase:`,
          codeSnippet: `// Sample Endpoint Pattern:\n// Endpoint: ${sampleRoute}\n// Method: ${endpoints[0]?.method || 'GET'}\n// Path: ${endpoints[0]?.path || '/api'}\n\n// Handled by controller with input validation and JSON response.`,
          flow: [
            `Client sends ${sampleRoute}`,
            'Authentication & Parameter validation',
            'Service logic executes query/mutation',
            'Returns 200 OK / 201 Created with JSON payload'
          ]
        },
        {
          title: '5. Interview Perspective',
          subtitle: 'API design, security, and error handling questions',
          content: 'Interviewers frequently test candidates on API versioning, error handling, status code selection, and authentication mechanisms.',
          qaList: [
            {
              question: 'How do you handle API errors gracefully in this project?',
              answer: 'By implementing centralized error handling middleware that intercepts unhandled exceptions, logs the error stack trace internally, and returns a clean, structured JSON response with a standardized status code (e.g. 400 Bad Request or 500 Internal Server Error) without exposing sensitive stack traces.'
            },
            {
              question: 'What is the difference between PUT and PATCH in RESTful APIs?',
              answer: 'PUT is intended for complete resource replacement (idempotent), requiring the client to send the entire updated entity. PATCH is intended for partial modifications, updating only the specific fields provided in the request body.'
            }
          ]
        },
        {
          title: '6. Knowledge Check',
          subtitle: 'Verify your API routing knowledge',
          quiz: {
            question: 'Which HTTP status code should an API return when a client successfully creates a new resource via a POST request?',
            options: [
              '201 Created',
              '200 OK (no creation acknowledged)',
              '204 No Content',
              '304 Not Modified'
            ],
            correctIndex: 0,
            explanation: 'HTTP 201 Created is the standard status code indicating that the request has succeeded and has led to the creation of a new resource.'
          }
        }
      ]
    });
  }

  // ==========================================
  // Module 4: UI Components & Client State
  // ==========================================
  if (tech.some(t => ['React', 'Vue', 'Angular', 'React JSX', 'React TSX', 'Svelte', 'HTML', 'Next.js'].includes(t))) {
    roadmapModules.push({
      id: 'frontend',
      name: 'Client Components & UI State Flow',
      duration: '15 mins',
      difficulty: 'Medium',
      xp: 250,
      sections: [
        {
          title: '1. Component Architecture & State Principles',
          subtitle: 'Core concepts of declarative UI and reactive state',
          content: `Modern web interfaces are composed of reusable, self-contained components. Each component encapsulates its own template, styles, and state. When state changes, the framework efficiently updates only the modified parts of the DOM.`,
          keyTakeaways: [
            'Props allow data to flow downward from parent to child components (unidirectional data flow).',
            'State represents mutable data that drives dynamic user interface changes.',
            'Decoupling presentational components from data-fetching components improves code reuse.'
          ]
        },
        {
          title: '2. How UI Rendering Works',
          subtitle: 'Virtual DOM, reactivity, and the component lifecycle',
          content: `When user interaction triggers a state update, the component re-renders. In React/Virtual-DOM frameworks, a new virtual DOM tree is computed and diffed against the previous tree (reconciliation). Only the minimal set of real DOM mutations is applied to the browser screen.`,
          steps: [
            '1. Mount / Initial Render: Components initialize local state, evaluate JSX, and paint the initial DOM.',
            '2. User Action / Event: Click, form input, or timer fires an event handler.',
            '3. State Mutation: Handler calls state setter (e.g. setState / useState).',
            '4. Reconciliation & Paint: Framework diffs Virtual DOM and updates changed nodes.'
          ]
        },
        {
          title: '3. Actual Project Implementation',
          subtitle: `Frontend structure in ${project.name}`,
          content: `This repository uses ${tech.filter(t => ['React', 'Vue', 'Angular', 'React JSX', 'React TSX', 'Svelte', 'Next.js'].includes(t)).join(', ')} for client-side interfaces.`,
          files: keyFileNames.filter(f => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.vue') || f.endsWith('.js') || f.endsWith('.html')),
          techStack: tech,
          details: [
            `Component Files Scanned: ${keyFileNames.filter(f => f.endsWith('.jsx') || f.endsWith('.tsx')).join(', ') || 'UI Components'}`,
            `State Patterns: Unidirectional data flow with component-level and context-level states.`
          ]
        },
        {
          title: '4. Component Walkthrough & Code Flow',
          subtitle: 'Tracing user events to state updates and API calls',
          content: 'A standard frontend interaction follows this sequence in your application:',
          codeSnippet: `// Example UI State & Fetch Pattern:\nconst [data, setData] = useState(null);\nconst [loading, setLoading] = useState(false);\n\nuseEffect(() => {\n  fetchData().then(res => setData(res));\n}, []);`,
          flow: [
            'User performs action (e.g. click, input)',
            'Event handler dispatches API request',
            'Loading state renders progress spinner',
            'API response updates state -> UI re-renders with data'
          ]
        },
        {
          title: '5. Interview Perspective',
          subtitle: 'Frontend performance, hooks, and state management questions',
          content: 'Frontend interviews frequently explore reconciliation, state lifting, useEffect dependencies, and performance optimizations.',
          qaList: [
            {
              question: 'How do you optimize rendering performance in component-based applications?',
              answer: 'By avoiding unnecessary re-renders (using memoization like useMemo/useCallback or React.memo), keeping state localized to the components that need it, using key props correctly in lists, and code-splitting bundles with lazy loading.'
            },
            {
              question: 'What is the purpose of useEffect dependency arrays?',
              answer: 'The dependency array controls when the effect executes. If empty ([]), it runs once on mount. If it contains values, the effect re-runs only when any of those values change between renders, preventing infinite render loops.'
            }
          ]
        },
        {
          title: '6. Knowledge Check',
          subtitle: 'Verify your frontend state knowledge',
          quiz: {
            question: 'What is unidirectional data flow in modern frontend frameworks?',
            options: [
              'Data flows exclusively from parent components down to child components via props, with child events notifying parents to trigger state updates.',
              'Data flows directly between sibling components without parent involvement.',
              'All state is stored exclusively in localStorage and fetched on every keypress.',
              'Components can mutate parent props directly without triggering re-renders.'
            ],
            correctIndex: 0,
            explanation: 'Unidirectional data flow ensures that state is owned by a single source of truth and passed down via props, making data flow predictable and easy to debug.'
          }
        }
      ]
    });
  }

  // ==========================================
  // Module 5: Database Schemas & Data Storage
  // ==========================================
  if (dbInfo && dbInfo.dbType && dbInfo.dbType !== 'None detected') {
    roadmapModules.push({
      id: 'database',
      name: `${dbInfo.dbType} Schemas & Query Logic`,
      duration: '15 mins',
      difficulty: 'Medium',
      xp: 250,
      sections: [
        {
          title: '1. Data Modeling & Persistence Principles',
          subtitle: `Core principles of ${dbInfo.dbType} storage and modeling`,
          content: `Data persistence ensures that state survives application restarts. In modern architectures, Object-Relational Mappers (ORM) or Object-Document Mappers (ODM) bridge application code objects with database tables or collections, enforcing schemas, indexes, and validation rules.`,
          keyTakeaways: [
            'Schemas define data types, required constraints, default values, and relations.',
            'Indexes optimize query performance by allowing the database engine to locate records without scanning entire tables.',
            'Connection pooling reuses open database connections, preventing connection overhead per request.'
          ]
        },
        {
          title: '2. How Database Operations Work',
          subtitle: 'Connection lifecycle and query execution pipeline',
          content: `When the server starts, a singleton database client initializes a connection pool. Controllers issue asynchronous queries (find, insert, update, delete) that are sent over TCP to the database server. Results are deserialized into typed models or JavaScript objects.`,
          steps: [
            '1. Pool Initialization: Application establishes authenticated connection pool with retry backoff.',
            '2. Query Construction: ORM/ODM model compiles filter criteria and projection options.',
            '3. Database Execution: Database engine uses indexes to locate and update matching records.',
            '4. Deserialization: Database returns binary/BSON/JSON documents to application memory.'
          ]
        },
        {
          title: '3. Actual Project Implementation',
          subtitle: `Database configuration in ${project.name}`,
          content: `The scanner detected **${dbInfo.dbType}** as the active persistence engine in this project.`,
          files: keyFileNames.filter(f => f.toLowerCase().includes('model') || f.toLowerCase().includes('schema') || f.toLowerCase().includes('db') || f.toLowerCase().includes('database')),
          techStack: [dbInfo.dbType, ...tech.filter(t => ['Mongoose', 'Prisma', 'Sequelize', 'TypeORM', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL'].includes(t))],
          details: [
            `Database Type: ${dbInfo.dbType}`,
            `Connection File: ${dbInfo.connectionStringFile || 'Configured via environment variables'}`,
            `Detected Models/Tables: ${dbInfo.detectedTablesOrCollections?.join(', ') || 'Database entities'}`
          ]
        },
        {
          title: '4. Schema Walkthrough & Query Flow',
          subtitle: 'Model structure and relationship mapping',
          content: `Here is the data persistence flow for models identified in ${project.name}:`,
          codeSnippet: `// Database: ${dbInfo.dbType}\n// Models detected: ${dbInfo.detectedTablesOrCollections?.join(', ') || 'Schemas'}\n// Connection managed in: ${dbInfo.connectionStringFile || 'Config/DB helper'}\n\n// Supports CRUD operations with schema validation and indexing.`,
          flow: [
            'Controller invokes Model query',
            'Schema validator verifies required fields',
            `${dbInfo.dbType} executes indexed query`,
            'Returns validated document/record'
          ]
        },
        {
          title: '5. Interview Perspective',
          subtitle: 'Database design, indexing, and scalability questions',
          content: 'Database interview questions test schema design, normalization vs denormalization, indexing strategies, and transaction ACID properties.',
          qaList: [
            {
              question: `Why did you choose ${dbInfo.dbType} for ${project.name}?`,
              answer: `We selected ${dbInfo.dbType} because its data modeling capabilities fit our application requirements well, providing flexible schema modeling, efficient indexing, and straightforward integration with our ${tech[0] || 'application'} backend stack.`
            },
            {
              question: 'How do database indexes improve query performance, and what are their trade-offs?',
              answer: 'Indexes create efficient B-tree or hash lookup structures that allow the database engine to find matching records in O(log n) time instead of performing expensive full collection scans. The trade-off is increased storage overhead and slightly slower write (INSERT/UPDATE/DELETE) operations because indexes must be updated on every modification.'
            }
          ]
        },
        {
          title: '6. Knowledge Check',
          subtitle: 'Verify your database persistence knowledge',
          quiz: {
            question: `In ${project.name}, why is connection pooling used with ${dbInfo.dbType}?`,
            options: [
              'To reuse an established pool of active database connections rather than opening and closing a new TCP socket for every individual query.',
              'To permanently store all database tables in browser RAM memory.',
              'To prevent the database from writing data to the physical disk.',
              'Because database drivers require exactly one connection per registered user account.'
            ],
            correctIndex: 0,
            explanation: 'Connection pooling significantly improves performance and scalability by reusing established database connections, eliminating the high latency of creating new TCP connections per request.'
          }
        }
      ]
    });
  }

  // ==========================================
  // Module 6: Code Diagnostics & Best Practices
  // ==========================================
  roadmapModules.push({
    id: 'quality',
    name: 'Code Diagnostics & Best Practices',
    duration: '15 mins',
    difficulty: 'Medium',
    xp: 200,
    sections: [
      {
        title: '1. Code Quality & Static Analysis Principles',
        subtitle: 'Defensive programming, linting, and vulnerability scanning',
        content: `Writing clean, maintainable code requires adhering to established software design principles: DRY (Don't Repeat Yourself), SOLID principles, and defensive programming. Static analysis tools examine source code without executing it to flag potential syntax errors, unhandled promise rejections, security vulnerabilities, and code smells.`,
        keyTakeaways: [
          'Static code analysis catches defects early in the development lifecycle before code reaches production.',
          'Robust error handling ensures the application fails gracefully without crashing or leaking sensitive stack traces.',
          'Consistently adhering to coding standards makes codebases easier to maintain and onboard new team members.'
        ]
      },
      {
        title: '2. How Diagnostics & Static Analysis Work',
        subtitle: 'Abstract Syntax Trees (AST) and rule validation',
        content: `Static analyzers parse source files into Abstract Syntax Trees (AST). The analyzer walks the AST nodes and checks them against rules (e.g. unused variables, missing error catches, exposed API secrets, or deprecated function calls), reporting file paths and exact line numbers for any violations.`,
        steps: [
          '1. Lexical Analysis & Parsing: Source code strings are tokenized and converted into an Abstract Syntax Tree.',
          '2. Rule Evaluation: Analyzer checks AST nodes against linting, security, and quality rules.',
          '3. Diagnostic Reporting: Issues are classified by severity (High, Medium, Low) with actionable messages.'
        ]
      },
      {
        title: '3. Actual Project Implementation',
        subtitle: `Diagnostic review for ${project.name}`,
        content: `The static analyzer scanned all ${totalFiles} repository files and identified **${issues.length}** code issues.`,
        files: issues.slice(0, 5).map(i => i.filePath.split('/').pop()),
        techStack: tech,
        details: [
          issues.length === 0
            ? '✓ Clean structural code: 0 issues detected by static analysis checks.'
            : `Flagged issues breakdown: ${issues.slice(0, 3).map(i => `[${i.issueType}] ${i.filePath.split('/').pop()} (Line ${i.line}): ${i.message}`).join('\n')}`
        ]
      },
      {
        title: '4. Diagnostic Walkthrough & Refactoring',
        subtitle: 'Reviewing error boundaries and defensive code patterns',
        content: 'Robust error handling wraps asynchronous operations and boundary transitions:',
        codeSnippet: `// Robust Error Handling Pattern:\ntry {\n  const result = await executeOperation();\n  return res.status(200).json({ success: true, data: result });\n} catch (error) {\n  logger.error('Operation failed:', error);\n  return res.status(500).json({ success: false, message: 'Internal server error' });\n}`,
        flow: [
          'Input received & validated',
          'Operation executed in protected try-block',
          'Exceptions caught by catch-block & logged',
          'Clean, user-friendly error response returned'
        ]
      },
      {
        title: '5. Interview Perspective',
        subtitle: 'Code quality, technical debt, and refactoring interview strategies',
        content: 'Interviewers love to ask: "What would you improve or refactor if you had more time?" or "How did you ensure the quality of your code?".',
        qaList: [
          {
            question: `What are the key code quality and reliability considerations in ${project.name}?`,
            answer: `We focus on strict input validation, comprehensive try-catch error handling around asynchronous I/O operations, modular component structure, and avoiding hardcoded secrets or environment parameters.`
          },
          {
            question: 'How do you handle technical debt and refactoring in an existing codebase?',
            answer: 'By identifying high-complexity or high-churn modules using static analysis, writing unit tests to cover existing behavior (regression safety), and incrementally refactoring large functions into small, pure, single-responsibility utilities.'
          }
        ]
      },
      {
        title: '6. Knowledge Check',
        subtitle: 'Verify your code quality understanding',
        quiz: {
          question: 'Why should sensitive error stack traces be hidden from production API responses?',
          options: [
            'Because stack traces can reveal internal server directory paths, database structures, and library versions to potential attackers.',
            'Because JSON parsers in web browsers cannot render newline characters in error messages.',
            'Because printing error messages increases CPU power consumption exponentially.',
            'Stack traces are automatically deleted by the operating system anyway.'
          ],
          correctIndex: 0,
          explanation: 'Exposing detailed stack traces in production leaks internal implementation details (file paths, database versions, library vulnerabilities) that attackers can exploit.'
        }
      }
    ]
  });

  return roadmapModules;
};

// @desc    Retrieve dynamic, persistent learning roadmap for the project
// @route   GET /api/prepare/:id/roadmap
const getRoadmap = async (req, res, next) => {
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const defaultModules = buildProjectRoadmap(project);
    const progressLogs = await LearningProgress.find({ project: projectId, user: req.user.id });

    const roadmapData = defaultModules.map((mod, idx) => {
      const match = progressLogs.find(p => p.moduleId === mod.id);
      let status = 'locked';
      if (match) {
        status = match.completionStatus;
      } else if (idx === 0) {
        status = 'in-progress';
      }

      return {
        ...mod,
        status
      };
    });

    res.json(roadmapData);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a syllabus roadmap node completed and award XP
// @route   POST /api/prepare/:id/roadmap/complete
const completeRoadmapModule = async (req, res, next) => {
  const { moduleId } = req.body;
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let progress = await LearningProgress.findOne({
      user: req.user.id,
      project: projectId,
      moduleId
    });

    const isAlreadyCompleted = progress && progress.completionStatus === 'completed';

    if (!progress) {
      progress = new LearningProgress({
        user: req.user.id,
        project: projectId,
        moduleId,
        completionStatus: 'completed',
        progress: 100
      });
    } else {
      progress.completionStatus = 'completed';
      progress.progress = 100;
    }
    await progress.save();

    const user = await User.findById(req.user.id);
    // Award XP only if this module was not completed before
    let xpAwarded = 0;
    if (user && !isAlreadyCompleted) {
      const xpValues = {
        fundamental: 150,
        architecture: 200,
        frontend: 250,
        backend: 300,
        database: 250,
        quality: 200,
        deploy: 350
      };
      xpAwarded = xpValues[moduleId] || 150;
      await awardXP(user, xpAwarded, `completed_module_${moduleId}`);
    }

    // Unlock next module in order
    const defaultModules = buildProjectRoadmap(project);
    const moduleSequence = defaultModules.map(m => m.id);

    const currentIdx = moduleSequence.indexOf(moduleId);
    if (currentIdx !== -1 && currentIdx + 1 < moduleSequence.length) {
      const nextModuleId = moduleSequence[currentIdx + 1];
      let nextProgress = await LearningProgress.findOne({
        user: req.user.id,
        project: projectId,
        moduleId: nextModuleId
      });
      if (!nextProgress) {
        await LearningProgress.create({
          user: req.user.id,
          project: projectId,
          moduleId: nextModuleId,
          completionStatus: 'in-progress',
          progress: 30
        });
      } else if (nextProgress.completionStatus === 'locked') {
        nextProgress.completionStatus = 'in-progress';
        await nextProgress.save();
      }
    }

    // Read latest progress from database to build synchronized roadmap
    const progressLogs = await LearningProgress.find({ project: projectId, user: req.user.id });
    const updatedRoadmap = defaultModules.map((mod, idx) => {
      const match = progressLogs.find(p => p.moduleId === mod.id);
      let status = 'locked';
      if (match) {
        status = match.completionStatus;
      } else if (idx === 0) {
        status = 'in-progress';
      }
      return {
        ...mod,
        status
      };
    });

    res.json({
      message: 'Module progress updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        levelName: user.levelName,
        streak: user.streak,
        streakCalendar: user.streakCalendar
      },
      xpAwarded,
      alreadyCompleted: Boolean(isAlreadyCompleted),
      roadmap: updatedRoadmap
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate 20 project-specific quiz questions
// @route   GET /api/prepare/:id/quiz
const getQuizQuestions = async (req, res, next) => {
  const difficulty = req.query.difficulty || 'Medium';
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // 1. Check cached questions first (Task 25/5)
    if (project.quizQuestions && project.quizQuestions[difficulty] && project.quizQuestions[difficulty].length > 0) {
      console.log(`[Quiz] Returning cached ${difficulty} questions for project ${project.name}`);
      return res.json(project.quizQuestions[difficulty]);
    }

    const user = await User.findById(req.user.id);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Seeded fallback questions if key is missing
      const fallbacks = Array.from({ length: 20 }, (_, i) => ({
        question: `Question ${i + 1}: Which detected technology in this project handles ${project.techStack[0] || 'General'} parameters?`,
        options: ['Modules routing declarations', 'Schema model configuration', 'Files environment settings', 'Local filesystem buffers'],
        correct: 1,
        explanation: 'Factual configuration of stack parameters maps variables directly into active modules.'
      }));
      return res.json(fallbacks);
    }

    // Build evidence prompt metadata to avoid sending entire source files (Task 27)
    const prompt = `
You are a Lead Software Architect. Generate exactly 20 distinct multiple choice quiz questions tailored to this scanned codebase details:
- Project Name: ${project.name}
- Tech Stack: ${JSON.stringify(project.techStack)}
- Files structure: ${JSON.stringify(project.importantFiles.map(f => f.name))}
- Endpoints: ${JSON.stringify(project.endpointRoutes)}
- Database: ${JSON.stringify(project.databaseInfo)}
- Difficulty: ${difficulty}

Strict Grounding Instructions:
1. Every question must be directly related to the scanned project details and tech stack. Do not invent files or frameworks.
2. Return a JSON array strictly matching this format (no markdown blocks, no leading \`\`\`json, just pure JSON text):
[
  {
    "question": "Question text?",
    "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
    "correct": 0,
    "explanation": "Explanation of why this option is correct based on project evidence."
  }
]
`;

    console.log(`[Quiz] Cache miss. Generating 20 questions for project ${project.name}...`);
    const aiResponse = await generateJSONContentWithFallback(prompt, user);
    const questions = aiResponse.data;

    // Cache generated questions (Task 25)
    project.quizQuestions[difficulty] = questions;
    await project.save();

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz choices, log QuizAttempt history, and sync user profile XP
// @route   POST /api/prepare/:id/quiz/submit
const submitQuizScore = async (req, res, next) => {
  const { difficulty, questions, answers, score } = req.body;
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Generate explainable scoring diagnostics (Task 10)
    const passed = score >= questions.length / 2;
    const strength = passed ? "Demonstrated clear conceptual familiarity with project dependencies and variables." : "Basic stack syntax is understood, but detailed file flows require attention.";
    const weakness = passed ? "Some specific boundary parameters or linter smells were missed." : "Struggled with core routing endpoints and modules mapping details.";
    const evidence = `Scored ${score} correct out of ${questions.length} questions on ${difficulty} difficulty.`;
    const recommendation = passed ? "Review static imports graph in detail to solidify architecture understanding." : "We recommend going through learning path fundamentals and attempting modules checkpoint questions.";

    const attempt = await QuizAttempt.create({
      user: req.user.id,
      project: projectId,
      difficulty,
      questions,
      answers,
      score,
      explanationSummary: { strength, weakness, evidence, recommendation }
    });

    const user = await User.findById(req.user.id);
    let xpAwarded = 0;
    if (user && passed) {
      xpAwarded = 150;
      await awardXP(user, xpAwarded, 'quiz_complete');
    }

    res.status(201).json({
      attempt,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        levelName: user.levelName,
        streak: user.streak,
        streakCalendar: user.streakCalendar
      },
      xpAwarded
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate 15 dynamic project-specific Oral Viva questions
// @route   GET /api/prepare/:id/viva
const getVivaQuestions = async (req, res, next) => {
  const difficulty = req.query.difficulty || 'Medium';
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check cached questions first (Task 25/6)
    if (project.vivaQuestions && project.vivaQuestions[difficulty] && project.vivaQuestions[difficulty].length > 0) {
      console.log(`[Viva] Returning cached ${difficulty} questions for project ${project.name}`);
      return res.json(project.vivaQuestions[difficulty]);
    }

    const user = await User.findById(req.user.id);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallbacks = Array.from({ length: 15 }, (_, i) => `Question ${i + 1}: Explain how routing modules communicate with schemas in your codebase.`);
      return res.json(fallbacks);
    }

    const prompt = `
You are a Lead Software Architect. Generate exactly 15 open-ended conceptual oral viva questions tailored to this codebase:
- Project: ${project.name}
- Tech Stack: ${JSON.stringify(project.techStack)}
- Critical Files: ${JSON.stringify(project.importantFiles.map(f => f.name))}
- Endpoints: ${JSON.stringify(project.endpointRoutes)}
- Database: ${JSON.stringify(project.databaseInfo)}
- Difficulty: ${difficulty}

Return a JSON array of strings strictly matching this format (no markdown blocks, no leading \`\`\`json, just pure JSON text):
[
  "Question 1?",
  "Question 2?"
]
`;

    console.log(`[Viva] Cache miss. Generating 15 questions for project ${project.name}...`);
    const aiResponse = await generateJSONContentWithFallback(prompt, user);
    const questions = aiResponse.data;

    // Cache generated questions (Task 25)
    project.vivaQuestions[difficulty] = questions;
    await project.save();

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate viva answers using evidence-based AI (Task 4 & 10)
// @route   POST /api/prepare/:id/viva/submit
const submitVivaAnswers = async (req, res, next) => {
  const { questions, answers } = req.body;
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(req.user.id);
    const apiKey = process.env.GEMINI_API_KEY;
    let evalResult;

    if (!apiKey) {
      evalResult = {
        score: 75,
        feedback: ["Satisfactory understanding of codebase imports."],
        explanationSummary: {
          strength: "Clear verbal delivery.",
          weakness: "Could expand more on MVC structural boundaries.",
          evidence: "Answered 15 oral viva questions.",
          recommendation: "Review the dynamic architecture flow of controllers."
        }
      };
    } else {
      const transcript = questions.map((q, idx) => ({
        question: q,
        answer: answers[idx] || 'No response.'
      }));

      // Evidence-Based AI Prompt (Task 4)
      const prompt = `
You are a Lead Software Architect grading a student candidate's oral viva answers.
Project Metadata:
- Name: ${project.name}
- Files: ${JSON.stringify(project.importantFiles.map(f => f.name))}
- Routes: ${JSON.stringify(project.endpointRoutes)}
- Database: ${JSON.stringify(project.databaseInfo)}

Transcript:
${JSON.stringify(transcript)}

Strict Evidence Grading Rules:
1. Grade the candidate out of 100 based on technical depth, codebase alignment, and accuracy.
2. Distinguish clearly between:
   (a) What is ACTUALLY implemented in the files list.
   (b) What is theoretical best practice but NOT in the uploaded files.
   Do not reward claims of features/databases that aren't present in the metadata.
3. Return a JSON object strictly matching this format (no leading \`\`\`json, just pure JSON text):
{
  "score": 75,
  "feedback": [
    "Feedback point 1 (constructive)",
    "Feedback point 2 (constructive)"
  ],
  "explanationSummary": {
    "strength": "What the candidate explained well based on implementation",
    "weakness": "Concept explained theoretically but missing in actual codebase, or explained poorly",
    "evidence": "Observed code files / structures matching candidate claims",
    "recommendation": "Next recommended step to study"
  }
}
`;

      const aiResponse = await generateJSONContentWithFallback(prompt, user);
      evalResult = aiResponse.data;
    }

    const attempt = await VivaAttempt.create({
      user: req.user.id,
      project: projectId,
      questions,
      answers,
      score: evalResult.score,
      feedback: evalResult.feedback || [],
      explanationSummary: evalResult.explanationSummary
    });

    const passed = evalResult.score >= 50;
    let xpAwarded = 0;
    if (user && passed) {
      xpAwarded = 150;
      await awardXP(user, xpAwarded, 'viva_complete');
    }

    res.status(201).json({
      attempt,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        levelName: user.levelName,
        streak: user.streak,
        streakCalendar: user.streakCalendar
      },
      xpAwarded
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Generate deterministic, deeply grounded project-specific interview questions
const generateGroundedInterviewQuestions = (project, numQuestions = 15, difficulty = 'Medium', targetRole = 'Software Engineer') => {
  const tech = project.techStack || [];
  const primaryTech = tech[0] || 'Modern Programming Language';
  const files = (project.importantFiles || []).map(f => f.name.split('/').pop());
  const primaryFile = files[0] || 'main entry file';
  const secondaryFile = files[1] || files[0] || 'service handler';
  const routes = (project.endpointRoutes || []).map(r => `[${r.method}] ${r.path}`);
  const sampleRoute = routes[0] || '/api/resource';
  const secondaryRoute = routes[1] || routes[0] || '/api/data';
  const dbInfo = project.databaseInfo || {};
  const dbType = dbInfo.dbType && dbInfo.dbType !== 'None detected' ? dbInfo.dbType : 'Database Persistence Layer';
  const dbEntities = (dbInfo.detectedTablesOrCollections || []).slice(0, 3).join(', ') || 'data models';
  const modules = (project.modules || []).map(m => m.name);
  const primaryModule = modules[0] || 'API Controllers';
  const secondaryModule = modules[1] || modules[0] || 'Data Models';
  const issues = project.codeIssues || [];
  const sampleIssue = issues[0] ? `an issue related to ${issues[0].issueType} in '${issues[0].filePath.split('/').pop()}' (Line ${issues[0].line})` : 'potential error handling bottlenecks';
  const archFlow = (project.architectureFlow || []).map(a => `${a.from} -> ${a.to}`).join(' | ') || 'Client -> Server Controller -> Database Layer';

  const questionPool = [
    // 1. Project Overview
    {
      category: 'Project Overview',
      question: `Can you walk me through the high-level architecture and engineering goals of ${project.name}? How does data flow from user interaction to your server?`
    },
    {
      category: 'Project Overview',
      question: `What led to the choice of ${tech.slice(0, 3).join(', ') || 'your technology stack'} for ${project.name}, and what architectural trade-offs did this stack introduce?`
    },

    // 2. Technical Stack & Implementation
    {
      category: 'Technical Stack',
      question: `In ${project.name}, you rely on ${primaryTech}. How does the runtime lifecycle and asynchronous I/O execution work in your implementation?`
    },
    {
      category: 'Technical Stack',
      question: `How are external dependencies managed in ${project.name}? Can you explain how you handle configuration variables and environment isolation?`
    },

    // 3. Code / File-Based Implementation
    {
      category: 'Code Implementation',
      question: `In your codebase, what specific responsibilities are delegated to '${primaryFile}', and how does it bootstrap runtime services or handle execution errors?`
    },
    {
      category: 'Code Implementation',
      question: `Looking at '${secondaryFile}', how is business logic partitioned within this file, and what design patterns are used to keep it testable?`
    },

    // 4. Architecture & Module Boundaries
    {
      category: 'System Architecture',
      question: `How does ${project.name} establish modular boundaries between '${primaryModule}' and '${secondaryModule}'? How do you prevent circular dependency imports?`
    },
    {
      category: 'System Architecture',
      question: `Tracing your system data flow (${archFlow}), what failure recovery or timeout mechanisms protect the system if an intermediate layer stalls?`
    },

    // 5. Database & Persistence
    {
      category: 'Database & Persistence',
      question: `In your ${dbType} implementation, how are schemas or tables for ${dbEntities} designed, and how do you handle indexing and query performance?`
    },
    {
      category: 'Database & Persistence',
      question: `How does ${project.name} handle database connection lifecycle and concurrency? How do you ensure transactions or updates remain atomic?`
    },

    // 6. API Endpoints & Routing
    {
      category: 'API & Routing',
      question: `Walk me through the lifecycle of a request hitting '${sampleRoute}' in ${project.name}. How is input sanitized and validated before touching business logic?`
    },
    {
      category: 'API & Routing',
      question: `For endpoint '${secondaryRoute}', what HTTP status codes and response schema formats are returned for successful executions versus validation failures?`
    },

    // 7. Security & Authentication
    {
      category: 'Security & Auth',
      question: `How does ${project.name} authenticate client requests and protect sensitive endpoints? Where are security guards or middleware attached?`
    },
    {
      category: 'Security & Auth',
      question: `What precautions does ${project.name} implement against common vulnerabilities like SQL/NoSQL injection, CORS misconfigurations, or secret leakage?`
    },

    // 8. Problem-Solving & Scalability
    {
      category: 'Problem-Solving & Scalability',
      question: `If concurrent traffic to ${project.name} spiked by 50x, where would the first performance bottleneck appear in this codebase, and how would you resolve it?`
    },
    {
      category: 'Problem-Solving & Scalability',
      question: `How would you introduce caching (e.g., Redis or in-memory stores) or background task workers into ${project.name} to optimize response latency?`
    },

    // 9. Code Quality & Issues
    {
      category: 'Code Quality & Issues',
      question: `During static analysis of ${project.name}, ${sampleIssue} was identified. How would you refactor the code to eliminate this issue and improve maintainability?`
    },
    {
      category: 'Code Quality & Issues',
      question: `If you were tasked with setting up an end-to-end automated testing pipeline for ${project.name}, which modules or integration paths would you prioritize first?`
    }
  ];

  return questionPool.slice(0, numQuestions).map(q => ({
    question: q.question,
    category: q.category
  }));
};

// @desc    Generate dynamic project-specific Mock Interview questions
// @route   GET /api/prepare/:id/interview/questions
const getInterviewQuestions = async (req, res, next) => {
  const difficulty = req.query.difficulty || 'Medium';
  const mode = req.query.mode || 'Full'; // Quick (10), Full (15), Deep (20)
  const targetRole = req.query.targetRole || 'Software Engineer';
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const sizes = { Quick: 10, Full: 15, Deep: 20 };
    const numQuestions = sizes[mode] || 15;

    // Check cached questions - ensure they are project-grounded objects or detailed strings
    if (project.interviewQuestions && project.interviewQuestions[difficulty] && project.interviewQuestions[difficulty].length >= numQuestions) {
      const firstQ = project.interviewQuestions[difficulty][0];
      const isGenericPlaceholder = typeof firstQ === 'string' && firstQ.includes('Explain the design patterns in your project');
      if (!isGenericPlaceholder) {
        console.log(`[Interview] Returning cached ${difficulty} questions for project ${project.name}`);
        return res.json(project.interviewQuestions[difficulty].slice(0, numQuestions));
      }
    }

    const user = await User.findById(req.user.id);
    const apiKey = process.env.GEMINI_API_KEY;

    let generatedQuestions;

    if (!apiKey) {
      generatedQuestions = generateGroundedInterviewQuestions(project, 20, difficulty, targetRole);
    } else {
      const prompt = `
You are a Lead Principal Architect interviewing a candidate for the role of: "${targetRole}".
Generate exactly 20 deeply project-specific, open-ended technical interview questions tailored specifically to this codebase:
- Project Name: ${project.name}
- Description: ${project.description}
- Tech Stack: ${JSON.stringify(project.techStack)}
- Primary Source Files: ${JSON.stringify((project.importantFiles || []).map(f => f.name))}
- Scanned Endpoints: ${JSON.stringify((project.endpointRoutes || []).map(r => `[${r.method}] ${r.path}`))}
- Database: ${JSON.stringify(project.databaseInfo)}
- Detected Modules: ${JSON.stringify((project.modules || []).map(m => m.name))}
- Static Code Issues: ${JSON.stringify((project.codeIssues || []).slice(0, 5))}
- Difficulty: ${difficulty}

Strict Requirements:
1. Every question MUST directly reference real files, routes, technologies, database models, or detected issues from the provided project facts.
2. DO NOT generate generic questions like "What is OOP?" or "Explain design patterns". Mention actual filenames (e.g. server.js, routes/auth.js) and routes.
3. Include a balanced mix across:
   - Project Overview
   - Technical Stack & Language Implementation
   - Code & File-based Questions
   - Architecture & Module Boundaries
   - Database & Persistence Layer
   - API Endpoints & Request Handling
   - Security & Authentication Middleware
   - Scalability & Problem-Solving Bottlenecks
   - Code Quality, Issues & Refactoring

Return a JSON array of objects strictly matching this format (no markdown blocks, no leading \`\`\`json, just pure JSON text):
[
  {
    "question": "Question text referencing real project file, route, or architecture?",
    "category": "API & Routing"
  }
]
`;

      try {
        console.log(`[Interview] Generating 20 project-specific questions for project ${project.name}...`);
        const aiResponse = await generateJSONContentWithFallback(prompt, user);
        if (Array.isArray(aiResponse.data) && aiResponse.data.length > 0) {
          generatedQuestions = aiResponse.data.map(item => {
            if (typeof item === 'string') return { question: item, category: 'Technical Architecture' };
            return {
              question: item.question || 'Explain this component.',
              category: item.category || 'Technical Depth'
            };
          });
        } else {
          generatedQuestions = generateGroundedInterviewQuestions(project, 20, difficulty, targetRole);
        }
      } catch (err) {
        console.warn('[Interview] AI Question generation fallback:', err.message);
        generatedQuestions = generateGroundedInterviewQuestions(project, 20, difficulty, targetRole);
      }
    }

    // Cache generated questions
    project.interviewQuestions[difficulty] = generatedQuestions;
    await project.save();

    res.json(generatedQuestions.slice(0, numQuestions));
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate technical mock interview, save MockInterview scorecard with per-answer evaluation
// @route   POST /api/prepare/:id/interview/evaluate
const evaluateMockInterview = async (req, res, next) => {
  const { transcripts, questions, answers, targetRole } = req.body;
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(req.user.id);
    const apiKey = process.env.GEMINI_API_KEY;
    const finalTranscripts = transcripts || (questions || []).map((q, idx) => ({
      question: typeof q === 'object' ? q.question : q,
      category: typeof q === 'object' ? q.category : 'Technical Round',
      answer: answers ? answers[idx] : 'No response.'
    }));

    let evalResult;

    if (!apiKey) {
      // Deterministic, rich fallback evaluation engine
      const questionEvaluations = finalTranscripts.map(t => {
        const qText = typeof t.question === 'object' ? t.question.question : t.question;
        const ans = t.answer || '';
        const isBlank = !ans || ans.trim() === '' || ans.includes('Timer expired') || ans === 'No response.';
        const wordCount = ans.split(/\s+/).filter(Boolean).length;
        
        let correctness = 'Adequate (65%)';
        let score = 65;
        let explainedWell = 'Addressed the question topic directly.';
        let missingPoints = 'Could provide deeper details regarding specific file implementations and error handling.';
        let couldImprove = 'Incorporate exact framework methods, parameter validation checks, and architectural boundary considerations.';

        if (isBlank) {
          correctness = 'Incomplete (0%)';
          score = 15;
          explainedWell = 'No technical response was recorded for this question round.';
          missingPoints = 'All architectural, coding, and workflow details were omitted.';
          couldImprove = 'Ensure you state the role of the component, how parameters are verified, and how errors are caught.';
        } else if (wordCount > 35) {
          correctness = 'Strong (85%)';
          score = 85;
          explainedWell = 'Good technical depth and structured explanation of the workflow.';
          missingPoints = 'Could touch upon concurrency constraints or edge-case handling.';
          couldImprove = 'Highlight trade-offs and explain how this design choice compares to alternatives.';
        }

        const sampleAnswer = `In ${project.name}, this is handled by isolating responsibilities across modules. For instance, incoming requests are parsed by routes and controllers, validated against schemas, and executed with appropriate error catching before returning formatted responses.`;

        return {
          question: qText,
          answer: ans || 'No response.',
          category: t.category || 'Technical Depth',
          correctness,
          score,
          explainedWell,
          missingPoints,
          couldImprove,
          sampleAnswer
        };
      });

      const avgScore = Math.round(questionEvaluations.reduce((acc, qe) => acc + qe.score, 0) / (questionEvaluations.length || 1));

      evalResult = {
        score: {
          communication: Math.min(95, Math.max(40, avgScore + 5)),
          technicalDepth: avgScore,
          projectKnowledge: Math.min(95, Math.max(45, avgScore - 2))
        },
        questionEvaluations,
        feedback: [
          'Good overall technical familiarity with the primary project stack and file structure.',
          'Focus on explaining error handling boundaries, status codes, and database connection pooling in greater depth.'
        ],
        weakAreas: ['Asynchronous Error Boundaries', 'Database Concurrency & Indexing'],
        explanationSummary: {
          strength: `Demonstrated solid conceptual grasp of ${project.name} architecture and primary technologies.`,
          weakness: 'Could provide more concrete implementation details regarding error handling and edge cases.',
          evidence: `Completed ${finalTranscripts.length} project-specific interview rounds.`,
          recommendation: 'Review the Architecture and Modules pages to strengthen explanations of inter-file data flow.'
        }
      };
    } else {
      const prompt = `
You are a Lead Software Architect conducting a job interview evaluation for the role of: "${targetRole || 'Software Engineer'}".
Project Context:
- Project Name: ${project.name}
- Tech Stack: ${JSON.stringify(project.techStack)}
- Primary Files: ${JSON.stringify((project.importantFiles || []).map(f => f.name))}
- Endpoints: ${JSON.stringify((project.endpointRoutes || []).map(r => `[${r.method}] ${r.path}`))}
- Database: ${JSON.stringify(project.databaseInfo)}

Interview Transcript:
${JSON.stringify(finalTranscripts.map((t, idx) => ({
  round: idx + 1,
  question: typeof t.question === 'object' ? t.question.question : t.question,
  category: t.category || 'Technical',
  candidateAnswer: t.answer
})))}

Strict Evaluation Instructions:
1. For EACH question and candidate answer in the transcript, provide a rigorous, helpful evaluation:
   - "correctness": Assessment string (e.g. "Strong (90%)", "Good (75%)", "Adequate (60%)", or "Incomplete (20%)")
   - "score": Integer between 0 and 100
   - "explainedWell": What the candidate explained accurately
   - "missingPoints": Important technical or project-specific points they omitted
   - "couldImprove": Practical advice on how to improve this answer in a real interview
   - "sampleAnswer": A high-quality model answer showing how a software engineer should answer this question for this specific project.
2. Evaluate overall scores out of 100 for communication, technicalDepth, and projectKnowledge.
3. Identify weak areas and constructive feedback bullets.

Return a JSON object strictly matching this format (no markdown blocks, no leading \`\`\`json, just pure JSON text):
{
  "score": {
    "communication": 80,
    "technicalDepth": 75,
    "projectKnowledge": 85
  },
  "questionEvaluations": [
    {
      "question": "Question text",
      "answer": "Candidate answer",
      "category": "API & Routing",
      "correctness": "Good (80%)",
      "score": 80,
      "explainedWell": "Specific positive points",
      "missingPoints": "Specific omitted points",
      "couldImprove": "How to strengthen answer",
      "sampleAnswer": "Model answer referencing the actual project"
    }
  ],
  "feedback": [
    "Feedback recommendation 1",
    "Feedback recommendation 2"
  ],
  "weakAreas": [
    "Weak topic 1",
    "Weak topic 2"
  ],
  "explanationSummary": {
    "strength": "Overall strength observed in answers",
    "weakness": "Overall weakness observed in answers",
    "evidence": "Observed files and concepts",
    "recommendation": "Next recommended study area"
  }
}
`;

      try {
        const aiResponse = await generateJSONContentWithFallback(prompt, user);
        evalResult = aiResponse.data;
        // Fallback for questionEvaluations if AI omitted it
        if (!evalResult.questionEvaluations || evalResult.questionEvaluations.length === 0) {
          evalResult.questionEvaluations = finalTranscripts.map((t, idx) => ({
            question: typeof t.question === 'object' ? t.question.question : t.question,
            answer: t.answer || 'No response.',
            category: t.category || 'Technical Depth',
            correctness: 'Adequate (70%)',
            score: 70,
            explainedWell: 'Addressed the question topic.',
            missingPoints: 'Could elaborate more on project file details and edge cases.',
            couldImprove: 'Reference exact files and error handling strategies.',
            sampleAnswer: `In ${project.name}, this logic is handled by modular controllers and services ensuring separation of concerns and clear data contracts.`
          }));
        }
      } catch (err) {
        console.warn('[Interview] AI evaluation fallback:', err.message);
        evalResult = {
          score: { communication: 75, technicalDepth: 70, projectKnowledge: 75 },
          questionEvaluations: finalTranscripts.map((t) => ({
            question: typeof t.question === 'object' ? t.question.question : t.question,
            answer: t.answer || 'No response.',
            category: t.category || 'Technical Depth',
            correctness: 'Adequate (70%)',
            score: 70,
            explainedWell: 'Addressed the question topic.',
            missingPoints: 'Could elaborate more on project file details and edge cases.',
            couldImprove: 'Reference exact files and error handling strategies.',
            sampleAnswer: `In ${project.name}, this logic is handled by modular controllers and services ensuring separation of concerns and clear data contracts.`
          })),
          feedback: ['Satisfactory understanding of codebase.'],
          weakAreas: ['Architecture components connection'],
          explanationSummary: {
            strength: 'Good communication flow.',
            weakness: 'Could expand more on error handling.',
            evidence: 'Answered mock interview questions.',
            recommendation: 'Review project modules and file dependencies.'
          }
        };
      }
    }

    const finalScore = Math.round(
      ((evalResult.score?.communication || 70) + 
       (evalResult.score?.technicalDepth || 70) + 
       (evalResult.score?.projectKnowledge || 70)) / 3
    );

    const interview = await MockInterview.create({
      user: req.user.id,
      project: projectId,
      questions: finalTranscripts.map(t => typeof t.question === 'object' ? t.question.question : t.question),
      answers: finalTranscripts.map(t => t.answer),
      questionEvaluations: evalResult.questionEvaluations || [],
      evaluation: {
        communication: evalResult.score?.communication || 70,
        technicalDepth: evalResult.score?.technicalDepth || 70,
        projectKnowledge: evalResult.score?.projectKnowledge || 70
      },
      weakAreas: evalResult.weakAreas || [],
      recommendations: evalResult.feedback || [],
      finalScore,
      explanationSummary: evalResult.explanationSummary
    });

    let xpAwarded = 0;
    if (user && finalScore >= 50) {
      xpAwarded = 250;
      await awardXP(user, xpAwarded, 'interview_complete');
    }

    res.status(201).json({
      interview,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        levelName: user.levelName,
        streak: user.streak,
        streakCalendar: user.streakCalendar
      },
      xpAwarded
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/prepare/:id/interview/history
const getInterviewHistory = async (req, res, next) => {
  const projectId = req.params.id;

  try {
    const history = await MockInterview.find({ project: projectId, user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate technical interview readiness index dynamically (Phase 16)
// @route   GET /api/prepare/:id/readiness
const getInterviewReadiness = async (req, res, next) => {
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // 1. Fetch Quiz scores average
    const quizzes = await QuizAttempt.find({ project: projectId, user: req.user.id });
    let quizAvg = 0;
    if (quizzes.length > 0) {
      const sum = quizzes.reduce((acc, curr) => acc + (curr.score / curr.questions.length * 100), 0);
      quizAvg = Math.round(sum / quizzes.length);
    }

    // 2. Fetch Viva scores average
    const vivas = await VivaAttempt.find({ project: projectId, user: req.user.id });
    let vivaAvg = 0;
    if (vivas.length > 0) {
      const sum = vivas.reduce((acc, curr) => acc + curr.score, 0);
      vivaAvg = Math.round(sum / vivas.length);
    }

    // 3. Fetch MockInterview scores average
    const interviews = await MockInterview.find({ project: projectId, user: req.user.id });
    let interviewAvg = 0;
    if (interviews.length > 0) {
      const sum = interviews.reduce((acc, curr) => acc + curr.finalScore, 0);
      interviewAvg = Math.round(sum / interviews.length);
    }

    // 4. Fetch Learning roadmap progress completion percentage
    const progressLogs = await LearningProgress.find({ project: projectId, user: req.user.id, completionStatus: 'completed' });
    const tech = project.techStack;
    let totalModules = 3;
    if (tech.some(t => ['React', 'Vue', 'Angular'].includes(t))) totalModules += 1;
    if (tech.some(t => ['Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Symfony', 'Go', 'PHP'].includes(t))) totalModules += 1;
    if (project.databaseInfo?.dbType && project.databaseInfo.dbType !== 'None detected') totalModules += 1;
    
    const progressPct = Math.round((progressLogs.length / totalModules) * 100);

    // 5. Calculate Readiness Index
    const comprehension = project.understanding || 80;
    const readinessIndex = Math.round(
      (quizAvg * 0.2) + (vivaAvg * 0.2) + (interviewAvg * 0.3) + (comprehension * 0.1) + (progressPct * 0.2)
    );

    // 6. Fetch latest evaluations for explainable scoring details
    const latestInterview = await MockInterview.findOne({ project: projectId, user: req.user.id })
      .sort({ createdAt: -1 });
    const latestViva = await VivaAttempt.findOne({ project: projectId, user: req.user.id })
      .sort({ createdAt: -1 });

    let weakAreas = [];
    let recommendations = [];
    let strengths = [];

    if (latestInterview) {
      weakAreas = latestInterview.weakAreas || [];
      recommendations = latestInterview.recommendations || [];
      if (latestInterview.explanationSummary?.strength) strengths.push(latestInterview.explanationSummary.strength);
    }
    
    if (latestViva && latestViva.feedback && latestViva.feedback.length > 0) {
      recommendations = [...recommendations, ...latestViva.feedback];
      if (latestViva.explanationSummary?.strength) strengths.push(latestViva.explanationSummary.strength);
    }

    if (weakAreas.length === 0) {
      weakAreas.push('Asynchronous routing exception boundaries');
      if (tech.includes('Express') || tech.includes('Django')) {
        weakAreas.push('Authorization middleware validation lifecycle');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Review middleware validations and routes security checks.');
      recommendations.push('Practice explaining the async data flow from route controller to models.');
    }

    if (strengths.length === 0) {
      strengths.push('Scanned codebase metrics showing healthy file distributions.');
    }

    res.json({
      quizAvg,
      vivaAvg,
      interviewAvg,
      progressPct,
      readinessIndex: Math.min(100, Math.max(0, readinessIndex)),
      weakAreas: Array.from(new Set(weakAreas)),
      recommendations: Array.from(new Set(recommendations)).slice(0, 3),
      strengths: Array.from(new Set(strengths)).slice(0, 3)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate 10 targeted practice questions dynamically (Task 9)
// @route   GET /api/prepare/:id/practice
const getPracticeQuestions = async (req, res, next) => {
  const { category } = req.query; // APIs, Database, Security, Frontend, Architecture, or custom Weak Area
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(req.user.id);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallbacks = Array.from({ length: 10 }, (_, i) => ({
        question: `Practice Question ${i + 1}: How does the codebase manage ${category || 'general'} operations?`,
        options: ['Through direct static configs', 'Using active controller bindings', 'Via filesystem streams', 'No handler defined'],
        correct: 1,
        explanation: 'Factual files scans verify variables configurations.'
      }));
      return res.json(fallbacks);
    }

    const prompt = `
You are a Lead Software Architect. Generate exactly 10 distinct, target multiple choice practice questions focusing on the category "${category || 'General'}" within this scanned project codebase:
- Project Name: ${project.name}
- Tech Stack: ${JSON.stringify(project.techStack)}
- Scanned Files: ${JSON.stringify(project.importantFiles.map(f => f.name))}
- Endpoints: ${JSON.stringify(project.endpointRoutes)}
- Database: ${JSON.stringify(project.databaseInfo)}

Strict Grounding Instructions:
1. Every question must be directly related to the category and codebase context.
2. Return a JSON array strictly matching this format (no markdown blocks, no leading \`\`\`json, just pure JSON text):
[
  {
    "question": "Practice question text?",
    "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
    "correct": 0,
    "explanation": "Explanation based on project evidence."
  }
]
`;

    console.log(`[Practice] Generating 10 practice questions for category ${category}...`);
    const aiResponse = await generateJSONContentWithFallback(prompt, user);
    res.json(aiResponse.data);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/prepare/:id/quiz/history
const getQuizHistory = async (req, res, next) => {
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const history = await QuizAttempt.find({ project: projectId, user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/prepare/:id/viva/history
const getVivaHistory = async (req, res, next) => {
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const history = await VivaAttempt.find({ project: projectId, user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoadmap,
  completeRoadmapModule,
  getQuizQuestions,
  submitQuizScore,
  getVivaQuestions,
  submitVivaAnswers,
  getInterviewQuestions,
  evaluateMockInterview,
  getInterviewHistory,
  getInterviewReadiness,
  getQuizHistory,
  getVivaHistory,
  getPracticeQuestions
};
