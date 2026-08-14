#  Crime Record Management System (CRMS)

A full-stack **Crime Record Management System (CRMS)** built as a DBMS project, designed to help police departments digitally manage crime records, FIRs, criminal profiles, evidence, officers, and active warrants — all from a single command dashboard.

## Live Demo

🔗 View Project :- https://crimerecordmanagementsystem-dbms.onrender.com/

---

##  Overview

The **Crime Record Management System (CRMS)** provides a centralized database for storing and managing crime records. It allows authorized users to add, update, delete, and retrieve information related to crimes, criminals, police officers, complaints, and cases.

The project demonstrates the practical implementation of **DBMS concepts, SQL queries, relational databases, and CRUD operations**.

The system allows authorized users to:

* Track and manage crime records with status (Open/Closed) and assigned officers
* File and manage First Information Reports (FIRs)
* Maintain a criminal database with status tracking (At Large / In Custody)
* Log and manage evidence linked to crimes
* Manage police officers and their station assignments
* Issue and track arrest warrants
* View crime hotspots via an officer heatmap
* Get basic crime trend predictions
* Maintain a full audit log of system activity

---

##  Main Modules

### 1. Criminal Management

Stores information about criminals, including their personal details and criminal history.

### 2. Crime & Case Management

Maintains details about registered crimes, cases, crime types, dates, locations, and case status.

### 3. Complaint Management

Stores complaints filed by citizens and associates them with relevant cases.

### 4. Police Officer Management

Maintains police officer details and their involvement in investigations.

### 5. Investigation Management

Links officers, criminals, and cases to keep track of investigations.

---

##  Tech Stack Used


| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL (hosted on Aiven) / Oracle |
| Deployment | Render (Web Service) |
| Config | dotenv (environment variables) |
| Concepts | DBMS, RDBMS, CRUD Operations, Joins, Constraints, Relationships |

---

##  Database Concepts Implemented

The project demonstrates several important DBMS concepts:

* Relational Database Design
* Primary Keys
* Foreign Keys
* Unique & NOT NULL Constraints
* Entity Relationships
* Normalization
* SQL Queries
* Joins
* Aggregate Functions
* Subqueries
* Views
* Stored Procedures
* Functions
* Triggers

##  Database Structure

The system consists of multiple interconnected tables such as:

```
┌──────────────────────┐
│   police_stations    │
│──────────────────────│
│ PK station_id        │
│    station_name      │
│    location          │
│    contact           │
└──────────┬───────────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌────────────────┐  ┌───────────────────────┐
│  officers      │  │       crimes          │
│────────────────│  │───────────────────────│
│ PK officer_id  │  │     PK crime_id       │
│    name        │  │     crime_type        │
│   `rank`       │  │     location          │
│  badge_number  │  │     description       │
│ FK station_id  │  │     date              │
│    contact     │  │     status            │
│    status      │  │     assigned_officer  │
└────────────────┘  │     FK station_id     │
                    └──────────┬────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌─────────────────────┐  ┌──────────────────┐   ┌────────────────────┐
│         fir         │  │     evidence     │   │   crime_criminal   │
│─────────────────────│  │──────────────────│   │────────────────────│
│     PK fir_id       │  │  PK evidence_id  │   │ PK id              │
│     fir_number      │  │   FK crime_id    │   │ FK crime_id        │
│   complainant_name  │  │      title       │   │ FK criminal_id     │
│    contact_number   │  │    file_type     │   └─────────┬──────────┘
│    crime_type       │  │    file_path     │             │
│  incident_location  │  │   description    │             ▼
│  incident_datetime  │  │   collected_by   │     ┌──────────────────┐
│     description     │  │   collected_at   │     │    criminals     │
│       status        │  └──────────────────┘     │──────────────────│
│     FK crime_id     │                           │  PK criminal_id  │
│     created_at      │                           │    name          │
└─────────────────────┘                           │    dob           │
                                                  │    gender        │
                                                  │    address       │
                                                  │    contact       │
                                                  │    description   │
                                                  │    status        │
                                                  └─────────┬────────┘
                                                            │
                                                            ▼ 
                                                  ┌─────────────────────┐
                                                  │      warrants       │
                                                  │─────────────────────│
                                                  │ PK warrant_id       │
                                                  │ warrant_number      │
                                                  │ FK criminal_id      │
                                                  │ FK crime_id         │
                                                  │ issued_by           │
                                                  │ issued_date         │
                                                  │ valid_until         │
                                                  │ reason              │
                                                  │ status              │
                                                  │ created_at          │
                                                  └─────────────────────┘

```

