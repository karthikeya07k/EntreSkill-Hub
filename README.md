# EntreSkill Hub - Skill-to-Startup Enablement Platform

EntreSkill Hub is a full-stack web platform that helps aspiring micro-entrepreneurs convert practical skills into viable businesses using structured roadmaps, learning resources, and mentor support.

This implementation includes:
- Responsive web frontend (React + Tailwind CSS)
- Backend API (Node.js + Express.js)
- MongoDB data models
- REST APIs
- Real-time mentor-mentee chat and session updates (Socket.IO)
- Role-based dashboards (User, Mentor, Admin)

## 1. Tech Stack (As Requested)

- Frontend: `React.js`, `HTML5`, `CSS3`, `JavaScript`, `Tailwind CSS`
- Backend: `Node.js`, `Express.js`
- APIs: `REST`
- Database: `MongoDB`
- Realtime: `Socket.IO`
- Deployment-ready targets: AWS / Vercel / Netlify supported by architecture

## 2. Project Structure

```text
EDUCA/
  backend/
    src/
      config/        # DB + Socket config
      controllers/   # Business logic
      middleware/    # Auth, RBAC, validation
      models/        # MongoDB entities
      routes/        # REST endpoints
      services/      # Recommendation service
      utils/         # Token utility
    scripts/
      seed.js        # Seed sample data
  frontend/
    src/
      components/    # Shared UI components
      context/       # Auth context
      layouts/       # App shell layout
      pages/         # Feature pages
      services/      # API and socket clients
```

## 3. Core Features Implemented

### User Features
- Registration and login with JWT authentication
- Skill and interest profiling
- Business idea recommendations based on profile
- Business roadmap access with steps:
  - idea validation
  - required skills and tools
  - legal/registration guidance
  - cost estimation
  - marketing basics
- Learning resources access (video/article/checklist)
- Progress tracking dashboard
- Bookmark/save business ideas
- Feedback submission

### Mentor / Trainer Features
- Mentor registration
- Mentor verification workflow (handled by admin)
- Upload training resources
- Session request management
- Mentor engagement analytics
- Real-time Q&A/chat in mentorship sessions

### Admin Features
- Manage users and mentors
- Verify/unverify mentors
- Approve/reject training resources
- View platform stats and feedback
- Curate ideas/roadmaps via APIs

## 4. Data Entities Implemented

- Users
- Skills
- Interests
- Business Ideas
- Roadmaps (with step details)
- Learning Resources
- Mentor Sessions
- Progress Tracking
- Chat Messages
- Feedback

## 5. Real-Time Experience

Real-time functionality is implemented with Socket.IO:
- live mentor session request notifications
- live session status updates
- live mentor-mentee chat in session rooms

## 6. Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Docker)

### Option A: Start MongoDB with Docker
```bash
docker compose up -d
```

### Install Dependencies
```bash
npm install
```

### Seed Sample Data
```bash
npm run seed
```

### Run Frontend + Backend Together
```bash
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)  
Backend: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## 7. Demo Accounts (After Seeding)

- Admin: `admin@entreskillhub.com` / `Admin@123`
- Mentor: `mentor1@entreskillhub.com` / `Mentor@123`
- User: `user1@entreskillhub.com` / `User@123`

## 8. Environment Variables

### backend/.env
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/entreskill_hub
JWT_SECRET=entreskill_local_jwt_secret_change_me
CLIENT_URL=http://localhost:5173
```

### frontend/.env
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 9. Key API Groups

- `/api/auth` - authentication
- `/api/users` - profile, bookmarks, dashboard, progress
- `/api/meta` - skills/interests master data
- `/api/ideas` - business idea curation/recommendation
- `/api/roadmaps` - roadmap retrieval and progress updates
- `/api/resources` - learning resources and approvals
- `/api/mentors` - mentor directory, sessions, engagement, chat history
- `/api/admin` - admin controls and analytics
- `/api/feedback` - user feedback

## 10. Non-Functional Alignment

- Performance: lightweight API responses and modular UI
- Security: JWT auth, role-based access control, validation middleware, Helmet, CORS
- Accessibility: responsive UI and low-complexity navigation
- Scalability: modular backend routes/controllers and extendable data schema

---

If you want, the next step can be Phase 2 enhancements: multilingual content, AI skill-to-business matching, and government/funding integrations.
