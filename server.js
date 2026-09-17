const express = require("express");
const session = require("express-session");
const pg = require("pg");
const pgSession = require("connect-pg-simple")(session);
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Upload folder
const uploadDir = path.join(ROOT, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =========================
// Helpers
// =========================

const hash = s =>
  crypto.createHash("sha256").update(s).digest("hex");

async function query(text, params = []) {
  return pool.query(text, params);
}

// =========================
// Database initialization
// =========================

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      report_date TEXT NOT NULL,
      client TEXT,
      project TEXT,
      visit_type TEXT,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attachment TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      assigned_to INTEGER NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminResult = await query(
    "SELECT id FROM users WHERE username=$1",
    ["admin"]
  );

  if (adminResult.rows.length === 0) {
    await query(
      `INSERT INTO users
       (name,username,password,role)
       VALUES ($1,$2,$3,$4)`,
      [
        "System Admin",
        "admin",
        hash("admin123"),
        "admin"
      ]
    );

    console.log("✅ Default admin created");
  }

  console.log("✅ PostgreSQL database ready");
}

// =========================
// Middleware
// =========================

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true
    }),

    secret:
      process.env.SESSION_SECRET ||
      "change-this-secret-in-production",

    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 12
    }
  })
);

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// =========================
// Auth middleware
// =========================

function auth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  next();
}

function admin(req, res, next) {
  if (
    req.session.user?.role !== "admin" &&
    req.session.user?.role !== "manager"
  ) {
    return res.status(403).json({
      error: "Forbidden"
    });
  }

  next();
}

// =========================
// Login
// =========================

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await query(
      `SELECT *
       FROM users
       WHERE username=$1
       AND active=1`,
      [username]
    );

    const u = result.rows[0];

    if (!u || u.password !== hash(password || "")) {
      return res.status(401).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      });
    }

    req.session.user = {
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role
    };

    res.json(req.session.user);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "حدث خطأ في تسجيل الدخول"
    });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Current user
app.get("/api/me", (req, res) => {
  res.json(req.session.user || null);
});

// =========================
// Dashboard
// =========================

app.get("/api/dashboard", auth, async (req, res) => {
  try {
    const isManager = ["admin", "manager"].includes(
      req.session.user.role
    );

    const uid = req.session.user.id;

    let reports;
    let pending;
    let tasks;

    if (isManager) {
      const r = await query(
        "SELECT COUNT(*)::int AS c FROM reports"
      );

      const p = await query(
        "SELECT COUNT(*)::int AS c FROM reports WHERE status='pending'"
      );

      const t = await query(
        "SELECT COUNT(*)::int AS c FROM tasks WHERE status!='done'"
      );

      reports = r.rows[0].c;
      pending = p.rows[0].c;
      tasks = t.rows[0].c;

    } else {
      const r = await query(
        "SELECT COUNT(*)::int AS c FROM reports WHERE user_id=$1",
        [uid]
      );

      const p = await query(
        `SELECT COUNT(*)::int AS c
         FROM reports
         WHERE user_id=$1
         AND status='pending'`,
        [uid]
      );

      const t = await query(
        `SELECT COUNT(*)::int AS c
         FROM tasks
         WHERE assigned_to=$1
         AND status!='done'`,
        [uid]
      );

      reports = r.rows[0].c;
      pending = p.rows[0].c;
      tasks = t.rows[0].c;
    }

    const employeesResult = await query(
      "SELECT COUNT(*)::int AS c FROM users WHERE active=1"
    );

    const employees = employeesResult.rows[0].c;

    res.json({
      reports,
      pending,
      tasks,
      employees
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Dashboard error"
    });
  }
});

// =========================
// Reports
// =========================

app.get("/api/reports", auth, async (req, res) => {
  try {
    const isManager = ["admin", "manager"].includes(
      req.session.user.role
    );

    let result;

    if (isManager) {
      result = await query(`
        SELECT
          r.*,
          u.name AS user_name
        FROM reports r
        JOIN users u ON u.id=r.user_id
        ORDER BY r.id DESC
      `);
    } else {
      result = await query(`
        SELECT
          r.*,
          u.name AS user_name
        FROM reports r
        JOIN users u ON u.id=r.user_id
        WHERE r.user_id=$1
        ORDER BY r.id DESC
      `, [req.session.user.id]);
    }

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Reports error"
    });
  }
});

// Add report
app.post(
  "/api/reports",
  auth,
  upload.single("attachment"),
  async (req, res) => {
    try {
      const {
        title,
        report_date,
        client,
        project,
        visit_type,
        description
      } = req.body;

      if (!title || !report_date || !description) {
        return res.status(400).json({
          error: "العنوان والتاريخ والوصف مطلوبون"
        });
      }

      await query(
        `INSERT INTO reports
        (
          user_id,
          title,
          report_date,
          client,
          project,
          visit_type,
          description,
          attachment
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          req.session.user.id,
          title,
          report_date,
          client || "",
          project || "",
          visit_type || "",
          description,
          req.file?.filename || null
        ]
      );

      res.json({ ok: true });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "حدث خطأ أثناء حفظ التقرير"
      });
    }
  }
);

// Report status
app.post(
  "/api/reports/:id/status",
  auth,
  admin,
  async (req, res) => {
    try {
      const status = [
        "approved",
        "rejected",
        "pending"
      ].includes(req.body.status)
        ? req.body.status
        : "pending";

      await query(
        "UPDATE reports SET status=$1 WHERE id=$2",
        [status, req.params.id]
      );

      res.json({ ok: true });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "حدث خطأ"
      });
    }
  }
);

// Export reports
app.get("/api/reports/export", auth, async (req, res) => {
  try {
    const isManager = ["admin", "manager"].includes(
      req.session.user.role
    );

    let result;

    if (isManager) {
      result = await query(`
        SELECT
          r.id,
          u.name AS employee,
          r.title,
          r.report_date,
          r.client,
          r.project,
          r.visit_type,
          r.description,
          r.status
        FROM reports r
        JOIN users u ON u.id=r.user_id
        ORDER BY r.id DESC
      `);
    } else {
      result = await query(`
        SELECT
          r.id,
          u.name AS employee,
          r.title,
          r.report_date,
          r.client,
          r.project,
          r.visit_type,
          r.description,
          r.status
        FROM reports r
        JOIN users u ON u.id=r.user_id
        WHERE r.user_id=$1
        ORDER BY r.id DESC
      `, [req.session.user.id]);
    }

    const rows = result.rows;

    const esc = v =>
      `"${String(v ?? "").replaceAll('"', '""')}"`;

    const csv =
      "\ufeff" +
      [
        "ID,Employee,Title,Date,Client,Project,Visit Type,Description,Status",
        ...rows.map(r =>
          [
            r.id,
            r.employee,
            r.title,
            r.report_date,
            r.client,
            r.project,
            r.visit_type,
            r.description,
            r.status
          ]
            .map(esc)
            .join(",")
        )
      ].join("\n");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="collaboration-zone-reports.csv"'
    );

    res.send(csv);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Export error"
    });
  }
});

