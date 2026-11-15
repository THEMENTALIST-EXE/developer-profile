# J Nishanth Bhat | Developer Portfolio & HackerEarth Week 07 Student Management REST API

> **Author:** J Nishanth Bhat  
> **Institution:** NMAM Institute of Technology, Nitte  
> **Portfolio Repository:** [https://github.com/THEMENTALIST-EXE/developer-profile](https://github.com/THEMENTALIST-EXE/developer-profile)  
> **Standalone API Repository:** [https://github.com/THEMENTALIST-EXE/student-management-rest-api](https://github.com/THEMENTALIST-EXE/student-management-rest-api)

---

## 📌 Project Introduction & Week 07 Assignment Objective

This repository contains the full-stack developer portfolio of **J Nishanth Bhat**, upgraded to integrate the complete **HackerEarth Web Development Week 07 Assignment: Student Management REST API** (30 Leaderboard Points).

### Week 07 Core Objectives:
1. **Node.js & Express.js REST API:** Built a full-featured, modular RESTful API located in `week07-student-management-api/` (and standalone in `student-management-rest-api/`).
2. **5 Mandatory CRUD Endpoints:** Complete implementations of `GET /students`, `GET /students/:id`, `POST /students`, `PUT /students/:id`, and `DELETE /students/:id`.
3. **Bonus Requirement:** Implemented backend case-insensitive department filtering via query parameter: `GET /students?department=AIML`.
4. **Interactive React Dashboard:** Built `StudentManagement.jsx` connected to the real Express backend with live CRUD capabilities, real-time statistics, search filters, modal dialogues, validation error reporting, and graceful offline detection.
5. **Testing & Tooling:** Automated test suite (27 passing tests with Node native test runner and Supertest) and an importable Postman collection.
6. **Preserved Existing Portfolio:** Maintained the dark navy-blue and cyan visual identity, light mode support, About, Skills, Projects, Guessing Game, Task Manager, GitHub Profile Finder, and GitHub Pages deployment workflow.

---

## 🛠 Technologies Used

### Backend:
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.21.2)
- **Middleware:** `cors`, `express.json()`, custom validation & error handling middleware
- **Automated Testing:** Node.js native test runner (`node:test`, `node:assert/strict`) & Supertest
- **API Tooling:** Postman Collection v2.1

### Frontend:
- **Framework:** React 19 & Vite 8
- **Language:** Modern JavaScript (ES Modules)
- **Styling:** Semantic CSS with CSS Custom Properties, smooth scrolling, and dark/light mode toggle
- **Deployment:** GitHub Pages (Automated via GitHub Actions)

---

## 📊 Student Data Model

In accordance with the assignment requirements, student records are stored in an in-memory JavaScript array:

| Field | Type | Description & Validation Rules |
| :--- | :--- | :--- |
| `id` | Integer | Unique positive integer (`> 0`). Enforced on `POST`; immutable on `PUT`. |
| `name` | String | Non-empty string (trimmed). |
| `department` | String | Non-empty string (e.g. `AIML`, `CSE`, `ECE`, `ISE`). |
| `semester` | Integer | Integer between `1` and `8` inclusive. |

> ⚠️ **In-Memory Storage Notice:**  
> Student data is stored in memory. Any added, updated, or deleted records will reset to the initial seed dataset when the Express server process is restarted.

---

## 📁 Repository Structure

```text
developer-profile/
├── src/
│   ├── components/
│   │   ├── About.jsx                     # About me section
│   │   ├── Contact.jsx                   # Contact section & social links
│   │   ├── GitHubFinder.jsx              # GitHub developer profile finder
│   │   ├── Projects.jsx                  # Featured projects
│   │   ├── Skills.jsx                    # Technical skills showcase
│   │   └── StudentManagement.jsx         # Week 07 interactive REST API dashboard & docs
│   ├── App.jsx                           # Application shell & interactive games
│   ├── data.js                           # Portfolio metadata and projects
│   └── main.jsx                          # React application entry point
├── week07-student-management-api/        # Dedicated Week 07 Express Backend
│   ├── data/
│   │   └── studentsData.js               # In-memory array & reset helper
│   ├── middleware/
│   │   ├── errorHandler.js               # Centralized 404 & 500 error handlers
│   │   └── validateStudent.js            # Validation middleware for student fields & IDs
│   ├── routes/
│   │   └── students.js                   # Express router for /students endpoints
│   ├── tests/
│   │   └── students.test.js              # 27 automated tests (Supertest + node:test)
│   ├── .env.example                      # Environment variables template
│   ├── package.json                      # Backend dependencies & test scripts
│   ├── postman_collection.json           # Postman Collection v2.1
│   ├── README.md                         # Dedicated API documentation
│   └── server.js                         # Server listener entry point
├── student-management-rest-api/          # Standalone repository copy ready for GitHub submission
├── index.html                            # HTML entry point
├── style.css                             # Complete responsive stylesheet (dark & light themes)
├── vite.config.js                        # Vite config with base path & dev proxy
├── package.json                          # Portfolio frontend dependencies
└── README.md                             # Project overview and instructions
```

---

## 🚀 Running the Full-Stack Project Locally

### 1. Start the Express Backend Server
Open a terminal:
```bash
cd week07-student-management-api
npm install
npm start
```
The REST API server will start on `http://localhost:5000`.

### 2. Start the React Portfolio Frontend
Open a second terminal at the project root:
```bash
npm install
npm run dev
```
Open `http://localhost:5173/developer-profile/` in your browser and click **Student API** in the navigation bar to interact with the live dashboard!

---

## 📡 API Endpoints & Request / Response Examples

All responses conform to a consistent JSON format:

### 1. `GET /students` — Retrieve All Students
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "success": true,
    "count": 6,
    "data": [
      { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 6 },
      { "id": 102, "name": "Ananya Rao", "department": "CSE", "semester": 6 }
    ]
  }
  ```

### 2. `GET /students/:id` — Retrieve Single Student
- **Status:** `200 OK` (when found), `400 Bad Request` (malformed ID), `404 Not Found` (nonexistent ID)
- **Response (200):**
  ```json
  {
    "success": true,
    "data": { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 6 }
  }
  ```

### 3. `POST /students` — Add New Student
- **Status:** `201 Created`
- **Request Body:**
  ```json
  {
    "id": 107,
    "name": "Aditi Rao",
    "department": "ISE",
    "semester": 3
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "message": "Student created successfully.",
    "data": { "id": 107, "name": "Aditi Rao", "department": "ISE", "semester": 3 }
  }
  ```

### 4. `PUT /students/:id` — Update Existing Student
- **Status:** `200 OK`
- **Request Body:**
  ```json
  {
    "name": "J Nishanth Bhat",
    "department": "AIML",
    "semester": 7
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Student updated successfully.",
    "data": { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 7 }
  }
  ```

### 5. `DELETE /students/:id` — Delete Student
- **Status:** `200 OK`
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Student with ID 102 deleted successfully.",
    "data": { "id": 102, "name": "Ananya Rao", "department": "CSE", "semester": 6 },
    "student": { "id": 102, "name": "Ananya Rao", "department": "CSE", "semester": 6 }
  }
  ```

