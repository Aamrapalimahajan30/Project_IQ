# ProjectIQ

AI-Powered Project Intelligence & Interview Preparation Platform

## Problem
Developers often struggle to understand and confidently explain their own projects during technical interviews. When faced with deep architectural questions or open-ended vivas, they may find it difficult to articulate their codebase's data flows, model schemas, and dependency mappings.

## Solution
ProjectIQ analyzes an uploaded software codebase using programmatic static analysis scanners and Google Gemini AI, creating a personalized learning roadmap and interview preparation platform. It simulates real-world oral vivas, technical mock interviews, and MCQ quizzes grounded strictly in the developer's actual uploaded repository assets.

---

## Features

### 📁 Codebase Analysis & Scanning
* **Secure ZIP Upload**: Multi-layered security filters enforcing upload size limits (50MB) and folder entry constraints (max 2000 items).
* **Static Scanner**: Parses file lines distribution counts, API routing configurations, and manifest dependencies.
* **Architecture Mappings**: Programmatic AST parser mapping import-require bonds to render interactive dependency node graphs.
* **Code Smells & Auditor**: Programmatic linter flagging try-catch mismatch blocks and hardcoded secret keys.

### 🧠 Grounded AI Intelligence
* **RAG-based AI Project Chat**: Ingests code files in overlapping segments and queries `gemini-embedding-2` to run local Cosine Similarity matches. The chat utilizes relevant code blocks to formulate answers mentioning specific filenames, parameters, and design logic.
* **Dynamic Roadmaps**: Seeds custom learning paths matching the codebase's stack, including lines count statistics and files parameters details.
* **Assessment Terminal**: Integrates dynamically generated quizzes, progressively difficult oral vivas (categorized into security, design decisions, etc.), and mock technical interviews.

### 🏆 Gamification Hub
* **XP Service & Levels**: Tracks profile progress, awarding XP authoritative from the backend to ensure a single source of truth.
* **Badges**: Awards streak badges, first analysis badges, and architecture master badges based on user progression.
* **Streak Calendar**: Automatically increments streaks for consecutive login days.

### 📊 Performance Reports
* **Calculated Readiness Index**: Dynamically averages candidates' marks across all attempts:
  $$\text{Readiness Index} = (\text{QuizAvg} \times 0.2) + (\text{VivaAvg} \times 0.2) + (\text{InterviewAvg} \times 0.3) + (\text{Comprehension} \times 0.1) + (\text{Progress} \times 0.2)$$
* **Printable PDF Export**: Pixel-perfect A4 scorecard templates compiling dynamic weaknesses, strengths, and AI mentor directive checklists.

---

## Architecture Flow

```text
React (Vite Client)
       ↓
Express REST API
       ↓
Static Programmatic Scanner
       ↓
Google Gemini AI Engine
       ↓
MongoDB Atlas
       ↓
RAG (Cosine Similarity)
       ↓
Learning & Assessments Terminal
```

---

## Installation & Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Local Server (running on `mongodb://localhost:27017`)
* Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example` and configure parameters:
   ```text
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/projectiq
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5173
   ```
4. Run the server:
   ```bash
   node server.js
   ```

### Frontend Setup
1. Navigate to the root folder:
   ```bash
   cd ..
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example` and set:
   ```text
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the dev client:
   ```bash
   npm run dev
   ```

---

## Security Specifications
* **BCrypt Hashing**: Salts and hashes credentials securely.
* **JWT Access**: Enforces stateless authentication checks.
* **IDOR Validation**: Validates user ownership on every database project query:
  ```javascript
  Project.findOne({ _id: projectId, user: req.user.id })
  ```
* **Zip Bomb Shields**: Restricts uncompressed sizes (max 200MB) and entries limits (max 2000 entries).
