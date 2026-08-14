require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── DB CONNECTION ─────────────────────────────────────────
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'crms_db',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

db.connect(err => {
  if (err) { console.error('❌ DB Error:', err.message); return; }
  console.log('✅ MySQL connected — crms_db');
  addLog('SYSTEM_START', 'CRMS Node.js server started');
});

// ── AUTO LOG HELPER ───────────────────────────────────────
function addLog(action, details, user = 'ADMIN') {
  db.query('INSERT INTO audit_logs (action, details, user) VALUES (?,?,?)',
    [action, details, user], () => {});
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
app.get('/api/stats', (req, res) => {
  db.query(`SELECT
    (SELECT COUNT(*) FROM crimes)                              AS total_crimes,
    (SELECT COUNT(*) FROM crimes WHERE status='OPEN')          AS open_cases,
    (SELECT COUNT(*) FROM crimes WHERE status='CLOSED')        AS closed_cases,
    (SELECT COUNT(*) FROM crimes WHERE status='CRITICAL')      AS critical_cases,
    (SELECT COUNT(*) FROM crimes WHERE status='PENDING')       AS pending_cases,
    (SELECT COUNT(*) FROM fir)                                 AS total_firs,
    (SELECT COUNT(*) FROM criminals)                           AS total_criminals,
    (SELECT COUNT(*) FROM criminals WHERE status='IN_CUSTODY') AS in_custody,
    (SELECT COUNT(*) FROM evidence)                            AS total_evidence,
    (SELECT COUNT(*) FROM warrants WHERE status='ACTIVE')      AS active_warrants
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0]);
  });
});

app.get('/api/dashboard/recent', (req, res) => {
  db.query('SELECT * FROM crimes ORDER BY date DESC LIMIT 6', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/stats/by-type', (req, res) => {
  db.query('SELECT crime_type, COUNT(*) AS count FROM crimes GROUP BY crime_type ORDER BY count DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ══════════════════════════════════════════════════════════
//  CRIMES
// ══════════════════════════════════════════════════════════
app.get('/api/crimes', (req, res) => {
  db.query('SELECT * FROM crimes ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get('/api/crimes/:id', (req, res) => {
  db.query('SELECT * FROM crimes WHERE crime_id=?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  });
});
app.post('/api/crimes', (req, res) => {
  const { crime_type, location, description, date, status, assigned_officer } = req.body;
  db.query(
    'INSERT INTO crimes (crime_type,location,description,date,status,assigned_officer) VALUES(?,?,?,?,?,?)',
    [crime_type, location, description, date, (status||'OPEN').toUpperCase(), assigned_officer],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      addLog('CRIME_ADDED', `${crime_type} at ${location} added (ID: ${result.insertId})`);
      res.json({ crime_id: result.insertId });
    }
  );
});
app.put('/api/crimes/:id', (req, res) => {
  const { crime_type, location, description, date, status, assigned_officer } = req.body;
  db.query(
    'UPDATE crimes SET crime_type=?,location=?,description=?,date=?,status=?,assigned_officer=? WHERE crime_id=?',
    [crime_type, location, description, date, status.toUpperCase(), assigned_officer, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      addLog('CRIME_UPDATED', `Crime #${req.params.id} updated — status: ${status}`);
      res.json({ message: 'Updated' });
    }
  );
});
app.delete('/api/crimes/:id', (req, res) => {
  db.query('DELETE FROM crimes WHERE crime_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    addLog('CRIME_DELETED', `Crime #${req.params.id} deleted from database`);
    res.json({ message: 'Deleted' });
  });
});

