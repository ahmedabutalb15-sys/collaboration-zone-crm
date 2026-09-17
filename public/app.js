let me = null;

const $ = id => document.getElementById(id);

let currentLang = localStorage.getItem("crmLang") || "ar";

const translations = {
  ar: {
    langBtn: "English",
    pageTitles: {
      dashboard: "لوحة التحكم",
      reports: "الريبورتات",
      tasks: "المهام",
      clients: "العملاء",
      users: "الموظفين والحسابات"
    },

    login: {
      username: "اسم المستخدم",
      password: "كلمة المرور",
      login: "دخول"
    },

    sidebar: {
      dashboard: "📊 لوحة التحكم",
      reports: "📝 الريبورتات",
      tasks: "✅ المهام",
      clients: "👥 العملاء",
      users: "🔐 الموظفين والحسابات",
      logout: "🚪 تسجيل خروج"
    },

    dashboard: {
      reports: "إجمالي الريبورتات",
      pending: "قيد المراجعة",
      tasks: "المهام المفتوحة",
      employees: "الموظفون النشطون",
      about: "عن النظام",
      aboutText:
        "نظام داخلي لإدارة الموظفين والريبورتات والمهام والعملاء. كل مستخدم يرى ما تسمح به صلاحياته."
    },

    common: {
      newReport: "+ ريبورت جديد",
      add: "إضافة",
      cancel: "إلغاء",
      saveReport: "حفظ التقرير",
      export: "⬇ تصدير CSV / Excel",
      employee: "الموظف",
      title: "العنوان",
      date: "التاريخ",
      client: "العميل",
      project: "المشروع",
      details: "التفاصيل",
      status: "الحالة",
      action: "إجراء",
      name: "الاسم",
      username: "اسم المستخدم",
      password: "كلمة المرور",
      phone: "الهاتف",
      notes: "ملاحظات"
    },

    reports: {
      addTitle: "إضافة Daily Report",
      reports: "الريبورتات",
      title: "العنوان",
      date: "التاريخ",
      client: "العميل",
      project: "المشروع",
      visitType: "نوع الزيارة/المهمة",
      attachment: "مرفق",
      description: "تفاصيل العمل",

      visitTypes: [
        "زيارة عميل",
        "متابعة مشروع",
        "اجتماع",
        "مهمة إدارية",
        "أخرى"
      ],

      table: {
        date: "التاريخ",
        employee: "الموظف",
        title: "العنوان",
        client: "العميل",
        project: "المشروع",
        details: "التفاصيل",
        status: "الحالة",
        action: "إجراء"
      },

      approved: "معتمد",
      rejected: "مرفوض",
      pending: "قيد المراجعة",
      approve: "اعتماد",
      reject: "رفض",
      saved: "تم حفظ الريبورت"
    },

    tasks: {
      addTitle: "إضافة مهمة",
      tasks: "المهام",
      employee: "الموظف",
      title: "عنوان المهمة",
      dueDate: "تاريخ الاستحقاق",
      priority: "الأولوية",
      low: "منخفضة",
      medium: "متوسطة",
      high: "عالية",
      tableTask: "المهمة",
      tableEmployee: "الموظف",
      tableDue: "الاستحقاق",
      tablePriority: "الأولوية",
      tableStatus: "الحالة",
      completed: "مكتملة",
      open: "مفتوحة",
      done: "تم الإنجاز"
    },

    clients: {
      addTitle: "إضافة عميل",
      clients: "العملاء",
      name: "اسم العميل",
      contact: "جهة الاتصال",
      phone: "الهاتف",
      notes: "ملاحظات"
    },

    users: {
      addTitle: "إنشاء حساب موظف",
      accounts: "الحسابات",
      name: "الاسم",
      username: "اسم المستخدم",
      password: "كلمة المرور",
      role: "الصلاحية",
      employee: "موظف",
      manager: "Manager",
      admin: "Admin",
      active: "نشط",
      suspended: "موقوف",
      activate: "تفعيل",
      deactivate: "إيقاف",
      created: "تم إنشاء الحساب"
    },

    errors: {
      general: "حدث خطأ"
    }
  },

  en: {
    langBtn: "العربية",

    pageTitles: {
      dashboard: "Dashboard",
      reports: "Reports",
      tasks: "Tasks",
      clients: "Clients",
      users: "Employees & Accounts"
    },

    login: {
      username: "Username",
      password: "Password",
      login: "Login"
    },

    sidebar: {
      dashboard: "📊 Dashboard",
      reports: "📝 Reports",
      tasks: "✅ Tasks",
      clients: "👥 Clients",
      users: "🔐 Employees & Accounts",
      logout: "🚪 Logout"
    },

    dashboard: {
      reports: "Total Reports",
      pending: "Pending Review",
      tasks: "Open Tasks",
      employees: "Active Employees",
      about: "About the System",
      aboutText:
        "An internal system for managing employees, reports, tasks and clients. Each user can only see what their permissions allow."
    },

    common: {
      newReport: "+ New Report",
      add: "Add",
      cancel: "Cancel",
      saveReport: "Save Report",
      export: "⬇ Export CSV / Excel",
      employee: "Employee",
      title: "Title",
      date: "Date",
      client: "Client",
      project: "Project",
      details: "Details",
      status: "Status",
      action: "Action",
      name: "Name",
      username: "Username",
      password: "Password",
      phone: "Phone",
      notes: "Notes"
    },

    reports: {
      addTitle: "Add Daily Report",
      reports: "Reports",
      title: "Title",
      date: "Date",
      client: "Client",
      project: "Project",
      visitType: "Visit / Task Type",
      attachment: "Attachment",
      description: "Work Details",

      visitTypes: [
        "Client Visit",
        "Project Follow-up",
        "Meeting",
        "Administrative Task",
        "Other"
      ],

      table: {
        date: "Date",
        employee: "Employee",
        title: "Title",
        client: "Client",
        project: "Project",
        details: "Details",
        status: "Status",
        action: "Action"
      },

      approved: "Approved",
      rejected: "Rejected",
      pending: "Pending Review",
      approve: "Approve",
      reject: "Reject",
      saved: "Report saved successfully"
    },

    tasks: {
      addTitle: "Add Task",
      tasks: "Tasks",
      employee: "Employee",
      title: "Task Title",
      dueDate: "Due Date",
      priority: "Priority",
      low: "Low",
      medium: "Medium",
      high: "High",
      tableTask: "Task",
      tableEmployee: "Employee",
      tableDue: "Due Date",
      tablePriority: "Priority",
      tableStatus: "Status",
      completed: "Completed",
      open: "Open",
      done: "Mark as Done"
    },

    clients: {
      addTitle: "Add Client",
      clients: "Clients",
      name: "Client Name",
      contact: "Contact Person",
      phone: "Phone",
      notes: "Notes"
    },

    users: {
      addTitle: "Create Employee Account",
      accounts: "Accounts",
      name: "Name",
      username: "Username",
      password: "Password",
      role: "Role",
      employee: "Employee",
      manager: "Manager",
      admin: "Admin",
      active: "Active",
      suspended: "Suspended",
      activate: "Activate",
      deactivate: "Deactivate",
      created: "Account created successfully"
    },

    errors: {
      general: "An error occurred"
    }
  }
};

