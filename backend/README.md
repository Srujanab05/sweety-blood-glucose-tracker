# Sweety – Blood Glucose Tracker 💗

Sweety is a full-stack blood glucose tracking application that helps users record, manage, and monitor their daily glucose readings.

## Features

- User registration and login
- Secure password hashing
- JWT-based authentication
- Add, edit, view, and delete glucose readings
- Daily reading limit of four
- Duplicate time-slot prevention
- Glucose value validation (40–600 mg/dL)
- Daily and monthly reports
- Highest, lowest, and average glucose calculations
- Glucose trend chart
- User-specific reading history

## Tech Stack

**Frontend:** React.js, Vite, CSS, Axios, Recharts  
**Backend:** Node.js, Express.js  
**Database:** PostgreSQL  
**Authentication:** JWT and bcrypt

## Project Structure

```text
sweety/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd sweety
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and configure your PostgreSQL credentials and JWT secret.

### 3. Database setup

Create a PostgreSQL database named `sweety_db`.

Run the database table creation SQL scripts.

### 4. Start the backend

```bash
npm run dev
```

### 5. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL displayed by Vite.

## Validation Rules

- Glucose values must be between 40 and 600 mg/dL.
- Only one reading is allowed per time slot per day.
- Maximum four readings per day.
- Future dates are not allowed.

## Author

Srujana B  
B.E. Computer Science and Engineering  
2026 Graduate