// ══════════════════════════════════════════════════════════
//  FIR
// ══════════════════════════════════════════════════════════
app.get('/api/fir', (req, res) => {
  db.query('SELECT * FROM fir ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/fir', (req, res) => {
  const { complainant_name, contact_number, complainant_address,
    crime_type, incident_location, incident_datetime,
    description, witness_name, police_station, receiving_officer } = req.body;
  db.query('SELECT COUNT(*) AS cnt FROM fir', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const firNumber = `FIR-${String(rows[0].cnt + 1).padStart(4, '0')}`;
    db.query(
      `INSERT INTO fir (fir_number,complainant_name,contact_number,complainant_address,
       crime_type,incident_location,incident_datetime,description,
       witness_name,police_station,receiving_officer,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,'OPEN')`,
      [firNumber,complainant_name,contact_number,complainant_address,
       crime_type,incident_location,incident_datetime,description,
       witness_name,police_station,receiving_officer],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        addLog('FIR_REGISTERED', `${firNumber} filed at ${police_station} by ${receiving_officer}`);
        res.json({ fir_id: result.insertId, fir_number: firNumber });
      }
    );
  });
});
app.delete('/api/fir/:id', (req, res) => {
  db.query('DELETE FROM fir WHERE fir_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    addLog('FIR_DELETED', `FIR #${req.params.id} deleted`);
    res.json({ message: 'Deleted' });
  });
});

// ══════════════════════════════════════════════════════════
//  CRIMINALS
// ══════════════════════════════════════════════════════════
app.get('/api/criminals', (req, res) => {
  db.query('SELECT * FROM criminals ORDER BY criminal_id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/criminals', (req, res) => {
  const { name, dob, gender, address, contact, description, status } = req.body;
  db.query(
    'INSERT INTO criminals (name,dob,gender,address,contact,description,status) VALUES(?,?,?,?,?,?,?)',
    [name, dob, gender, address, contact, description, status||'AT_LARGE'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      addLog('CRIMINAL_ADDED', `Criminal profile: ${name} added (status: ${status||'AT_LARGE'})`);
      res.json({ criminal_id: result.insertId });
    }
  );
});
app.delete('/api/criminals/:id', (req, res) => {
  db.query('DELETE FROM criminals WHERE criminal_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    addLog('CRIMINAL_DELETED', `Criminal #${req.params.id} removed from database`);
    res.json({ message: 'Deleted' });
  });
});

// ══════════════════════════════════════════════════════════
//  OFFICERS
// ══════════════════════════════════════════════════════════
app.get('/api/officers', (req, res) => {
  db.query(`SELECT o.*, s.station_name FROM officers o
    LEFT JOIN police_stations s ON o.station_id = s.station_id
    ORDER BY o.officer_id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ══════════════════════════════════════════════════════════
//  EVIDENCE
// ══════════════════════════════════════════════════════════
app.get('/api/evidence', (req, res) => {
  db.query(`SELECT e.*, c.crime_type, c.location AS crime_location
    FROM evidence e LEFT JOIN crimes c ON e.crime_id = c.crime_id
    ORDER BY e.collected_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/evidence', (req, res) => {
  const { crime_id, title, file_type, file_path, description, collected_by } = req.body;
  db.query(
    'INSERT INTO evidence (crime_id,title,file_type,file_path,description,collected_by) VALUES(?,?,?,?,?,?)',
    [crime_id||null, title, file_type, file_path, description, collected_by],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      addLog('EVIDENCE_ADDED', `Evidence "${title}" (${file_type}) added for Crime #${crime_id}`);
      res.json({ evidence_id: result.insertId });
    }
  );
});
app.delete('/api/evidence/:id', (req, res) => {
  db.query('DELETE FROM evidence WHERE evidence_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    addLog('EVIDENCE_DELETED', `Evidence #${req.params.id} removed`);
    res.json({ message: 'Deleted' });
  });
});

