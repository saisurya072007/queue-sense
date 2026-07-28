# SmartGov AI – Kakinada
## AI-Powered Citizen Services Portal

> Skip the queue. Save your time. Built for the citizens of Kakinada, Andhra Pradesh.

---

## 🚀 Project Overview

SmartGov AI is a full-stack web application that helps Kakinada citizens avoid long waits at government offices and banks using **AI-powered queue predictions**, **live queue monitoring**, and a **bilingual chatbot** (English + Telugu).

---

## 🏗️ Project Structure

```
smartgov-kakinada/
├── frontend/          # React.js + Vite (Citizen Portal, Employee Dashboard, Admin Panel)
├── backend/           # Node.js + Express (REST API, JWT Auth, Audit Logs)
├── ai-service/        # Python FastAPI + Scikit-learn (Wait Time & Crowd Prediction)
└── database/          # PostgreSQL Schema + Seed Data
```

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

1. Create a PostgreSQL database (Supabase or local)
2. Run schema: `database/schema.sql`
3. Run seed data: `database/seed.sql`
4. Update `backend/.env` with your connection string

---

## ⚙️ Backend Setup (Node.js + Express)

```bash
cd backend
# Edit .env with your DATABASE_URL
npm install
npm run dev
# Server runs on http://localhost:5000
```

**Default Admin Credentials:**
- Username: `superadmin`
- Password: `Admin@123`

**Demo Employee:**
- Username: `meeseva_emp1`
- Password: `Employee@123`

---

## 🖥️ Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 🤖 AI Service Setup (Python FastAPI)

```bash
cd ai-service
pip install -r requirements.txt
python model.py    # Train models first (creates models/ folder)
python main.py     # Start FastAPI on http://localhost:8000
# OR: uvicorn main:app --reload --port 8000
```

---

## 🔑 Credentials Summary

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `Admin@123` |
| MeeSeva Employee | `meeseva_emp1` | `Employee@123` |
| RTO Employee | `rto_emp1` | `Employee@123` |
| SBI Employee | `sbi_emp1` | `Employee@123` |
| Passport Manager | `passport_emp1` | `Employee@123` |

> ⚠️ **Change all passwords in production!**

---

## 🏛️ Supported Offices (Kakinada)

**Government:** MeeSeva, RTO, Collectorate, Municipal Corporation, Registration Office, Tahsildar Office, Passport Office

**Banks:** SBI, Union Bank, Canara Bank, Indian Bank, Andhra Bank, HDFC, ICICI, Axis Bank

---

## 📋 Features

### Citizen Portal
- ✅ Live queue status with auto-refresh (every 30s)
- ✅ AI-predicted wait time
- ✅ Crowd level gauge (SVG animated)
- ✅ Best time to visit recommendation
- ✅ Service guide with documents, fees, eligibility, steps, FAQs
- ✅ Analytics dashboard (7-day, 30-day, peak hours, monthly)
- ✅ Bilingual AI chatbot (English + Telugu)
- ✅ Token issuance
- ✅ Dark/Light mode

### Employee Dashboard
- ✅ Update current serving token
- ✅ Pause/Resume queue with reason
- ✅ Post announcements
- ✅ View queue entries
- ✅ Activity log

### Super Admin Panel
- ✅ Dashboard with live stats
- ✅ Create/manage employees
- ✅ Reset employee passwords
- ✅ Deactivate employees (soft delete)
- ✅ Live queue monitor for all offices
- ✅ Office performance analytics
- ✅ Full audit logs with CSV download
- ✅ Post announcements

---

## 🔐 Security

- Bcrypt password hashing (12 rounds)
- JWT authentication with role-based access
- Express Helmet security headers
- Rate limiting (100 req/15min)
- CORS whitelist
- Input validation
- Audit logs for ALL actions (never deleted)

---

## 📡 API Endpoints

```
POST /api/auth/employee/login
POST /api/auth/admin/login
GET  /api/offices
GET  /api/offices/:id/services
GET  /api/queue/:officeId/status
GET  /api/queue/:officeId/predict?token=X
POST /api/queue/:officeId/join
PUT  /api/queue/:officeId/update-token  [Employee]
PUT  /api/queue/:officeId/pause         [Employee]
PUT  /api/queue/:officeId/resume        [Employee]
GET  /api/analytics/office/:officeId
GET  /api/analytics/admin/all           [Admin]
GET  /api/analytics/admin/logs          [Admin]
POST /api/admin/employees               [Admin]
GET  /api/admin/live-queues             [Admin]
POST /api/chatbot
```

---

## 🔮 Future Expansion

The architecture supports:
- Adding more cities across Andhra Pradesh
- Expanding to other states and all of India
- SMS/WhatsApp notifications
- Mobile app (React Native)
- Real-time WebSocket updates
- Face recognition token verification

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Recharts, Framer Motion, Lucide Icons |
| Backend | Node.js, Express.js, JWT, Bcrypt, Morgan |
| Database | PostgreSQL (Supabase compatible) |
| AI Service | Python FastAPI, Scikit-learn (Random Forest + Gradient Boosting) |
| Design | Custom CSS, Dark/Light Mode, Glassmorphism, Google Fonts (Inter + Space Grotesk) |

---

*Built with ❤️ for the citizens of Kakinada, Andhra Pradesh*
