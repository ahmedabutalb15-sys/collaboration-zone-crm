const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB = new Database(path.join(ROOT, "crm.sqlite"));
const uploadDir = path.join(ROOT, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

DB.pragma("journal_mode = WAL");
DB.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 username TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'employee',
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reports (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 title TEXT NOT NULL,
 report_date TEXT NOT NULL,
 client TEXT,
 project TEXT,
 visit_type TEXT,
 description TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 attachment TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS tasks (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 assigned_to INTEGER NOT NULL,
 title TEXT NOT NULL,
 due_date TEXT,
 priority TEXT NOT NULL DEFAULT 'medium',
 status TEXT NOT NULL DEFAULT 'open',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(assigned_to) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS clients (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 contact TEXT,
 phone TEXT,
 notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
const hash = s => require("crypto").createHash("sha256").update(s).digest("hex");
const existing = DB.prepare("SELECT id FROM users WHERE username=?").get("admin");
if (!existing) DB.prepare("INSERT INTO users(name,username,password,role) VALUES(?,?,?,?)")
  .run("System Admin","admin",hash("admin123"),"admin");

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
app.use(session({
 secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
 resave:false, saveUninitialized:false,
 cookie:{httpOnly:true, sameSite:"lax", maxAge:1000*60*60*12}
}));
const upload = multer({dest: uploadDir, limits:{fileSize:10*1024*1024}});

function auth(req,res,next){
  if(!req.session.user) return res.status(401).json({error:"Unauthorized"});
  next();
}
function admin(req,res,next){
  if(req.session.user?.role!=="admin" && req.session.user?.role!=="manager")
    return res.status(403).json({error:"Forbidden"});
  next();
}

app.post("/api/login",(req,res)=>{
  const {username,password}=req.body;
  const u=DB.prepare("SELECT * FROM users WHERE username=? AND active=1").get(username);
  if(!u || u.password!==hash(password||"")) return res.status(401).json({error:"اسم المستخدم أو كلمة المرور غير صحيحة"});
  req.session.user={id:u.id,name:u.name,username:u.username,role:u.role};
  res.json(req.session.user);
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/me",(req,res)=>res.json(req.session.user||null));

app.get("/api/dashboard",auth,(req,res)=>{
  const isManager=["admin","manager"].includes(req.session.user.role);
  const uid=req.session.user.id;
  const reports = isManager
    ? DB.prepare("SELECT COUNT(*) c FROM reports").get().c
    : DB.prepare("SELECT COUNT(*) c FROM reports WHERE user_id=?").get(uid).c;
  const pending = isManager
    ? DB.prepare("SELECT COUNT(*) c FROM reports WHERE status='pending'").get().c
    : DB.prepare("SELECT COUNT(*) c FROM reports WHERE user_id=? AND status='pending'").get(uid).c;
  const tasks = isManager
    ? DB.prepare("SELECT COUNT(*) c FROM tasks WHERE status!='done'").get().c
    : DB.prepare("SELECT COUNT(*) c FROM tasks WHERE assigned_to=? AND status!='done'").get(uid).c;
  const employees=DB.prepare("SELECT COUNT(*) c FROM users WHERE active=1").get().c;
  res.json({reports,pending,tasks,employees});
});

app.get("/api/reports",auth,(req,res)=>{
  const isManager=["admin","manager"].includes(req.session.user.role);
  const rows=isManager
    ? DB.prepare(`SELECT r.*,u.name user_name FROM reports r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC`).all()
    : DB.prepare(`SELECT r.*,u.name user_name FROM reports r JOIN users u ON u.id=r.user_id WHERE r.user_id=? ORDER BY r.id DESC`).all(req.session.user.id);
  res.json(rows);
});
app.post("/api/reports",auth,upload.single("attachment"),(req,res)=>{
  const {title,report_date,client,project,visit_type,description}=req.body;
  if(!title||!report_date||!description) return res.status(400).json({error:"العنوان والتاريخ والوصف مطلوبون"});
  DB.prepare(`INSERT INTO reports(user_id,title,report_date,client,project,visit_type,description,attachment)
    VALUES(?,?,?,?,?,?,?,?)`).run(req.session.user.id,title,report_date,client||"",project||"",visit_type||"",description,req.file?.filename||null);
  res.json({ok:true});
});
app.post("/api/reports/:id/status",auth,admin,(req,res)=>{
  const status=["approved","rejected","pending"].includes(req.body.status)?req.body.status:"pending";
  DB.prepare("UPDATE reports SET status=? WHERE id=?").run(status,req.params.id);
  res.json({ok:true});
});
app.get("/api/reports/export",auth,(req,res)=>{
  const isManager=["admin","manager"].includes(req.session.user.role);
  const rows=isManager
    ? DB.prepare(`SELECT r.id,u.name employee,r.title,r.report_date,r.client,r.project,r.visit_type,r.description,r.status FROM reports r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC`).all()
    : DB.prepare(`SELECT r.id,u.name employee,r.title,r.report_date,r.client,r.project,r.visit_type,r.description,r.status FROM reports r JOIN users u ON u.id=r.user_id WHERE r.user_id=? ORDER BY r.id DESC`).all(req.session.user.id);
  const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv="\ufeff"+["ID,Employee,Title,Date,Client,Project,Visit Type,Description,Status",...rows.map(r=>[r.id,r.employee,r.title,r.report_date,r.client,r.project,r.visit_type,r.description,r.status].map(esc).join(","))].join("\n");
  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition",'attachment; filename="collaboration-zone-reports.csv"');
  res.send(csv);
});

app.get("/api/users",auth,admin,(req,res)=>{
  res.json(DB.prepare("SELECT id,name,username,role,active,created_at FROM users ORDER BY id DESC").all());
});
app.post("/api/users",auth,admin,(req,res)=>{
  const {name,username,password,role}=req.body;
  if(!name||!username||!password) return res.status(400).json({error:"كل الحقول الأساسية مطلوبة"});
  try {
    DB.prepare("INSERT INTO users(name,username,password,role) VALUES(?,?,?,?)")
      .run(name,username,hash(password),["employee","manager","admin"].includes(role)?role:"employee");
    res.json({ok:true});
  } catch(e){ res.status(400).json({error:"اسم المستخدم موجود بالفعل"}); }
});
app.post("/api/users/:id/toggle",auth,admin,(req,res)=>{
  DB.prepare("UPDATE users SET active=CASE active WHEN 1 THEN 0 ELSE 1 END WHERE id=?").run(req.params.id);
  res.json({ok:true});
});

app.get("/api/tasks",auth,(req,res)=>{
  const isManager=["admin","manager"].includes(req.session.user.role);
  res.json(isManager
    ? DB.prepare(`SELECT t.*,u.name employee FROM tasks t JOIN users u ON u.id=t.assigned_to ORDER BY t.id DESC`).all()
    : DB.prepare(`SELECT t.*,u.name employee FROM tasks t JOIN users u ON u.id=t.assigned_to WHERE assigned_to=? ORDER BY t.id DESC`).all(req.session.user.id));
});
app.post("/api/tasks",auth,admin,(req,res)=>{
  const {assigned_to,title,due_date,priority}=req.body;
  if(!assigned_to||!title) return res.status(400).json({error:"الموظف والعنوان مطلوبان"});
  DB.prepare("INSERT INTO tasks(assigned_to,title,due_date,priority) VALUES(?,?,?,?)").run(assigned_to,title,due_date||null,priority||"medium");
  res.json({ok:true});
});
app.post("/api/tasks/:id/done",auth,(req,res)=>{
  const t=DB.prepare("SELECT * FROM tasks WHERE id=?").get(req.params.id);
  if(!t || (t.assigned_to!==req.session.user.id && !["admin","manager"].includes(req.session.user.role))) return res.status(403).json({error:"Forbidden"});
  DB.prepare("UPDATE tasks SET status='done' WHERE id=?").run(req.params.id);
  res.json({ok:true});
});

app.get("/api/clients",auth,(req,res)=>res.json(DB.prepare("SELECT * FROM clients ORDER BY id DESC").all()));
app.post("/api/clients",auth,admin,(req,res)=>{
  const {name,contact,phone,notes}=req.body;
  if(!name) return res.status(400).json({error:"اسم العميل مطلوب"});
  DB.prepare("INSERT INTO clients(name,contact,phone,notes) VALUES(?,?,?,?)").run(name,contact||"",phone||"",notes||"");
  res.json({ok:true});
});

app.use("/uploads",auth,express.static(uploadDir));
app.use(express.static(path.join(ROOT,"public")));
app.get("*",(req,res)=>res.sendFile(path.join(ROOT,"public","index.html")));

app.listen(PORT,()=>console.log(`Collaboration Zone CRM running on http://localhost:${PORT}`));