function t() {
  return translations[currentLang];
}


/* =========================
   LANGUAGE
========================= */

function updateLanguage() {

  const lang = t();

  document.documentElement.lang = currentLang;
  document.documentElement.dir =
    currentLang === "ar" ? "rtl" : "ltr";

  $("langBtn").textContent = lang.langBtn;

  applyStaticTranslations();

  const activePage =
    document.querySelector(".page:not(.hidden)");

  if (activePage) {
    const pageId = activePage.id;

    $("pageTitle").textContent =
      lang.pageTitles[pageId] || "";
  }

  if (me) {
    $("who").textContent =
      currentLang === "ar"
        ? `${me.name} — ${me.role}`
        : `${me.name} — ${me.role}`;
  }

  if (me) {
    loadReports();
    loadTasks();
    loadClients();

    if (["admin", "manager"].includes(me.role)) {
      loadUsers();
    }
  }
}


function applyStaticTranslations() {

  const lang = t();

  /* LOGIN */

  const loginLabels =
    document.querySelectorAll("#loginForm label");

  if (loginLabels[0])
    loginLabels[0].textContent = lang.login.username;

  if (loginLabels[1])
    loginLabels[1].textContent = lang.login.password;

  const loginButton =
    document.querySelector("#loginForm button");

  if (loginButton)
    loginButton.textContent = lang.login.login;


  /* SIDEBAR */

  const sideButtons =
    document.querySelectorAll(".side button[data-page]");

  if (sideButtons[0])
    sideButtons[0].textContent = lang.sidebar.dashboard;

  if (sideButtons[1])
    sideButtons[1].textContent = lang.sidebar.reports;

  if (sideButtons[2])
    sideButtons[2].textContent = lang.sidebar.tasks;

  if (sideButtons[3])
    sideButtons[3].textContent = lang.sidebar.clients;

  if (sideButtons[4])
    sideButtons[4].textContent = lang.sidebar.users;

  $("logout").textContent = lang.sidebar.logout;


  /* NEW REPORT */

  const newReportButton =
    document.querySelector('.top button[onclick="showReportForm()"]');

  if (newReportButton)
    newReportButton.textContent = lang.common.newReport;


  /* DASHBOARD */

  const stats =
    document.querySelectorAll("#dashboard .stat");

  if (stats[0])
    stats[0].firstChild.nodeValue =
      lang.dashboard.reports + " ";

  if (stats[1])
    stats[1].firstChild.nodeValue =
      lang.dashboard.pending + " ";

  if (stats[2])
    stats[2].firstChild.nodeValue =
      lang.dashboard.tasks + " ";

  if (stats[3])
    stats[3].firstChild.nodeValue =
      lang.dashboard.employees + " ";

  const dashboardH3 =
    document.querySelector("#dashboard .panel h3");

  if (dashboardH3)
    dashboardH3.textContent = lang.dashboard.about;

  const dashboardP =
    document.querySelector("#dashboard .panel p");

  if (dashboardP)
    dashboardP.textContent = lang.dashboard.aboutText;


  /* REPORT FORM */

  const reportForm =
    $("reportForm");

  if (reportForm) {

    const h3 =
      reportForm.querySelector("h3");

    if (h3)
      h3.textContent = lang.reports.addTitle;

    const labels =
      reportForm.querySelectorAll("label");

    if (labels[0]) labels[0].textContent = lang.reports.title;
    if (labels[1]) labels[1].textContent = lang.reports.date;
    if (labels[2]) labels[2].textContent = lang.reports.client;
    if (labels[3]) labels[3].textContent = lang.reports.project;
    if (labels[4]) labels[4].textContent = lang.reports.visitType;
    if (labels[5]) labels[5].textContent = lang.reports.attachment;
    if (labels[6]) labels[6].textContent = lang.reports.description;

    const visitSelect =
      reportForm.querySelector('select[name="visit_type"]');

    if (visitSelect) {

      [...visitSelect.options].forEach(
        (option, index) => {
          option.textContent =
            lang.reports.visitTypes[index];
        }
      );

    }

    const buttons =
      reportForm.querySelectorAll("button");

    if (buttons[0])
      buttons[0].textContent = lang.common.saveReport;

    if (buttons[1])
      buttons[1].textContent = lang.common.cancel;
  }


  /* REPORTS PANEL */

  const reportsPanel =
    document.querySelector("#reports > .panel:last-child");

  if (reportsPanel) {

    const h3 =
      reportsPanel.querySelector("h3");

    if (h3)
      h3.textContent = lang.reports.reports;

    const exportBtn =
      reportsPanel.querySelector("button");

    if (exportBtn)
      exportBtn.textContent = lang.common.export;
  }


  /* TASKS */

  const taskAddPanel =
    document.querySelector("#tasks .adminOnly");

  if (taskAddPanel) {

    const h3 =
      taskAddPanel.querySelector("h3");

    if (h3)
      h3.textContent = lang.tasks.addTitle;

    const labels =
      taskAddPanel.querySelectorAll("label");

    if (labels[0]) labels[0].textContent = lang.tasks.employee;
    if (labels[1]) labels[1].textContent = lang.tasks.title;
    if (labels[2]) labels[2].textContent = lang.tasks.dueDate;
    if (labels[3]) labels[3].textContent = lang.tasks.priority;

    const priority =
      taskAddPanel.querySelector('select[name="priority"]');

    if (priority) {

      priority.options[0].textContent = lang.tasks.low;
      priority.options[1].textContent = lang.tasks.medium;
      priority.options[2].textContent = lang.tasks.high;

    }

    const button =
      taskAddPanel.querySelector("button");

    if (button)
      button.textContent = lang.common.add;
  }

  const taskPanels =
    document.querySelectorAll("#tasks .panel");

  const taskListTitle =
    taskPanels[taskPanels.length - 1]?.querySelector("h3");

  if (taskListTitle)
    taskListTitle.textContent = lang.tasks.tasks;


  /* CLIENTS */

  const clientAddPanel =
    document.querySelector("#clients .adminOnly");

  if (clientAddPanel) {

    const h3 =
      clientAddPanel.querySelector("h3");

    if (h3)
      h3.textContent = lang.clients.addTitle;

    const labels =
      clientAddPanel.querySelectorAll("label");

    if (labels[0]) labels[0].textContent = lang.clients.name;
    if (labels[1]) labels[1].textContent = lang.clients.contact;
    if (labels[2]) labels[2].textContent = lang.clients.phone;
    if (labels[3]) labels[3].textContent = lang.clients.notes;

    const button =
      clientAddPanel.querySelector("button");

    if (button)
      button.textContent = lang.common.add;
  }

  const clientPanels =
    document.querySelectorAll("#clients .panel");

  const clientListTitle =
    clientPanels[clientPanels.length - 1]?.querySelector("h3");

  if (clientListTitle)
    clientListTitle.textContent = lang.clients.clients;


  /* USERS */

  const userPanels =
    document.querySelectorAll("#users .panel");

  if (userPanels[0]) {

    const h3 =
      userPanels[0].querySelector("h3");

    if (h3)
      h3.textContent = lang.users.addTitle;

    const labels =
      userPanels[0].querySelectorAll("label");

    if (labels[0]) labels[0].textContent = lang.users.name;
    if (labels[1]) labels[1].textContent = lang.users.username;
    if (labels[2]) labels[2].textContent = lang.users.password;
    if (labels[3]) labels[3].textContent = lang.users.role;

    const role =
      userPanels[0].querySelector('select[name="role"]');

    if (role) {
      role.options[0].textContent = lang.users.employee;
      role.options[1].textContent = lang.users.manager;
      role.options[2].textContent = lang.users.admin;
    }

    const button =
      userPanels[0].querySelector("button");

    if (button)
      button.textContent = lang.common.add;
  }

  if (userPanels[1]) {

    const h3 =
      userPanels[1].querySelector("h3");

    if (h3)
      h3.textContent = lang.users.accounts;
  }
}


