# AI — DMS | Document Management System
### Full-Stack Prototype · Frontend + Node.js Backend

---

## 🗂 Project Structure

```
ADA SLINGSHOT/
├── landing.html          ← Landing / welcome page
├── index.html            ← Login page
├── dashboard.html        ← Real-time dashboard
├── repository.html       ← Document repository
├── upload.html           ← Upload & OCR processing
├── search.html           ← NLP smart search
├── workflow.html         ← Approval workflow
├── access.html           ← Role-based access control
├── app.js                ← Shared JS + API client
├── styles.css            ← Full theme system (light/dark)
├── start-backend.bat     ← One-click backend launcher (Windows)
└── backend/
    ├── server.js         ← Express API server (port 3001)
    ├── package.json
    └── data/
        ├── users.json       ← User accounts
        ├── documents.json   ← Document records
        └── workflow.json    ← Approval workflow items
```

---

## 🚀 How to Run

### Step 1 — Start the Backend
**Option A:** Double-click `start-backend.bat`

**Option B:** Terminal
```bash
cd backend
npm install    # first time only
node server.js
```
Backend runs at **http://localhost:3001**

### Step 2 — Open the Frontend
Open `landing.html` in your browser (double-click or open with Live Server).

> The frontend works in **demo mode** even without the backend running. All pages have graceful fallbacks.

---

## 🔐 Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@aidms.com` | `admin123` | Administrator |
| `manager@aidms.com` | `manager123` | Department Head |
| `staff@aidms.com` | `staff123` | General Staff |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/auth/login` | User login |
| GET | `/api/documents?q=` | List / search documents |
| POST | `/api/documents` | Upload new document |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/workflow` | Get workflow items |
| PATCH | `/api/workflow/:id` | Approve / return item |
| GET | `/api/stats` | Dashboard statistics |

---

## 🎨 Features

- ☀️ **Light / Dark Mode** — toggle persists across all pages via `localStorage`
- 🔐 **Auth Guard** — unauthenticated users redirected to login
- 📊 **Live Dashboard** — stats loaded from backend API
- 🔍 **NLP Search** — API-powered search with mock fallback
- 📤 **File Upload** — drag-and-drop with simulated OCR + AI classification, POSTs to backend
- ⚡ **Workflow Approvals** — PATCH backend in real-time
- 👥 **RBAC Access Control** — role-based permissions matrix
- 🟢 **Backend Status Dot** — shows online/offline state in topbar