The relationships between these entities help maintain consistency and enable efficient retrieval of crime-related information.


Run schema.sql against your MySQL instance to set up the full database structure.

---

##  Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- MySQL Server (local or cloud, e.g. [Aiven](https://aiven.io))

### 1. Clone the repository
```bash
git clone https://github.com/Mahek-03/CrimeRecordManagementSystem_DBMS.git
cd CrimeRecordManagementSystem_DBMS
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the project root:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crms_db
DB_SSL=false
PORT=3000
```

### 4. Import the database schema
```bash
mysql -u root -p < schema.sql
```

### 5. Start the server
```bash
npm start
```

Visit **http://localhost:3000** in your browser.

---

##  Deployment

This project is deployed on **Render** as a Node.js Web Service, connected to a **MySQL database hosted on Aiven** (since Render's free tier only offers PostgreSQL natively).

Environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`) are configured directly in the Render dashboard rather than committed to the repository.

---

##  API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/stats` | GET | Dashboard summary statistics |
| `/api/stats/by-type` | GET | Crime breakdown by type |
| `/api/dashboard/recent` | GET | Recently reported crimes |
| `/api/crimes` | GET / POST | List / add crime records |
| `/api/crimes/:id` | GET / PUT / DELETE | View / update / delete a crime |
| `/api/fir` | GET / POST | List / file FIRs |
| `/api/fir/:id` | DELETE | Delete an FIR |
| `/api/criminals` | GET / POST | List / add criminal profiles |
| `/api/criminals/:id` | DELETE | Remove a criminal record |
| `/api/officers` | GET | List officers |
| `/api/evidence` | GET / POST | List / log evidence |
| `/api/evidence/:id` | DELETE | Remove evidence |
| `/api/warrants` | GET / POST | List / issue warrants |
| `/api/warrants/:id/revoke` | PUT | Revoke a warrant |
| `/api/predict` | GET | Basic crime trend prediction |
| `/api/heatmap` | GET | Officer/crime heatmap data |
| `/api/logs` | GET / POST | View / add audit logs |

---

## 📁 Project Structure

```text
Crime-Record-Management-System/
│
├── README.md
│
├── database/
│   ├── schema.sqll           # MySQL database schema
│
├── frontend/
│   ├── style.css
│   ├── index.html
│   ├── crimes.html
│   ├── crimes.html
│   ├── evidence.html
│   ├── firs.html
│   ├── officers.html
│   └── predicts.html
│
├── backend/
│   ├── server.js           # Express server — all backend API routes & DB connection
│   ├── shared.js
│   ├── package.json          # Node dependencies & start script
│   ├── package-lock.json
│   ├── .gitginore
│   ├── settings.json
│   └── .env                 # Local environment variables
│ 
└── node_modules/

```


##  Objectives

* To design a structured relational database for crime records.
* To reduce manual management of crime-related information.
* To provide efficient storage and retrieval of records.
* To demonstrate relationships between different entities.
* To implement DBMS concepts through a real-world application.
* To improve data consistency and accessibility.

##  Future Enhancements

* Add a web-based user interface.
* Implement user authentication and role-based access.
* Add advanced crime analytics and dashboards.
* Implement automated report generation.
* Add crime-location mapping using GIS.
* Introduce advanced search and filtering.
* Deploy the system as a cloud-based application.

---

##  Author

**Mahek Chaurasia** — DBMS Project, Crime Record Management System

---

## 📄 License

This project is for academic purposes as part of a DBMS coursework submission.

---