$("langBtn")?.addEventListener("click", () => {

  currentLang =
    currentLang === "ar" ? "en" : "ar";

  localStorage.setItem(
    "crmLang",
    currentLang
  );

  updateLanguage();

});


/* =========================
   API
========================= */

async function api(url, opt = {}) {

  const r = await fetch(url, opt);

  const d =
    await r.json().catch(() => ({}));

  if (!r.ok)
    throw new Error(
      d.error || t().errors.general
    );

  return d;
}


function esc(x) {

  return String(x ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m])
  );

}


/* =========================
   BOOT
========================= */

async function boot() {

  try {

    me = await api("/api/me");

    if (!me)
      return;

    $("login").style.display = "none";
    $("app").style.display = "block";

    $("who").textContent =
      `${me.name} — ${me.role}`;

    if (!["admin", "manager"].includes(me.role)) {

      document
        .querySelectorAll(".adminOnly")
        .forEach(x =>
          x.classList.add("hidden")
        );

    }

    updateLanguage();

    loadDashboard();
    loadReports();
    loadTasks();
    loadClients();

    if (["admin", "manager"].includes(me.role))
      loadUsers();

  } catch (e) {

    console.log(e);

  }

}


/* =========================
   PAGES
========================= */

document
  .querySelectorAll("[data-page]")
  .forEach(b => {

    b.onclick = () =>
      showPage(
        b.dataset.page,
        b
      );

  });


