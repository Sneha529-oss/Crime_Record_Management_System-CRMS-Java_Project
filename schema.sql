-- ============================================================
--  CRMS — Crime Record Management System
--  COMPLETE SCHEMA v2 — Run fully in MySQL Workbench
-- ============================================================

DROP DATABASE IF EXISTS crms_db;
CREATE DATABASE crms_db;
USE crms_db;

-- ── 1. POLICE STATIONS ───────────────────────────────────
CREATE TABLE police_stations (
  station_id    INT AUTO_INCREMENT PRIMARY KEY,
  station_name  VARCHAR(100) NOT NULL,
  location      VARCHAR(200),
  contact       VARCHAR(15)
);

-- ── 2. OFFICERS ──────────────────────────────────────────
CREATE TABLE officers (
  officer_id    INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  `rank`        VARCHAR(50),
  badge_number  VARCHAR(20) UNIQUE,
  station_id    INT,
  contact       VARCHAR(15),
  status        VARCHAR(20) DEFAULT 'ON_DUTY',
  FOREIGN KEY (station_id) REFERENCES police_stations(station_id)
);

-- ── 3. CRIMINALS ─────────────────────────────────────────
CREATE TABLE criminals (
  criminal_id   INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  dob           DATE,
  gender        VARCHAR(10),
  address       TEXT,
  contact       VARCHAR(15),
  description   TEXT,
  status        VARCHAR(20) DEFAULT 'AT_LARGE'
);

-- ── 4. CRIMES ────────────────────────────────────────────
CREATE TABLE crimes (
  crime_id         INT AUTO_INCREMENT PRIMARY KEY,
  crime_type       VARCHAR(100) NOT NULL,
  location         VARCHAR(200) NOT NULL,
  description      TEXT,
  date             DATE NOT NULL,
  status           VARCHAR(20) DEFAULT 'OPEN',
  assigned_officer VARCHAR(100),
  station_id       INT,
  FOREIGN KEY (station_id) REFERENCES police_stations(station_id)
);

-- ── 5. FIR ───────────────────────────────────────────────
CREATE TABLE fir (
  fir_id               INT AUTO_INCREMENT PRIMARY KEY,
  fir_number           VARCHAR(20) UNIQUE,
  complainant_name     VARCHAR(100) NOT NULL,
  contact_number       VARCHAR(15),
  complainant_address  TEXT,
  crime_type           VARCHAR(100),
  incident_location    VARCHAR(200),
  incident_datetime    DATETIME,
  description          TEXT,
  witness_name         VARCHAR(100),
  police_station       VARCHAR(100),
  receiving_officer    VARCHAR(100),
  status               VARCHAR(20) DEFAULT 'OPEN',
  crime_id             INT,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crime_id) REFERENCES crimes(crime_id) ON DELETE SET NULL
);

-- ── 6. CRIME_CRIMINAL (linking table) ────────────────────
CREATE TABLE crime_criminal (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  crime_id    INT,
  criminal_id INT,
  FOREIGN KEY (crime_id)    REFERENCES crimes(crime_id)    ON DELETE CASCADE,
  FOREIGN KEY (criminal_id) REFERENCES criminals(criminal_id) ON DELETE CASCADE
);

-- ── 7. EVIDENCE ──────────────────────────────────────────
CREATE TABLE evidence (
  evidence_id    INT AUTO_INCREMENT PRIMARY KEY,
  crime_id       INT,
  title          VARCHAR(200) NOT NULL,
  file_type      VARCHAR(50),
  file_path      VARCHAR(500),
  description    TEXT,
  collected_by   VARCHAR(100),
  collected_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crime_id) REFERENCES crimes(crime_id) ON DELETE SET NULL
);

-- ── 8. WARRANTS ──────────────────────────────────────────
CREATE TABLE warrants (
  warrant_id     INT AUTO_INCREMENT PRIMARY KEY,
  warrant_number VARCHAR(30) UNIQUE,
  criminal_id    INT,
  crime_id       INT,
  issued_by      VARCHAR(100),
  issued_date    DATE DEFAULT (CURRENT_DATE),
  valid_until    DATE,
  reason         TEXT,
  status         VARCHAR(20) DEFAULT 'ACTIVE',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (criminal_id) REFERENCES criminals(criminal_id) ON DELETE CASCADE,
  FOREIGN KEY (crime_id) REFERENCES crimes(crime_id) ON DELETE SET NULL
);

