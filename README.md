# TaskFlow — Team Task Manager

A full-stack collaborative task management web application where teams can create projects, assign tasks, and track progress with role-based access control.

> Built with Node.js (Express) + sql.js (SQLite) backend and React (Vite) frontend.

## Live Demo

> 🔗 **[Your Railway URL here after deployment]**

---

## Features

### Authentication
- Secure signup / login with JWT tokens (7-day expiry)
- Password hashing with bcryptjs
- Protected routes on both frontend and backend

### Project Management
- Create projects (creator auto-assigned as Admin)
- Admin can add members by email, remove members
- Members can view only their assigned projects

### Task Management (Kanban Board)
- Create tasks with Title, Description, Due Date, Priority (Low/Medium/High)
- Assign tasks to project members
- Drag-free status update: To Do → In Progress → Done
- Role-based editing: Admins can do everything; Members can only update status of their own tasks

### Dashboard
- Total tasks count
- Tasks by status (donut chart)
- Overdue tasks with warnings
- Project quick-navigation

### My Tasks
- Aggregated view of all tasks assigned to the current user
- Filter by status or overdue
- Update task status inline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Recharts, Axios, Vite |
| Backend | Node.js, Express 4 |
| Database | sql.js (SQLite in pure JS, no native bindings) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Deployment | Railway |

---

## Project Structure

```
taskmanager/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── routes/
│   │   ├── auth.js          # /api/auth
│   │   ├── projects.js      # /api/projects
│   │   ├── tasks.js         # /api/tasks
│   │   └── dashboard.js     # /api/dashboard
│   ├── database.js          # sql.js DB init & wrapper
│   ├── server.js            # Express app entry
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   └── MyTasks.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── railway.toml
├── nixpacks.toml
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/taskmanager.git
cd taskmanager
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values:
# JWT_SECRET=your-long-random-secret
# PORT=5000

npm install
npm start
# API running at http://localhost:5000
```

### 3. Frontend Setup (new terminal)

```bash
cd frontend
cp .env.example .env
# .env should contain:
# VITE_API_URL=http://localhost:5000/api

npm install
npm run dev
# App running at http://localhost:5173
```

### 4. Open the app

Visit [http://localhost:5173](http://localhost:5173) and sign up.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/projects` | ✓ | Any |
| POST | `/api/projects` | ✓ | Any |
| GET | `/api/projects/:id` | ✓ | Member+ |
| POST | `/api/projects/:id/members` | ✓ | Admin |
| DELETE | `/api/projects/:id/members/:userId` | ✓ | Admin |
| DELETE | `/api/projects/:id` | ✓ | Admin |

### Tasks
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/tasks?project_id=X` | ✓ | Member+ |
| POST | `/api/tasks` | ✓ | Admin |
| PATCH | `/api/tasks/:id` | ✓ | Admin or Assignee |
| DELETE | `/api/tasks/:id` | ✓ | Admin |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Global stats |
| GET | `/api/dashboard?project_id=X` | Project stats |

---

## Deployment on Railway

### Step 1: Push to GitHub

Run these commands **inside the `taskmanager/` folder** (not your user home directory):

```bash
cd taskmanager
git init
git add .
git commit -m "Team Task Manager - full stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskmanager.git
git push -u origin main
```

> If `git init` was accidentally run in `C:\Users\HP`, create a fresh repo only in `taskmanager/` as shown above.

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository
3. Railway auto-detects `nixpacks.toml` and builds

### Step 3: Set Environment Variables

In Railway dashboard → your service → **Variables**, add:

| Variable | Value |
|---|---|
| `JWT_SECRET` | Long random string (32+ chars) — **required** |
| `NODE_ENV` | `production` — serves the React build from the API |
| `DB_PATH` | `/data/taskmanager.db` — use with a volume (step 4) |

> Railway sets `PORT` automatically. Do **not** hard-code it.
>
> The frontend is served by the backend in production (`frontend/dist`).
> No separate frontend service or `VITE_API_URL` is needed (the app uses `/api` on the same host).

### Step 4: Add a Volume (recommended)

Railway’s filesystem is ephemeral. Without a volume, your SQLite DB resets on every redeploy.

1. In your service → **Volumes** → **Add Volume**
2. Mount path: `/data`
3. Set variable: `DB_PATH=/data/taskmanager.db`

### Step 5: Generate Public URL

1. Service → **Settings** → **Networking** → **Generate Domain**
2. Copy the URL (e.g. `https://taskmanager-production-xxxx.up.railway.app`)
3. Paste it into this README under **Live Demo** and in your submission

### Step 6: Verify deployment

- `https://YOUR-URL.up.railway.app/api/health` → `{"status":"ok",...}`
- `https://YOUR-URL.up.railway.app/` → login/signup page
- Sign up, create a project, add a task

---

## Database Design

### Users
```sql
id, name, email (unique), password (hashed), created_at
```

### Projects
```sql
id, name, description, created_by (→ users), created_at
```

### Project Members
```sql
id, project_id (→ projects), user_id (→ users), role (admin|member), joined_at
UNIQUE(project_id, user_id)
```

### Tasks
```sql
id, project_id (→ projects), title, description, due_date,
priority (low|medium|high), status (todo|inprogress|done),
assigned_to (→ users), created_by (→ users), created_at, updated_at
```

---

## Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| Create project | ✓ | ✓ (becomes admin) |
| Add/remove members | ✓ | ✗ |
| Create tasks | ✓ | ✗ |
| Edit any task field | ✓ | ✗ |
| Update own task status | ✓ | ✓ |
| Delete tasks | ✓ | ✗ |
| Delete project | ✓ | ✗ |
| View project & tasks | ✓ | ✓ |

---

## Security Notes

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens signed with configurable secret, expire in 7 days
- All API routes (except auth) require valid JWT
- Role checks enforced server-side on every request
- SQL parameters use parameterized queries (no SQL injection)
- CORS configured to restrict origins in production

---

## License

MIT