function showPage(p, b) {

  document
    .querySelectorAll(".page")
    .forEach(x =>
      x.classList.add("hidden")
    );

  $(p).classList.remove("hidden");

  document
    .querySelectorAll("[data-page]")
    .forEach(x =>
      x.classList.remove("active")
    );

  b?.classList.add("active");

  $("pageTitle").textContent =
    t().pageTitles[p];

}


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {

  const d =
    await api("/api/dashboard");

  $("sReports").textContent =
    d.reports;

  $("sPending").textContent =
    d.pending;

  $("sTasks").textContent =
    d.tasks;

  $("sEmployees").textContent =
    d.employees;

}


/* =========================
   REPORT FORM
========================= */

function showReportForm() {

  showPage(
    "reports",
    document.querySelector(
      '[data-page="reports"]'
    )
  );

  $("reportForm")
    .classList.remove("hidden");

}


function hideReportForm() {

  $("reportForm")
    .classList.add("hidden");

}


/* =========================
   REPORTS
========================= */

async function loadReports() {

  const rows =
    await api("/api/reports");

  const lang =
    t().reports;

  $("reportsTable").innerHTML = `

    <table class="table">

      <tr>
        <th>${lang.table.date}</th>
        <th>${lang.table.employee}</th>
        <th>${lang.table.title}</th>
        <th>${lang.table.client}</th>
        <th>${lang.table.project}</th>
        <th>${lang.table.details}</th>
        <th>${lang.table.status}</th>
        <th>${lang.table.action}</th>
      </tr>

      ${rows.map(r => `

        <tr>

          <td>${esc(r.report_date)}</td>

          <td>${esc(r.user_name)}</td>

          <td>${esc(r.title)}</td>

          <td>${esc(r.client)}</td>

          <td>${esc(r.project)}</td>

          <td>${esc(r.description)}</td>

          <td>
            <span class="badge ${r.status}">
              ${
                r.status === "approved"
                  ? lang.approved
                  : r.status === "rejected"
                    ? lang.rejected
                    : lang.pending
              }
            </span>
          </td>

          <td>

            ${
              ["admin", "manager"].includes(me.role)
                ? `
                  <button
                    class="ghost"
                    onclick="setStatus(${r.id},'approved')"
                  >
                    ${lang.approve}
                  </button>

                  <button
                    class="danger"
                    onclick="setStatus(${r.id},'rejected')"
                  >
                    ${lang.reject}
                  </button>
                `
                : ""
            }

          </td>

        </tr>

      `).join("")}

    </table>

  `;

}


