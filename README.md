# Success Solar ERP

A full-stack Enterprise Resource Planning (ERP) application for a solar business, featuring lead management, project tracking, quotations, accounting, stock management, and HR portals.

## 🏗️ Project Structure

- `backend/`: FastAPI backend with PostgreSQL (SQLAlchemy + Asyncpg).
- `frontend/`: React frontend built with Vite, TailwindCSS, and TypeScript.

---

## 🚀 Setup Instructions

### 1. Backend Setup

**Prerequisites:**
- Python 3.11+
- PostgreSQL server running locally (or remotely) on port 5432.

**Steps:**
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On Mac/Linux: source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   python -m venv venv
   ```
4. Database Configuration:
   - Ensure your PostgreSQL server is running.
   - Create a database named `ssc`.
   - Update `backend/.env` with your PostgreSQL credentials if they differ from the default (`postgresql+asyncpg://postgres:Basha@localhost:5432/ssc`).
5. Seed the Database:
   Run the seed script to automatically create database tables and populate sample employees, leads, and stock items.
   ```bash
   python seed.py
   ```
6. Start the Backend Server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend API will run on `http://127.0.0.1:8000`.*

### 2. Frontend Setup

**Prerequisites:**
- Node.js (v18+ recommended)

**Steps:**
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

---

## 🔐 Login Details

When you run the `python seed.py` script, several test accounts are generated with different roles. 

**Default Password for all seeded accounts:**
```
SolarERP@2024
```

**Common Usernames for Testing:**
- **CEO Portal:** `rajesh.ceo`
- **Marketing (Telecalling):** `priya.tele`
- **Marketing (Direct/Field):** `arun.dme`
- **Project Head:** `meena.pm`
- **Accounts:** `dinesh.acct`

---

## 📡 API Documentation
Once the backend server is running, you can view the interactive Swagger API documentation by navigating to:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