### 6. `GET /students?department=AIML` — Filter by Department (Bonus)
- **Status:** `200 OK`
- **Response (200):**
  ```json
  {
    "success": true,
    "filter": { "department": "AIML" },
    "count": 2,
    "data": [
      { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 6 },
      { "id": 103, "name": "Karthik Shenoy", "department": "AIML", "semester": 4 }
    ]
  }
  ```

---

## 🚦 HTTP Status Codes

| Code | Meaning | When Returned |
| :---: | :--- | :--- |
| `200` | OK | Successful GET, PUT, or DELETE request |
| `201` | Created | Successfully added new student record |
| `400` | Bad Request | Missing/invalid fields, non-integer ID, malformed JSON |
| `404` | Not Found | Student ID does not exist, or unhandled endpoint |
| `409` | Conflict | Duplicate student ID on POST |
| `500` | Internal Server Error | Unhandled server exception (stack trace hidden in production) |

---

## 🧪 Running Automated Tests

Run the complete backend automated test suite:
```bash
cd week07-student-management-api
npm test
```
**Results:** 27 of 27 test cases pass, covering all CRUD endpoints, department filtering, validation errors, duplicate IDs, malformed JSON, and unknown routes.

---

## 📬 Postman Collection

Import `week07-student-management-api/postman_collection.json` into Postman or Thunder Client to explore all pre-configured endpoints and test cases.

---

## 🌐 Deployment Notes

- **Frontend:** Automatically deployed to GitHub Pages at `/developer-profile/`.
- **Backend:** Configured for deployment to Node.js hosts (e.g. Render, Railway, Fly.io). Point `VITE_API_BASE_URL` to your production API URL before building.
- **Offline State:** When no backend is running or reachable, the dashboard displays a clear **API Offline** banner with connection guidance instead of failing silently.

---

## 👤 Author

**J Nishanth Bhat**  
NMAM Institute of Technology, Nitte  
- GitHub: [@THEMENTALIST-EXE](https://github.com/THEMENTALIST-EXE)  
- Portfolio: [https://github.com/THEMENTALIST-EXE/developer-profile](https://github.com/THEMENTALIST-EXE/developer-profile)