async function setStatus(id, status) {

  await api(
    `/api/reports/${id}/status`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status
      })
    }
  );

  loadReports();
  loadDashboard();

}


/* =========================
   ADD REPORT
========================= */

$("reportAdd").onsubmit = async e => {

  e.preventDefault();

  try {

    await fetch(
      "/api/reports",
      {
        method: "POST",
        body: new FormData(e.target)
      }
    ).then(async r => {

      if (!r.ok)
        throw new Error(
          (await r.json()).error
        );

    });

    e.target.reset();

    hideReportForm();

    loadReports();
    loadDashboard();

    alert(t().reports.saved);

  } catch (x) {

    alert(x.message);

  }

};


/* =========================
   USERS
========================= */

async function loadUsers() {

  const rows =
    await api("/api/users");

  const lang =
    t().users;

  $("usersTable").innerHTML = `

    <table class="table">

      <tr>
        <th>${lang.name}</th>
        <th>${lang.username}</th>
        <th>${lang.role}</th>
        <th>${t().common.status}</th>
        <th></th>
      </tr>

      ${rows.map(u => `

        <tr>

          <td>${esc(u.name)}</td>

          <td>${esc(u.username)}</td>

          <td>${esc(
            u.role === "employee"
              ? lang.employee
              : u.role === "manager"
                ? lang.manager
                : lang.admin
          )}</td>

          <td>
            ${
              u.active
                ? lang.active
                : lang.suspended
            }
          </td>

          <td>

            <button
              class="ghost"
              onclick="toggleUser(${u.id})"
            >
              ${
                u.active
                  ? lang.deactivate
                  : lang.activate
              }
            </button>

          </td>

        </tr>

      `).join("")}

    </table>

  `;


  $("taskUser").innerHTML =
    rows
      .filter(u => u.active)
      .map(
        u =>
          `<option value="${u.id}">
            ${esc(u.name)}
          </option>`
      )
      .join("");

}


