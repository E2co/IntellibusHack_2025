# IntellibusHack_2025

# 🕒 QMeNow

QMeNow is a **real-time digital queuing system** that allows users to join virtual queues remotely, track their live position, and receive notifications when their turn is near — reducing in-person wait times and improving service flow for both customers and staff.

> 🌐 Live Site: [https://qmenow.vercel.app](https://qmenow.vercel.app)  
> ⚙️ Admin Panel: `/admin` (restricted access)

---

## 📖 Table of Contents
- [About the Project](#about-the-project)
- [Features](#features)
- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Deployment](#deployment)
- [Contributors & Team](#contributors--team)

---

## 💡 About the Project

**QMeNow** is built to modernize how people wait in line.  
Instead of standing in a physical queue, users can:
- Join a **virtual line** via their phone or kiosk.  
- View **live updates** of their queue position and estimated wait time.  
- Receive **real-time updates** when it’s almost their turn.  

On the other side, staff can:
- Manage queues through an **interactive admin dashboard**.  
- Call the next ticket with one click.  
- Search and view customers waiting or past 

This system is designed for **banks, hospitals, government offices, and retail environments**, offering a faster, fairer, and more transparent waiting experience.

---

## ✨ Features

### 👥 User Side
- Join virtual queue remotely or via kiosk  
- View live ticket number, wait time, and counter status  
- Receive live time and wait information
- Option to cancel or reschedule queue ticket  

### 🖥️ Admin / Seller Side
- Manage and monitor active queues  
- Call next number with one click
- Search and view customers 
- View analytics (average wait time, queue length, etc.)

---

## 🧩 System Overview

The project follows a **client–server model**:
- **Frontend (Client):** built with React + Vite for speed and modern design  
- **Backend:** Node.js + Express server for REST APIs and business logic  
- **Database:** Firebase Firestore for real-time updates  
- **Authentication:** Firebase Auth for user and admin sign-in  
- **Hosting:** Deployed via Vercel (frontend) and Render or Railway (backend if separate)

---

## 🧱 Tech Stack

| Layer | Technology | Description |
|-------|-------------|-------------|
| Frontend | React (Vite) | UI framework for fast, modern web development |
| Backend | Node.js + Express | Handles routes, API endpoints, and validation |
| Database | Firebase Firestore | Cloud NoSQL database for real-time sync |
| Auth | Firebase Authentication | Secure login for users/admins |
| Styling | Tailwind CSS + Shadcn UI | Responsive, modern design system |
| State | React Hooks + Context API | For app-wide state and queue tracking |
| Deployment | Vercel | Fast, serverless frontend hosting |

---

## 📂 Folder Structure (NEEDS FINAL UPDATE)

QMeNow/
├── client/ # Frontend (React + Vite)
│ ├── src/
│ │ ├── components/ # Reusable UI elements
│ │ ├── pages/ # Home, Admin, JoinQueue, etc.
│ │ ├── hooks/ # Custom React hooks
│ │ ├── assets/ # Images, logos, etc.
│ │ ├── App.jsx
│ │ └── main.jsx
│ └── vite.config.js
│
├── server/ # Backend (Node.js + Express)
│ ├── configs/ # Firebase setup, environment config
│ ├── controllers/ # Queue, Ticket, User controllers
│ ├── middlewares/ # Auth checks, error handling
│ ├── models/ # Data models (if using Firestore helpers)
│ ├── routes/ # Express route definitions
│ └── index.js # Server entry point
│
└── .env # Environment variables

yaml
Copy code

---

## ⚙️ Installation

Clone the repository:
```bash
git clone https://github.com/yourusername/QMeNow.git
cd QMeNow
Install dependencies for both client and server:

bash
Copy code
cd client
npm install
cd ../server
npm install
🔐 Environment Variables
Create a .env file inside server/ and client/ with the following keys:

Client (.env)
ini
Copy code
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
Server (.env)
ini
Copy code
PORT=5000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=yourpassword
🏃‍♀️ Running the Project
Run Client
bash
Copy code
cd client
npm run dev
Then visit:
👉 http://localhost:5173/

Run Server
bash
Copy code
cd server
npm start
Then API runs at:
👉 http://localhost:5000/

🚀 Deployment (Vercel)
Build frontend

bash
Copy code
cd client
npm run build
Push to GitHub.

Connect your repo to Vercel.

Set all environment variables in Vercel’s Dashboard.

Deploy 🚀

If backend is separate (Node server):

Deploy via Render or Railway

Ensure CORS is configured properly to allow your frontend domain

👩🏽‍💻 Contributors & Team
Team Name: IntelliBus Innovators

Name	Role	Responsibility (ADD YALLS STUFF)
Debra-Kaye Smith - Frontend (UI/UX) Developer
Trevaughn Johnson	- Backend Developer	Express controllers, database logic
Damario Escoffrey -	UI Designer	Visual layout, Tailwind themes, accessibility
Nathan Crossdale - Project Manager	Documentation, deployment, QA testing
Javari Whilby -

(Update names/roles as needed.)
