# EntreSkill Hub

EntreSkill Hub is a skill-to-startup platform for aspiring micro-entrepreneurs with:
- role-based experiences (`Aspiring Entrepreneur`, `Mentor`, `Admin`)
- idea recommendation + roadmap execution
- structured learning tracks (tracks -> modules -> lessons)
- mentor onboarding approval workflow
- session chat + notes/tasks/follow-up workflows
- security-hardened auth (email verification OTP, lockout, reset password, rate limits)

## Production Feature Set

### 1) Authentication & Security
- Strong password policy (8+ chars with uppercase/lowercase/number/symbol)
- Email verification OTP before account access
- Forgot/reset password flow
- Login lockout after repeated failures
- IP-based auth rate limits
- Role-based route protection

### 2) Mentor Approval Flow
- Mentor application submission
- Admin review queue (`pending`, `approved`, `rejected`)
- Only approved mentors are visible/bookable
- Mentor status stored and shown on user/admin dashboards

### 3) Mentor Session Workflow
- Session requests and status updates
- Real-time chat (Socket.IO)
- Session notes
- Action tasks with status tracking
- Follow-up actions with next check-in
- Mentor engagement analytics

### 4) Learning System
- Structured learning tracks with module/lesson hierarchy
- Lesson completion tracking and course progress %
- Recommended tracks based on user skills/interests
- Admin track content manager (create + publish/unpublish)
- Curated external learning links (official/public sources)

---

## VS Code Run Guide (Step by Step)

Open project folder in VS Code.

### Step 1: Open terminal in VS Code
- VS Code menu: `Terminal` -> `New Terminal`
- Ensure prompt path is your project root:
  - `C:\Users\boddu\Documents\project\EDUCA`

### Step 2: Install dependencies
```powershell
npm install
```

### Step 3: Configure backend environment
Create file `backend/.env` using `backend/.env.example`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret
CLIENT_URL=http://localhost:5173,https://your-frontend.vercel.app,https://*.vercel.app
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15
EMAIL_OTP_TTL_MINUTES=10
PASSWORD_RESET_TTL_MINUTES=20
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@entreskillhub.com
```

### Step 4: Configure frontend environment
Create file `frontend/.env` using `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 5: Seed database
```powershell
npm run seed
```

### Step 6: Start app
```powershell
npm run dev
```

### Step 7: Open in browser
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`

---

## Demo Accounts (after seed)
- Admin: `admin@entreskillhub.com / Admin@123`
- Mentor (approved): `mentor1@entreskillhub.com / Mentor@123`
- Mentor (pending): `mentor3@entreskillhub.com / Mentor@123`
- User: `user1@entreskillhub.com / User@123`

---

## Deployment Guide

### Backend (Render)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Env Vars:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_URL` (must include stable Vercel URL)
  - auth/security vars
  - SMTP vars for real OTP/reset emails

### Frontend (Vercel)
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env Vars:
  - `VITE_API_URL=https://your-render-service.onrender.com/api`
  - `VITE_SOCKET_URL=https://your-render-service.onrender.com`

---

## Important Notes
- Never commit real secrets in git (`.env` files should stay local/private).
- If Vercel creates preview URLs, keep Render `CLIENT_URL` as:
  - stable domain and wildcard preview (already supported in backend parser):
  - `https://your-stable.vercel.app,https://*.vercel.app`
- Run seed whenever database is empty and pages show no tracks/skills/resources.
