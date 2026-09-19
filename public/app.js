```javascript
const $ = id => document.getElementById(id);

let me = null;
let currentLang = localStorage.getItem("cz_lang") || "ar";

const translations = {
  ar: {
    pageTitles: {
      dashboard: "لوحة التحكم",
      reports: "الريبورتات",
      tasks: "المهام",
      clients: "العملاء",
      users: "الموظفين والحسابات",
      attendance: "الحضور والانصراف"
    },

    side: {
      dashboard: "📊 لوحة التحكم",
      reports: "📝 الريبورتات",
      tasks: "✅ المهام",
      clients: "👥 العملاء",
      users: "🔐 الموظفين والحسابات",
      attendance: "🕐 الحضور والانصراف",
      logout: "🚪 تسجيل خروج"
    },

    attendance: {
      title: "الحضور والانصراف",
      today: "حضور اليوم",
      checkIn: "🟢 تسجيل حضور",
      checkOut: "🔴 تسجيل انصراف",
      checkInTime: "وقت الحضور",
      checkOutTime: "وقت الانصراف",
      hours: "ساعات العمل",
      status: "الحالة",
      notCheckedIn: "لم يتم تسجيل الحضور",
      working: "موجود حالياً",
      completed: "تم إنهاء اليوم",
      noCheckout: "لم يتم تسجيل الانصراف",
      adminTitle: "سجل حضور الموظفين",
      date: "التاريخ",
      employee: "الموظف",
      username: "اسم المستخدم",
      export: "⬇ تصدير الحضور",
      filter: "عرض التاريخ",
      all: "كل السجلات",
      noData: "لا توجد سجلات حضور",
      successIn: "تم تسجيل الحضور بنجاح",
      successOut: "تم تسجيل الانصراف بنجاح"
    }
  },

  en: {
    pageTitles: {
      dashboard: "Dashboard",
      reports: "Reports",
      tasks: "Tasks",
      clients: "Clients",
      users: "Employees & Accounts",
      attendance: "Attendance"
    },

    side: {
      dashboard: "📊 Dashboard",
      reports: "📝 Reports",
      tasks: "✅ Tasks",
      clients: "👥 Clients",
      users: "🔐 Employees & Accounts",
      attendance: "🕐 Attendance",
      logout: "🚪 Logout"
    },

    attendance: {
      title: "Attendance",
      today: "Today's Attendance",
      checkIn: "🟢 Check In",
      checkOut: "🔴 Check Out",
      checkInTime: "Check In",
      checkOutTime: "Check Out",
      hours: "Working Hours",
      status: "Status",
      notCheckedIn: "Not checked in",
      working: "Currently working",
      completed: "Day completed",
      noCheckout: "No check out yet",
      adminTitle: "Employees Attendance",
      date: "Date",
      employee: "Employee",
      username: "Username",
      export: "⬇ Export Attendance",
      filter: "View Date",
      all: "All records",
      noData: "No attendance records",
      successIn: "Attendance recorded successfully",
      successOut: "Check out recorded successfully"
    }
  }
};

function t() {
  return translations[currentLang];
}


// =========================
// API helper
// =========================

async function api(url, options = {}) {
  const res = await fetch(url, options);

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      data?.error ||
      (currentLang === "ar"
        ? "حدث خطأ"
        : "Something went wrong")
    );
  }

  return data;
}


// =========================
// PAGE DISPLAY
// =========================

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  const target = $(page);

  if (target) {
    target.classList.remove("hidden");
  }

  document
    .querySelectorAll(".side button[data-page]")
    .forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.page === page
      );
    });

  if ($("pageTitle")) {
    $("pageTitle").textContent =
      t().pageTitles[page] || page;
  }
}


// =========================
// Boot
// =========================

async function boot() {
  try {
    me = await api("/api/me");

    if (!me) {
      $("login").style.display = "grid";
      $("app").classList.add("hidden");
      $("app").style.display = "none";
      return;
    }

    $("login").style.display = "none";

    $("app").classList.remove("hidden");
    $("app").style.display = "block";

    showPage("dashboard");

    if (!["admin", "manager"].includes(me.role)) {
      document.querySelectorAll(".adminOnly").forEach(el => {
        el.style.display = "none";
      });
    }

    $("who").textContent =
      currentLang === "ar"
        ? `مرحباً ${me.name}`
        : `Welcome ${me.name}`;

    updateLanguage();

    await loadDashboard();
    await loadReports();
    await loadTasks();
    await loadClients();
    await loadAttendance();

    if (["admin", "manager"].includes(me.role)) {
      await loadUsers();
      await loadAdminAttendance();
    }

  } catch (error) {
    console.error(error);
  }
}


// =========================
// Language
// =========================

function updateLanguage() {

  document.documentElement.lang = currentLang;

  document.documentElement.dir =
    currentLang === "ar" ? "rtl" : "ltr";


  // Sidebar
  document
    .querySelectorAll(".side button[data-page]")
    .forEach(btn => {

      const page = btn.dataset.page;

      if (t().side[page]) {
        btn.textContent = t().side[page];
      }

    });


  // Logout
  const logout = $("logout");

  if (logout) {
    logout.textContent = t().side.logout;
  }


  // Current page title
  const currentPage =
    document.querySelector(".page:not(.hidden)")?.id ||
    "dashboard";

  if ($("pageTitle")) {
    $("pageTitle").textContent =
      t().pageTitles[currentPage] ||
      t().pageTitles.dashboard;
  }


  // Language button
  const langBtn = $("langBtn");

  if (langBtn) {
    langBtn.textContent =
      currentLang === "ar"
        ? "English"
        : "العربية";
  }


  // Topbar
  if ($("who") && me) {
    $("who").textContent =
      currentLang === "ar"
        ? `مرحباً ${me.name}`
        : `Welcome ${me.name}`;
  }


  // Translate static HTML
  translateStaticUI();


  // Attendance
  renderAttendanceLabels();


  // Re-render dynamic sections
  loadReports();
  loadTasks();
  loadClients();
  loadAttendance();

  if (
    me &&
    ["admin", "manager"].includes(me.role)
  ) {
    loadUsers();
    loadAdminAttendance();
  }


  // Mobile navigation fix
  fixMobileNavigation();
}


// =========================
// Static UI translations
// =========================

const staticTranslations = {

  "الرئيسية": "Home",
  "لوحة التحكم": "Dashboard",

  "الريبورتات": "Reports",
  "التقارير": "Reports",
  "المهام": "Tasks",
  "العملاء": "Clients",

  "الموظفين والحسابات": "Employees & Accounts",
  "الموظفين": "Employees",

  "الحضور والانصراف": "Attendance",

  "إضافة ريبورت جديد": "New Report",
  "ريبورت جديد": "New Report",

  "إضافة مهمة": "Add Task",
  "إضافة عميل": "Add Client",
  "إضافة موظف": "Add Employee",

  "الموظف": "Employee",
  "العنوان": "Title",
  "التاريخ": "Date",
  "العميل": "Client",
  "المشروع": "Project",
  "النوع": "Type",
  "الحالة": "Status",
  "التفاصيل": "Details",

  "اسم العميل": "Client Name",
  "جهة الاتصال": "Contact",
  "الهاتف": "Phone",
  "ملاحظات": "Notes",

  "اسم المستخدم": "Username",
  "كلمة المرور": "Password",
  "الاسم": "Name",
  "الصلاحية": "Role",

  "نشط": "Active",
  "متوقف": "Inactive",
  "إيقاف": "Disable",
  "تفعيل": "Activate",

  "المهمة": "Task",
  "الاستحقاق": "Due Date",
  "الأولوية": "Priority",

  "إجراء": "Action",
  "تم": "Done",

  "حفظ": "Save",
  "إلغاء": "Cancel",
  "إضافة": "Add",
  "إغلاق": "Close",

  "لا توجد ريبورتات حتى الآن.": "No reports yet.",
  "لا توجد مهام.": "No tasks.",
  "لا يوجد عملاء.": "No clients.",

  "تسجيل الدخول": "Login",
  "تسجيل خروج": "Logout"
};


const reverseStaticTranslations =
  Object.fromEntries(
    Object.entries(staticTranslations)
      .map(([ar, en]) => [en, ar])
  );


function translateStaticUI() {

  const elements =
    document.querySelectorAll(
      "button, label, th, h1, h2, h3, h4, h5, p, span, .muted"
    );

  elements.forEach(el => {

    if (
      el.children.length > 0 &&
      !el.matches("button, label, th, h1, h2, h3, h4, h5, p, span, .muted")
    ) {
      return;
    }

    const original =
      el.textContent.trim();

    if (!original) return;


    if (currentLang === "en") {

      if (staticTranslations[original]) {
        el.textContent =
          staticTranslations[original];
      }

    } else {

      if (reverseStaticTranslations[original]) {
        el.textContent =
          reverseStaticTranslations[original];
      }

    }

  });


  // Inputs placeholders
  document
    .querySelectorAll("input, textarea")
    .forEach(input => {

      const placeholder =
        input.getAttribute("placeholder");

      if (!placeholder) return;

      if (currentLang === "en") {

        if (staticTranslations[placeholder]) {
          input.placeholder =
            staticTranslations[placeholder];
        }

      } else {

        if (reverseStaticTranslations[placeholder]) {
          input.placeholder =
            reverseStaticTranslations[placeholder];
        }

      }

    });
}


// =========================
// Mobile Navigation
// =========================

function fixMobileNavigation() {

  let style =
    $("czMobileNavigationFix");

  if (!style) {

    style =
      document.createElement("style");

    style.id =
      "czMobileNavigationFix";

    document.head.appendChild(style);
  }


  style.textContent = `

    @media (max-width: 768px) {

      .sidebar {
        position: fixed !important;
        top: 0 !important;
        bottom: auto !important;
        right: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: auto !important;
        z-index: 9999 !important;
      }

      .main {
        margin-right: 0 !important;
        margin-left: 0 !important;
        padding-top: 150px !important;
        width: 100% !important;
      }

      .sidebar nav {
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 6px !important;
      }

      .sidebar nav button {
        flex: 0 0 auto !important;
      }

    }

  `;
}


// =========================
// Navigation
// =========================

document.addEventListener("click", async e => {

  const btn =
    e.target.closest("[data-page]");

  if (!btn) return;

  const page =
    btn.dataset.page;

  showPage(page);

  if (page === "attendance" && me) {

    await loadAttendance();

    if (
      ["admin", "manager"].includes(me.role)
    ) {
      await loadAdminAttendance();
    }

  }

});


// =========================
// Language button
// =========================

$("langBtn")?.addEventListener("click", async () => {

  currentLang =
    currentLang === "ar"
      ? "en"
      : "ar";

  localStorage.setItem(
    "cz_lang",
    currentLang
  );

  updateLanguage();

  await loadDashboard();
  await loadReports();
  await loadTasks();
  await loadClients();
  await loadAttendance();

  if (
    ["admin", "manager"].includes(me?.role)
  ) {
    await loadUsers();
    await loadAdminAttendance();
  }

});


// =========================
// Login
// =========================

$("loginForm")?.addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    $("loginErr").classList.add("hidden");

    try {

      me = await api("/api/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          username:
            $("username").value.trim(),

          password:
            $("password").value
        })
      });


      $("login").style.display = "none";

      $("app").classList.remove("hidden");
      $("app").style.display = "block";

      showPage("dashboard");


      document
        .querySelectorAll(".adminOnly")
        .forEach(el => {

          el.style.display =
            ["admin", "manager"]
              .includes(me.role)
              ? ""
              : "none";

        });


      $("who").textContent =
        currentLang === "ar"
          ? `مرحباً ${me.name}`
          : `Welcome ${me.name}`;


      updateLanguage();


      await loadDashboard();
      await loadReports();
      await loadTasks();
      await loadClients();
      await loadAttendance();


      if (
        ["admin", "manager"].includes(me.role)
      ) {
        await loadUsers();
        await loadAdminAttendance();
      }

    } catch (error) {

      $("loginErr").textContent =
        error.message;

      $("loginErr")
        .classList.remove("hidden");

    }

  }
);


// =========================
// Logout
// =========================

$("logout")?.addEventListener(
  "click",
  async () => {

    try {

      await api("/api/logout", {
        method: "POST"
      });

    } catch (error) {

      console.error(error);

    }

    location.reload();

  }
);


// =========================
// Dashboard
// =========================

async function loadDashboard() {

  try {

    const d =
      await api("/api/dashboard");


    if ($("sReports")) {
      $("sReports").textContent =
        d.reports;
    }


    if ($("sPending")) {
      $("sPending").textContent =
        d.pending;
    }


    if ($("sTasks")) {
      $("sTasks").textContent =
        d.tasks;
    }


    if ($("sEmployees")) {
      $("sEmployees").textContent =
        d.employees;
    }

  } catch (error) {

    console.error(error);

  }

}


// =========================
// Reports
// =========================

async function loadReports() {

  const box =
    $("reportsTable");

  if (!box) return;


  try {

    const rows =
      await api("/api/reports");


    if (!rows.length) {

      box.innerHTML =
        `<p class="muted">${
          currentLang === "ar"
            ? "لا توجد ريبورتات حتى الآن."
            : "No reports yet."
        }</p>`;

      return;
    }


    box.innerHTML = `

      <table class="table">

        <thead>

          <tr>
            <th>ID</th>
            <th>${currentLang === "ar" ? "الموظف" : "Employee"}</th>
            <th>${currentLang === "ar" ? "العنوان" : "Title"}</th>
            <th>${currentLang === "ar" ? "التاريخ" : "Date"}</th>
            <th>${currentLang === "ar" ? "العميل" : "Client"}</th>
            <th>${currentLang === "ar" ? "المشروع" : "Project"}</th>
            <th>${currentLang === "ar" ? "النوع" : "Type"}</th>
            <th>${currentLang === "ar" ? "الحالة" : "Status"}</th>
            <th>${currentLang === "ar" ? "التفاصيل" : "Details"}</th>
          </tr>

        </thead>

        <tbody>

          ${rows.map(r => `

            <tr>

              <td>${r.id}</td>

              <td>
                ${escapeHtml(r.user_name || "")}
              </td>

              <td>
                ${escapeHtml(r.title)}
              </td>

              <td>
                ${escapeHtml(r.report_date)}
              </td>

              <td>
                ${escapeHtml(r.client || "")}
              </td>

              <td>
                ${escapeHtml(r.project || "")}
              </td>

              <td>
                ${escapeHtml(r.visit_type || "")}
              </td>

              <td>
                <span class="badge ${r.status}">
                  ${escapeHtml(r.status)}
                </span>
              </td>

              <td>
                ${escapeHtml(r.description)}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;

  } catch (error) {

    box.innerHTML =
      `<p class="danger">${escapeHtml(error.message)}</p>`;
  }

}


function showReportForm() {

  $("reportForm")?.classList.remove("hidden");


  const dateInput =
    document.querySelector(
      '#reportAdd input[name="report_date"]'
    );


  if (
    dateInput &&
    !dateInput.value
  ) {

    dateInput.value =
      new Date()
        .toISOString()
        .split("T")[0];

  }

}


function hideReportForm() {

  $("reportForm")
    ?.classList.add("hidden");

}


$("reportAdd")?.addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    try {

      const formData =
        new FormData(
          $("reportAdd")
        );


      await api(
        "/api/reports",
        {
          method: "POST",
          body: formData
        }
      );


      $("reportAdd").reset();

      hideReportForm();

      await loadReports();
      await loadDashboard();


      alert(
        currentLang === "ar"
          ? "تم حفظ التقرير"
          : "Report saved"
      );

    } catch (error) {

      alert(error.message);

    }

  }
);


// =========================
// Users
// =========================

async function loadUsers() {

  const box =
    $("usersTable");

  if (!box) return;


  try {

    const rows =
      await api("/api/users");


    box.innerHTML = `

      <table class="table">

        <thead>

          <tr>
            <th>ID</th>
            <th>${currentLang === "ar" ? "الاسم" : "Name"}</th>
            <th>${currentLang === "ar" ? "اسم المستخدم" : "Username"}</th>
            <th>${currentLang === "ar" ? "الصلاحية" : "Role"}</th>
            <th>${currentLang === "ar" ? "الحالة" : "Status"}</th>
            <th>${currentLang === "ar" ? "إجراء" : "Action"}</th>
          </tr>

        </thead>

        <tbody>

          ${rows.map(u => `

            <tr>

              <td>${u.id}</td>

              <td>
                ${escapeHtml(u.name)}
              </td>

              <td>
                ${escapeHtml(u.username)}
              </td>

              <td>
                ${escapeHtml(u.role)}
              </td>

              <td>

                <span class="badge ${
                  Number(u.active)
                    ? "approved"
                    : "rejected"
                }">

                  ${
                    Number(u.active)
                      ? (
                        currentLang === "ar"
                          ? "نشط"
                          : "Active"
                      )
                      : (
                        currentLang === "ar"
                          ? "متوقف"
                          : "Inactive"
                      )
                  }

                </span>

              </td>

              <td>

                <button
                  class="${
                    Number(u.active)
                      ? "danger"
                      : "primary"
                  }"
                  onclick="toggleUser(${u.id})"
                >

                  ${
                    Number(u.active)
                      ? (
                        currentLang === "ar"
                          ? "إيقاف"
                          : "Disable"
                      )
                      : (
                        currentLang === "ar"
                          ? "تفعيل"
                          : "Activate"
                      )
                  }

                </button>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;


    const select =
      $("taskUser");


    if (select) {

      select.innerHTML =
        rows
          .filter(
            u => Number(u.active)
          )
          .map(
            u =>
              `<option value="${u.id}">
                ${escapeHtml(u.name)}
              </option>`
          )
          .join("");

    }

  } catch (error) {

    box.innerHTML =
      `<p class="danger">${escapeHtml(error.message)}</p>`;

  }

}


async function toggleUser(id) {

  try {

    await api(
      `/api/users/${id}/toggle`,
      {
        method: "POST"
      }
    );

    await loadUsers();

  } catch (error) {

    alert(error.message);

  }

}


window.toggleUser =
  toggleUser;


$("userAdd")?.addEventListener(
  "submit",
  async e => {

    e.preventDefault();


    const form =
      Object.fromEntries(
        new FormData(
          $("userAdd")
        ).entries()
      );


    try {

      await api(
        "/api/users",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(form)
        }
      );


      $("userAdd").reset();

      await loadUsers();
      await loadDashboard();


      alert(
        currentLang === "ar"
          ? "تم إنشاء الحساب"
          : "Account created"
      );

    } catch (error) {

      alert(error.message);

    }

  }
);


// =========================
// Tasks
// =========================

async function loadTasks() {

  const box =
    $("tasksTable");

  if (!box) return;


  try {

    const rows =
      await api("/api/tasks");


    if (!rows.length) {

      box.innerHTML =
        `<p class="muted">${
          currentLang === "ar"
            ? "لا توجد مهام."
            : "No tasks."
        }</p>`;

      return;

    }


    box.innerHTML = `

      <table class="table">

        <thead>

          <tr>
            <th>ID</th>
            <th>${currentLang === "ar" ? "الموظف" : "Employee"}</th>
            <th>${currentLang === "ar" ? "المهمة" : "Task"}</th>
            <th>${currentLang === "ar" ? "الاستحقاق" : "Due Date"}</th>
            <th>${currentLang === "ar" ? "الأولوية" : "Priority"}</th>
            <th>${currentLang === "ar" ? "الحالة" : "Status"}</th>
            <th>${currentLang === "ar" ? "إجراء" : "Action"}</th>
          </tr>

        </thead>

        <tbody>

          ${rows.map(task => `

            <tr>

              <td>${task.id}</td>

              <td>
                ${escapeHtml(task.employee)}
              </td>

              <td>
                ${escapeHtml(task.title)}
              </td>

              <td>
                ${escapeHtml(task.due_date || "")}
              </td>

              <td>
                ${escapeHtml(task.priority)}
              </td>

              <td>
                ${escapeHtml(task.status)}
              </td>

              <td>

                ${
                  task.status !== "done"
                    ? `
                      <button
                        class="primary"
                        onclick="doneTask(${task.id})"
                      >
                        ${
                          currentLang === "ar"
                            ? "تم"
                            : "Done"
                        }
                      </button>
                    `
                    : "✓"
                }

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;

  } catch (error) {

    box.innerHTML =
      `<p class="danger">${escapeHtml(error.message)}</p>`;

  }

}


async function doneTask(id) {

  try {

    await api(
      `/api/tasks/${id}/done`,
      {
        method: "POST"
      }
    );

    await loadTasks();
    await loadDashboard();

  } catch (error) {

    alert(error.message);

  }

}


window.doneTask =
  doneTask;


$("taskAdd")?.addEventListener(
  "submit",
  async e => {

    e.preventDefault();


    const form =
      Object.fromEntries(
        new FormData(
          $("taskAdd")
        ).entries()
      );


    try {

      await api(
        "/api/tasks",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(form)
        }
      );


      $("taskAdd").reset();

      await loadTasks();
      await loadDashboard();


      alert(
        currentLang === "ar"
          ? "تمت إضافة المهمة"
          : "Task added"
      );

    } catch (error) {

      alert(error.message);

    }

  }
);


// =========================
// Clients
// =========================

async function loadClients() {

  const box =
    $("clientsTable");

  if (!box) return;


  try {

    const rows =
      await api("/api/clients");


    if (!rows.length) {

      box.innerHTML =
        `<p class="muted">${
          currentLang === "ar"
            ? "لا يوجد عملاء."
            : "No clients."
        }</p>`;

      return;

    }


    box.innerHTML = `

      <table class="table">

        <thead>

          <tr>
            <th>ID</th>
            <th>${currentLang === "ar" ? "اسم العميل" : "Client Name"}</th>
            <th>${currentLang === "ar" ? "جهة الاتصال" : "Contact"}</th>
            <th>${currentLang === "ar" ? "الهاتف" : "Phone"}</th>
            <th>${currentLang === "ar" ? "ملاحظات" : "Notes"}</th>
          </tr>

        </thead>

        <tbody>

          ${rows.map(c => `

            <tr>

              <td>
                ${c.id}
              </td>

              <td>
                ${escapeHtml(c.name)}
              </td>

              <td>
                ${escapeHtml(c.contact || "")}
              </td>

              <td>
                ${escapeHtml(c.phone || "")}
              </td>

              <td>
                ${escapeHtml(c.notes || "")}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;

  } catch (error) {

    box.innerHTML =
      `<p class="danger">${escapeHtml(error.message)}</p>`;

  }

}


$("clientAdd")?.addEventListener(
  "submit",
  async e => {

    e.preventDefault();


    const form =
      Object.fromEntries(
        new FormData(
          $("clientAdd")
        ).entries()
      );


    try {

      await api(
        "/api/clients",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(form)
        }
      );


      $("clientAdd").reset();

      await loadClients();


      alert(
        currentLang === "ar"
          ? "تمت إضافة العميل"
          : "Client added"
      );

    } catch (error) {

      alert(error.message);

    }

  }
);


// =========================
// Attendance Labels
// =========================

function renderAttendanceLabels() {

  const title =
    $("attendanceTitle");

  if (title) {
    title.textContent =
      t().attendance.title;
  }


  const todayTitle =
    $("attendanceTodayTitle");

  if (todayTitle) {
    todayTitle.textContent =
      t().attendance.today;
  }


  const adminTitle =
    $("attendanceAdminTitle");

  if (adminTitle) {
    adminTitle.textContent =
      t().attendance.adminTitle;
  }


  const exportBtn =
    $("attendanceExport");

  if (exportBtn) {
    exportBtn.textContent =
      t().attendance.export;
  }


  const filterLabel =
    $("attendanceFilterLabel");

  if (filterLabel) {
    filterLabel.textContent =
      t().attendance.filter;
  }

}


// =========================
// Attendance Date/Time
// =========================

function formatDateTime(value) {

  if (!value) return "-";


  const d =
    new Date(value);


  if (Number.isNaN(d.getTime())) {
    return String(value);
  }


  return d.toLocaleString(
    currentLang === "ar"
      ? "ar-SA"
      : "en-SA",
    {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function formatTime(value) {

  if (!value) return "-";


  const d =
    new Date(value);


  if (Number.isNaN(d.getTime())) {
    return String(value);
  }


  return d.toLocaleTimeString(
    currentLang === "ar"
      ? "ar-SA"
      : "en-SA",
    {
      timeZone: "Asia/Riyadh",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// =========================
// Attendance - Employee
// =========================

async function loadAttendance() {

  const box =
    $("attendanceToday");

  if (!box) return;


  try {

    const record =
      await api(
        "/api/attendance/today"
      );


    if (!record) {

      box.innerHTML = `

        <div class="attendanceStatus">

          <div class="attendanceIcon">
            🕐
          </div>

          <div>

            <strong>
              ${escapeHtml(
                t().attendance.notCheckedIn
              )}
            </strong>

            <p class="muted">

              ${
                currentLang === "ar"
                  ? "لم يتم تسجيل حضورك اليوم."
                  : "You have not checked in today."
              }

            </p>

          </div>

        </div>

        <button
          id="checkInBtn"
          class="primary attendanceBtn"
          onclick="checkIn()"
        >
          ${t().attendance.checkIn}
        </button>

      `;

      return;

    }


    const checkIn =
      formatTime(record.check_in);

    const checkOut =
      formatTime(record.check_out);


    let statusText;


    if (!record.check_in) {

      statusText =
        t().attendance.notCheckedIn;

    } else if (!record.check_out) {

      statusText =
        t().attendance.working;

    } else {

      statusText =
        t().attendance.completed;

    }


    box.innerHTML = `

      <div class="attendanceStatus">

        <div class="attendanceIcon">

          ${
            record.check_out
              ? "✅"
              : "🟢"
          }

        </div>

        <div>

          <strong>
            ${escapeHtml(statusText)}
          </strong>

          <p class="muted">

            ${
              currentLang === "ar"
                ? `الحضور: ${checkIn}`
                : `Check in: ${checkIn}`
            }

          </p>

          ${
            record.check_out
              ? `

                <p class="muted">

                  ${
                    currentLang === "ar"
                      ? `الانصراف: ${checkOut}`
                      : `Check out: ${checkOut}`
                  }

                </p>

              `
              : ""
          }


          ${
            record.hours !== null &&
            record.hours !== undefined

              ? `

                <p class="attendanceHours">

                  ⏱ ${record.hours}

                  ${
                    currentLang === "ar"
                      ? "ساعة"
                      : "hours"
                  }

                </p>

              `

              : `

                <p class="muted">
                  ${t().attendance.noCheckout}
                </p>

              `
          }

        </div>

      </div>


      ${
        record.check_in &&
        !record.check_out

          ? `

            <button
              id="checkOutBtn"
              class="danger attendanceBtn"
              onclick="checkOut()"
            >

              ${t().attendance.checkOut}

            </button>

          `

          : ""
      }

    `;

  } catch (error) {

    box.innerHTML =
      `<p class="danger">${escapeHtml(error.message)}</p>`;

  }

}


// =========================
// Check In
// =========================

async function checkIn() {

  try {

    await api(
      "/api/attendance/check-in",
      {
        method: "POST"
      }
    );


    await loadAttendance();


    alert(
      t().attendance.successIn
    );

  } catch (error) {

    alert(error.message);

  }

}


// =========================
// Check Out
// =========================

async function checkOut() {

  if (
    !confirm(
      currentLang === "ar"
        ? "هل تريد تسجيل الانصراف الآن؟"
        : "Do you want to check out now?"
    )
  ) {
    return;
  }


  try {

    await api(
      "/api/attendance/check-out",
      {
        method: "POST"
      }
    );


    await loadAttendance();


    alert(
      t().attendance.successOut
    );


       if (
      ["admin", "manager"].includes(me?.role)
    ) {
      await loadAdminAttendance();
    }

  } catch (error) {

    alert(error.message);

  }

}


// =========================
// Export Attendance
// =========================

async function exportAttendance() {

  try {

    const date =
      $("attendanceDate")?.value || "";

    const url =
      date
        ? `/api/attendance/export?date=${encodeURIComponent(date)}`
        : "/api/attendance/export";

    window.open(url, "_blank");

  } catch (error) {

    alert(error.message);

  }

}

window.checkIn = checkIn;
window.checkOut = checkOut;
window.exportAttendance = exportAttendance;


// =========================
// Escape HTML
// =========================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// =========================
// Start App
// =========================

boot();