// ══════════════════════════════════════════════════════════
//  WARRANTS
// ══════════════════════════════════════════════════════════
app.get('/api/warrants', (req, res) => {
  db.query(`SELECT w.*, cr.name AS criminal_name, cr.status AS criminal_status,
    c.crime_type, c.location AS crime_location
    FROM warrants w
    LEFT JOIN criminals cr ON w.criminal_id = cr.criminal_id
    LEFT JOIN crimes c ON w.crime_id = c.crime_id
    ORDER BY w.created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/warrants', (req, res) => {
  const { criminal_id, crime_id, issued_by, valid_until, reason } = req.body;
  db.query('SELECT COUNT(*) AS cnt FROM warrants', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const wNum = `WRT-${new Date().getFullYear()}-${String(rows[0].cnt + 1).padStart(3,'0')}`;
    const today = new Date().toISOString().split('T')[0];
    db.query(
      `INSERT INTO warrants (warrant_number,criminal_id,crime_id,issued_by,issued_date,valid_until,reason,status)
       VALUES(?,?,?,?,?,?,?,'ACTIVE')`,
      [wNum, criminal_id, crime_id||null, issued_by, today, valid_until, reason],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        addLog('WARRANT_ISSUED', `Warrant ${wNum} issued by ${issued_by} for Criminal #${criminal_id}`);
        res.json({ warrant_id: result.insertId, warrant_number: wNum });
      }
    );
  });
});
app.put('/api/warrants/:id/revoke', (req, res) => {
  db.query("UPDATE warrants SET status='REVOKED' WHERE warrant_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    addLog('WARRANT_REVOKED', `Warrant #${req.params.id} revoked`);
    res.json({ message: 'Revoked' });
  });
});

// ══════════════════════════════════════════════════════════
//  PREDICTIVE ANALYSIS
// ══════════════════════════════════════════════════════════
app.get('/api/predict', (req, res) => {
  const locSql = `SELECT location,
    COUNT(*) AS total,
    SUM(status IN ('OPEN','CRITICAL')) AS active,
    SUM(status='CRITICAL') AS critical,
    GROUP_CONCAT(DISTINCT crime_type ORDER BY crime_type SEPARATOR ', ') AS crime_types
    FROM crimes GROUP BY location ORDER BY total DESC`;

  const trendSql = `SELECT crime_type, COUNT(*) AS count,
    SUM(status='OPEN') AS open, SUM(status='CRITICAL') AS critical
    FROM crimes GROUP BY crime_type ORDER BY count DESC`;

  const monthSql = `SELECT DATE_FORMAT(date,'%b %Y') AS month,
    COUNT(*) AS count FROM crimes GROUP BY month ORDER BY MIN(date) DESC LIMIT 6`;

  db.query(locSql, (err, locs) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(trendSql, (err2, trends) => {
      if (err2) return res.status(500).json({ error: err2.message });
      db.query(monthSql, (err3, months) => {
        if (err3) return res.status(500).json({ error: err3.message });
        const max = locs.length ? Math.max(...locs.map(l => l.total)) : 1;
        const withRisk = locs.map(l => ({
          ...l,
          risk_score: Math.round((l.total / max) * 100),
          risk_level: l.critical > 0 ? 'CRITICAL' : l.total >= max * 0.6 ? 'HIGH' : l.total >= max * 0.3 ? 'MEDIUM' : 'LOW'
        }));
        res.json({ locations: withRisk, trends, months });
      });
    });
  });
});

// ══════════════════════════════════════════════════════════
//  OFFICER HEATMAP
// ══════════════════════════════════════════════════════════
app.get('/api/heatmap', (req, res) => {
  db.query(`SELECT assigned_officer AS name,
    COUNT(*) AS total,
    SUM(status='CRITICAL') AS critical,
    SUM(status='OPEN')     AS open_cases,
    SUM(status='PENDING')  AS pending,
    SUM(status='CLOSED')   AS closed
    FROM crimes WHERE assigned_officer IS NOT NULL
    GROUP BY assigned_officer ORDER BY total DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ══════════════════════════════════════════════════════════
//  AUDIT LOGS
// ══════════════════════════════════════════════════════════
app.get('/api/logs', (req, res) => {
  db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/logs', (req, res) => {
  const { action, details } = req.body;
  addLog(action, details);
  res.json({ ok: true });
});

// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚔 CRMS server running on port ${PORT}`);
  console.log(`📡 API at /api\n`);
});