-- ── 9. AUDIT LOGS ─────────────────────────────────────────
CREATE TABLE audit_logs (
  log_id      INT AUTO_INCREMENT PRIMARY KEY,
  action      VARCHAR(100),
  details     TEXT,
  user        VARCHAR(50) DEFAULT 'ADMIN',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
--  SAMPLE DATA
-- ============================================================

INSERT INTO police_stations (station_name, location, contact) VALUES
('Shivajinagar PS', 'Shivajinagar, Pune', '020-25536000'),
('Kothrud PS',      'Kothrud, Pune',      '020-25386100'),
('Hadapsar PS',     'Hadapsar, Pune',     '020-26870100'),
('Baner PS',        'Baner, Pune',        '020-27290100'),
('Viman Nagar PS',  'Viman Nagar, Pune',  '020-26630100');

INSERT INTO officers (name, `rank`, badge_number, station_id, contact, status) VALUES
('R. Desai',    'Superintendent of Police', 'SP-001', 1, '9876500001', 'ON_DUTY'),
('A. Patil',    'Sub-Inspector',            'SI-002', 2, '9876500002', 'ON_DUTY'),
('M. Kulkarni', 'Sub-Inspector',            'SI-003', 3, '9876500003', 'ON_DUTY'),
('S. Jadhav',   'Sub-Inspector',            'SI-004', 5, '9876500004', 'ON_DUTY'),
('P. More',     'Constable',                'PC-005', 4, '9876500005', 'OFF_DUTY');

INSERT INTO criminals (name, dob, gender, address, contact, description, status) VALUES
('Raju Sharma',    '1990-05-15', 'Male',   'Hadapsar, Pune',     '9876501001', 'Scar on left cheek, 5ft 9in',  'IN_CUSTODY'),
('Sanjay Nikam',   '1985-11-20', 'Male',   'Kothrud, Pune',      '9876501002', 'Tattoo on right arm, stocky',  'AT_LARGE'),
('Meena Desai',    '1995-03-08', 'Female', 'Baner, Pune',        '9876501003', 'Short hair, 5ft 4in',          'RELEASED'),
('Vikram Jadhav',  '1988-07-22', 'Male',   'Shivajinagar, Pune', '9876501004', 'Beard, tall, 6ft 1in',         'AT_LARGE');

INSERT INTO crimes (crime_type, location, description, date, status, assigned_officer, station_id) VALUES
('Robbery',    'Kothrud, Pune',      'Armed robbery at jewelry store on MG Road',    '2024-04-08', 'OPEN',     'R. Desai',    2),
('Assault',    'Hadapsar, Pune',     'Physical assault at Saturday Market',          '2024-04-07', 'PENDING',  'A. Patil',    3),
('Theft',      'Baner, Pune',        'Mobile phone snatching near Balewadi',         '2024-04-07', 'OPEN',     'M. Kulkarni', 4),
('Cybercrime', 'Viman Nagar, Pune',  'Online banking fraud — Rs 2.4 lakh stolen',    '2024-04-06', 'CLOSED',   'S. Jadhav',   5),
('Murder',     'Shivajinagar, Pune', 'Homicide near railway station',                '2024-04-05', 'CRITICAL', 'R. Desai',    1),
('Fraud',      'Aundh, Pune',        'Property document forgery case',               '2024-04-04', 'CLOSED',   'P. More',     1),
('Robbery',    'Hadapsar, Pune',     'Chain snatching from elderly woman',           '2024-04-03', 'OPEN',     'A. Patil',    3),
('Cybercrime', 'Kothrud, Pune',      'UPI fraud — Rs 50,000 stolen',                 '2024-04-02', 'PENDING',  'S. Jadhav',   2),
('Assault',    'Kothrud, Pune',      'Brawl outside restaurant, 2 injured',          '2024-03-30', 'OPEN',     'A. Patil',    2),
('Theft',      'Hadapsar, Pune',     'Warehouse burglary, goods worth Rs 1.2L',      '2024-03-28', 'CRITICAL', 'R. Desai',    3);

INSERT INTO fir (fir_number, complainant_name, contact_number, complainant_address, crime_type, incident_location, incident_datetime, description, police_station, receiving_officer, status, crime_id) VALUES
('FIR-0001', 'Ramesh Kulkarni', '9876543210', 'FC Road, Pune',      'Robbery',    'Kothrud',     '2024-04-08 10:30:00', 'Robbery at jewelry shop',     'Kothrud PS',     'A. Patil',    'OPEN',    1),
('FIR-0002', 'Priya Sharma',    '9876543211', 'Baner Road, Pune',   'Theft',      'Baner',       '2024-04-07 14:00:00', 'Mobile snatching incident',   'Baner PS',       'M. Kulkarni', 'PENDING', 3),
('FIR-0003', 'Sunil Jadhav',    '9876543212', 'Hadapsar, Pune',     'Assault',    'Hadapsar',    '2024-04-07 18:00:00', 'Assault at market',           'Hadapsar PS',    'A. Patil',    'OPEN',    2),
('FIR-0004', 'Anjali Mehta',    '9876543213', 'Viman Nagar, Pune',  'Cybercrime', 'Viman Nagar', '2024-04-06 09:00:00', 'Online banking fraud',        'Viman Nagar PS', 'S. Jadhav',   'CLOSED',  4);

INSERT INTO crime_criminal (crime_id, criminal_id) VALUES (1,2),(2,1),(5,4),(7,2),(10,1);

INSERT INTO evidence (crime_id, title, file_type, file_path, description, collected_by) VALUES
(1, 'CCTV Footage - MG Road',       'VIDEO',    '/evidence/crime1/cctv_mgroad.mp4',     'CCTV recording from 10:15-10:45 AM showing suspect',    'SI A. Patil'),
(1, 'Witness Statement - Ravi More','DOCUMENT',  '/evidence/crime1/witness_ravi.pdf',    'Written statement by eyewitness',                       'SI A. Patil'),
(3, 'Medical Report - Victim',      'DOCUMENT',  '/evidence/crime2/medical_report.pdf',  'Hospital report of injuries sustained',                 'M. Kulkarni'),
(5, 'Forensic Report',              'DOCUMENT',  '/evidence/crime5/forensic.pdf',        'Forensic analysis of crime scene',                      'R. Desai'),
(5, 'Crime Scene Photos',           'IMAGE',     '/evidence/crime5/scene_photos.zip',    '14 photographs from crime scene',                       'R. Desai'),
(4, 'Bank Transaction Logs',        'DOCUMENT',  '/evidence/crime4/bank_logs.pdf',       'Digital records of fraudulent transactions',            'S. Jadhav');

INSERT INTO warrants (warrant_number, criminal_id, crime_id, issued_by, issued_date, valid_until, reason, status) VALUES
('WRT-2024-001', 2, 1, 'SP R. Desai', '2024-04-09', '2024-07-09', 'Suspect identified in CCTV footage from MG Road robbery. Multiple eyewitnesses confirmed identity.', 'ACTIVE'),
('WRT-2024-002', 4, 5, 'SP R. Desai', '2024-04-06', '2024-07-06', 'Primary suspect in Shivajinagar homicide case. DNA evidence confirms presence at scene.', 'ACTIVE');

INSERT INTO audit_logs (action, details, user) VALUES
('SYSTEM_START',      'CRMS System initialized successfully',                'SYSTEM'),
('FIR_REGISTERED',    'FIR-0001 registered at Kothrud PS by A. Patil',      'ADMIN'),
('CRIME_ADDED',       'Robbery at Kothrud, Pune added to database',         'ADMIN'),
('FIR_REGISTERED',    'FIR-0002 registered at Baner PS by M. Kulkarni',     'ADMIN'),
('EVIDENCE_ADDED',    'CCTV Footage added for Crime #1',                    'ADMIN'),
('WARRANT_ISSUED',    'Warrant WRT-2024-001 issued for Sanjay Nikam',       'ADMIN'),
('CRIMINAL_ADDED',    'Criminal profile: Vikram Jadhav added',              'ADMIN'),
('WARRANT_ISSUED',    'Warrant WRT-2024-002 issued for Vikram Jadhav',      'ADMIN'),
('CRIME_UPDATED',     'Crime #5 status updated to CRITICAL',                'ADMIN'),
('FIR_REGISTERED',    'FIR-0004 registered at Viman Nagar PS',              'ADMIN');