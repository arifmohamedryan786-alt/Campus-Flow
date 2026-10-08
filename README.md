# CampusFlow AI 🎓
> Student Productivity and Academic Management Platform

CampusFlow AI is a complete, full-stack student productivity platform built for college students. It integrates timetable scheduling, dynamic attendance analytics with forecast predictions, coursework task management with AI priorities, an interactive academic AI assistant, and a notification center.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS 3, Lucide React icons, React Router DOM v6
- **Backend**: Node.js, Express.js, JWT Authentication, Bcrypt Password Hashing, CORS
- **Database**: SQLite 3 (`sqlite` + `sqlite3` driver), Parameterized Queries, Database Auto-Seeder

---

## 📁 Project Structure

```
Campus Flow/
├── .env.example              # Sample environment variables
├── README.md                 # Documentation & setup instructions
├── database/
│   └── campusflow.db         # SQLite Database file
├── server/
│   ├── .env                  # Backend server configuration
│   ├── package.json          # Node dependencies
│   ├── index.js              # Express app entry point
│   ├── database/
│   │   ├── db.js             # Database schema initialization
│   │   └── seed.js           # Database seed script for demo student
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Login, logout, auth verification, password change
│       ├── dashboard.js      # Dashboard summary metrics & AI priorities
│       ├── timetable.js      # Weekly & daily class timetable API
│       ├── attendance.js     # Attendance analytics & prediction forecast API
│       ├── tasks.js          # Coursework tasks CRUD API
│       ├── notifications.js  # System alerts & notification center API
│       ├── profile.js        # Student profile & settings API
│       └── ai.js             # AI priority calculation & Q&A assistant API
└── client/
    ├── package.json          # Frontend dependencies
    ├── index.html            # Entry HTML template with Google Fonts
    ├── vite.config.js        # Vite build & dev config
    ├── tailwind.config.js    # Tailwind design system configuration
    ├── postcss.config.js     # PostCSS configuration
    └── src/
        ├── index.css         # Tailwind directives & base styles
        ├── main.jsx          # React app entry point
        ├── App.jsx           # React Router & protected routes
        ├── context/
        │   └── AuthContext.jsx  # Authentication state provider
        ├── services/
        │   └── api.js        # Centralized REST API service client
        ├── components/
        │   ├── Header.jsx    # Sticky navigation bar with student avatar dropdown
        │   ├── Sidebar.jsx   # Responsive navigation sidebar
        │   └── Layout.jsx    # Application shell layout
        └── pages/
            ├── Login.jsx         # Professional student login page with demo auto-fill
            ├── Dashboard.jsx     # Overview metrics, today's timetable & priorities
            ├── Timetable.jsx     # Class schedule with day filters & live status
            ├── Attendance.jsx    # Subject cards & Attendance Forecast predictions
            ├── Tasks.jsx         # Coursework task CRUD, priority tags & overdue filters
            ├── AIAssistant.jsx   # Interactive academic query chat agent
            ├── Notifications.jsx # System warnings & deadline alert center
            ├── Profile.jsx       # Student profile & department info editor
            └── Settings.jsx      # Password management & notification preferences
```

---

## 🔐 Demo Login Credentials

For quick evaluation, pre-seeded demo student data is provided:

- **College Email**: `arif@college.edu`  *(or Student ID: `STU202489`)*
- **Password**: `password123`

*(A one-click **"Fill Demo"** button is also available directly on the login page).*

---

## 🛠️ How to Run the Application

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 1. Database Setup & Seeding

Navigate to the `server/` directory, install dependencies, and run the seed script:

```bash
cd server
npm install
npm run seed
```

### 2. Start the Backend Server

From the `server/` directory, start the Express server (runs on `http://localhost:5001`):

```bash
npm run dev
# or
npm start
```

### 3. Start the Frontend Client

In a new terminal window, navigate to the `client/` directory, install dependencies, and launch Vite:

```bash
cd client
npm install
npm run dev
```

Open your browser at `http://localhost:5173/` to log in and test the application!

---

## ✨ Implemented Features

1. **Secure Student Authentication (`/login`)**:
   - JWT session management & `bcryptjs` password hashing.
   - Dual identifier login (Email or Student ID).
   - Show/hide password toggle, input validation, and password reset modal.

2. **Student Dashboard (`/dashboard`)**:
   - Time-aware greeting ("Good morning / afternoon / evening, Arif").
   - Summary cards: Overall Attendance Rate, Today's Classes, Pending Tasks, Urgent Deadlines.
   - Today's Priorities list powered by rule engine evaluation.
   - Today's Timetable schedule with real-time status indicators (`Upcoming`, `Ongoing`, `Completed`).

3. **Academic Timetable (`/timetable`)**:
   - Day selector filter (Monday through Sunday or All Days).
   - Class details: Subject code, title, faculty, room location, start & end times.
   - Real-time status tags computed dynamically against current local time.

4. **Attendance Module & Attendance Forecast (`/attendance`)**:
   - Subject-level breakdown with total, present, and absent class counters.
   - Color-coded progress bars (red if below target 75%, emerald if safe).
   - **Dynamic Attendance Forecast**: Calculates exact number of consecutive upcoming classes needed to reach 75% target or how many classes can be safely missed.
   - Interactive class logger buttons ("Present" / "Absent") to test real-time forecast updates.

5. **Task & Coursework Management (`/tasks`)**:
   - Full SQLite CRUD operations (Create, Read, Update, Delete).
   - Status filters: All, Pending, Overdue, Completed.
   - Priority badges (`High`, `Medium`, `Low`) and subject association.
   - Automatic overdue calculation based on current date.

6. **AI Priority & AI Assistant (`/ai-assistant`)**:
   - Rule-based AI evaluation engine analyzing live database state (tasks, due dates, timetable, attendance risk).
   - Interactive chat interface with quick suggested prompts (*"What should I study today?"*, *"Which subject has attendance risk?"*).
   - Modular architecture ready for external LLM API (OpenAI / Gemini API) integration in future releases.

7. **Notification Center (`/notifications`)**:
   - Real-time alerts for attendance warnings (< 75%), assignment deadlines, and completed task milestones.
   - Filter read/unread states and "Mark All as Read" capabilities.

8. **Student Profile (`/profile`)**:
   - View and edit student name, college email, department, and academic year.
   - Live avatar and student ID card preview.

9. **Settings & Security (`/settings`)**:
   - Password change module with current password verification.
   - Notification preference toggles & custom target attendance percentage setting.

---

## 📌 Remaining Limitations & Architecture Notes

- **Version 1.0 AI Engine**: The AI assistant uses backend rule logic evaluating SQLite database records to ensure zero hallucination and 100% accurate data representation. The route structure (`server/routes/ai.js`) is modularly designed so a real LLM API (e.g., Google Gemini or OpenAI GPT-4) can be plugged in by attaching an API key in `.env`.