// =========================
// Users
// =========================

app.get("/api/users", auth, admin, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        username,
        role,
        active,
        created_at
      FROM users
      ORDER BY id DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Users error"
    });
  }
});

// Add user
app.post("/api/users", auth, admin, async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      role
    } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        error: "كل الحقول الأساسية مطلوبة"
      });
    }

    const userRole = [
      "employee",
      "manager",
      "admin"
    ].includes(role)
      ? role
      : "employee";

    await query(
      `INSERT INTO users
      (name,username,password,role)
      VALUES ($1,$2,$3,$4)`,
      [
        name,
        username,
        hash(password),
        userRole
      ]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({
        error: "اسم المستخدم موجود بالفعل"
      });
    }

    res.status(500).json({
      error: "حدث خطأ أثناء إضافة المستخدم"
    });
  }
});

// Toggle user
app.post(
  "/api/users/:id/toggle",
  auth,
  admin,
  async (req, res) => {
    try {
      await query(
        `UPDATE users
         SET active =
           CASE
             WHEN active=1 THEN 0
             ELSE 1
           END
         WHERE id=$1`,
        [req.params.id]
      );

      res.json({ ok: true });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "حدث خطأ"
      });
    }
  }
);

// =========================
// Tasks
// =========================

app.get("/api/tasks", auth, async (req, res) => {
  try {
    const isManager = ["admin", "manager"].includes(
      req.session.user.role
    );

    let result;

    if (isManager) {
      result = await query(`
        SELECT
          t.*,
          u.name AS employee
        FROM tasks t
        JOIN users u ON u.id=t.assigned_to
        ORDER BY t.id DESC
      `);
    } else {
      result = await query(`
        SELECT
          t.*,
          u.name AS employee
        FROM tasks t
        JOIN users u ON u.id=t.assigned_to
        WHERE t.assigned_to=$1
        ORDER BY t.id DESC
      `, [req.session.user.id]);
    }

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Tasks error"
    });
  }
});

// Add task
app.post("/api/tasks", auth, admin, async (req, res) => {
  try {
    const {
      assigned_to,
      title,
      due_date,
      priority
    } = req.body;

    if (!assigned_to || !title) {
      return res.status(400).json({
        error: "الموظف والعنوان مطلوبان"
      });
    }

    await query(
      `INSERT INTO tasks
      (assigned_to,title,due_date,priority)
      VALUES ($1,$2,$3,$4)`,
      [
        assigned_to,
        title,
        due_date || null,
        priority || "medium"
      ]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "حدث خطأ أثناء إضافة المهمة"
    });
  }
});

// Mark task done
app.post(
  "/api/tasks/:id/done",
  auth,
  async (req, res) => {
    try {
      const result = await query(
        "SELECT * FROM tasks WHERE id=$1",
        [req.params.id]
      );

      const t = result.rows[0];

      if (
        !t ||
        (
          Number(t.assigned_to) !==
            Number(req.session.user.id) &&
          !["admin", "manager"].includes(
            req.session.user.role
          )
        )
      ) {
        return res.status(403).json({
          error: "Forbidden"
        });
      }

      await query(
        "UPDATE tasks SET status='done' WHERE id=$1",
        [req.params.id]
      );

      res.json({ ok: true });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "حدث خطأ"
      });
    }
  }
);

// =========================
// Clients
// =========================

app.get("/api/clients", auth, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM clients ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Clients error"
    });
  }
});

// Add client
app.post("/api/clients", auth, admin, async (req, res) => {
  try {
    const {
      name,
      contact,
      phone,
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "اسم العميل مطلوب"
      });
    }

    await query(
      `INSERT INTO clients
      (name,contact,phone,notes)
      VALUES ($1,$2,$3,$4)`,
      [
        name,
        contact || "",
        phone || "",
        notes || ""
      ]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "حدث خطأ أثناء إضافة العميل"
    });
  }
});

// =========================
// Static files
// =========================

app.use(
  "/uploads",
  auth,
  express.static(uploadDir)
);

app.use(
  express.static(
    path.join(ROOT, "public")
  )
);

app.get("*", (req, res) => {
  res.sendFile(
    path.join(ROOT, "public", "index.html")
  );
});

// =========================
// Start server
// =========================

async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(
        `🚀 Collaboration Zone CRM running on port ${PORT}`
      );
    });

  } catch (error) {
    console.error("❌ Failed to start server:");
    console.error(error);
    process.exit(1);
  }
}

startServer();