async function toggleUser(id) {

  await api(
    `/api/users/${id}/toggle`,
    {
      method: "POST"
    }
  );

  loadUsers();
  loadDashboard();

}


$("userAdd").onsubmit = async e => {

  e.preventDefault();

  try {

    await api(
      "/api/users",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(
          Object.fromEntries(
            new FormData(e.target)
          )
        )
      }
    );

    e.target.reset();

    loadUsers();
    loadDashboard();

    alert(t().users.created);

  } catch (x) {

    alert(x.message);

  }

};


/* =========================
   TASKS
========================= */

async function loadTasks() {

  const rows =
    await api("/api/tasks");

  const lang =
    t().tasks;

  $("tasksTable").innerHTML = `

    <table class="table">

      <tr>
        <th>${lang.tableTask}</th>
        <th>${lang.tableEmployee}</th>
        <th>${lang.tableDue}</th>
        <th>${lang.tablePriority}</th>
        <th>${lang.tableStatus}</th>
        <th></th>
      </tr>

      ${rows.map(tk => `

        <tr>

          <td>${esc(tk.title)}</td>

          <td>${esc(tk.employee)}</td>

          <td>${esc(tk.due_date || "-")}</td>

          <td>
            ${
              tk.priority === "low"
                ? lang.low
                : tk.priority === "medium"
                  ? lang.medium
                  : lang.high
            }
          </td>

          <td>
            ${
              tk.status === "done"
                ? lang.completed
                : lang.open
            }
          </td>

          <td>

            ${
              tk.status !== "done"
                ? `
                  <button
                    class="ghost"
                    onclick="doneTask(${tk.id})"
                  >
                    ${lang.done}
                  </button>
                `
                : ""
            }

          </td>

        </tr>

      `).join("")}

    </table>

  `;

}


async function doneTask(id) {

  await api(
    `/api/tasks/${id}/done`,
    {
      method: "POST"
    }
  );

  loadTasks();
  loadDashboard();

}


$("taskAdd").onsubmit = async e => {

  e.preventDefault();

  await api(
    "/api/tasks",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify(
        Object.fromEntries(
          new FormData(e.target)
        )
      )
    }
  );

  e.target.reset();

  loadTasks();
  loadDashboard();

};


/* =========================
   CLIENTS
========================= */

async function loadClients() {

  const rows =
    await api("/api/clients");

  const lang =
    t().clients;

  $("clientsTable").innerHTML = `

    <table class="table">

      <tr>
        <th>${lang.name}</th>
        <th>${lang.contact}</th>
        <th>${lang.phone}</th>
        <th>${lang.notes}</th>
      </tr>

      ${rows.map(c => `

        <tr>

          <td>${esc(c.name)}</td>

          <td>${esc(c.contact)}</td>

          <td>${esc(c.phone)}</td>

          <td>${esc(c.notes)}</td>

        </tr>

      `).join("")}

    </table>

  `;

}


$("clientAdd").onsubmit = async e => {

  e.preventDefault();

  await api(
    "/api/clients",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify(
        Object.fromEntries(
          new FormData(e.target)
        )
      )
    }
  );

  e.target.reset();

  loadClients();

};


/* =========================
   LOGIN
========================= */

$("loginForm").onsubmit = async e => {

  e.preventDefault();

  $("loginErr")
    .classList.add("hidden");

  try {

    await api(
      "/api/login",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          username:
            $("username").value,

          password:
            $("password").value
        })
      }
    );

    boot();

  } catch (x) {

    $("loginErr").textContent =
      x.message;

    $("loginErr")
      .classList.remove("hidden");

  }

};


/* =========================
   LOGOUT
========================= */

$("logout").onclick = async () => {

  await api(
    "/api/logout",
    {
      method: "POST"
    }
  );

  location.reload();

};


/* =========================
   START
========================= */

boot();

if ("serviceWorker" in navigator) {

  navigator.serviceWorker.register(
    "/sw.js"
  );

}