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
      t().pageTitles[page] ||
      page;
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

    // إزالة hidden حتى يظهر التطبيق مع التصميم الأصلي
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
    currentLang === "ar"
      ? "rtl"
      : "ltr";

  const sideButtons =
    document.querySelectorAll(".side button[data-page]");

  sideButtons.forEach(btn => {
    const page = btn.dataset.page;

    if (t().side[page]) {
      btn.textContent = t().side[page];
    }
  });

  const logout = $("logout");

  if (logout) {
    logout.textContent = t().side.logout;
  }

  const currentPage =
    document.querySelector(".page:not(.hidden)")?.id ||
    "dashboard";

  if ($("pageTitle")) {
    $("pageTitle").textContent =
      t().pageTitles[currentPage] ||
      t().pageTitles.dashboard;
  }

  const langBtn = $("langBtn");

  if (langBtn) {
    langBtn.textContent =
      currentLang === "ar"
        ? "English"
        : "العربية";
  }

  renderAttendanceLabels();
}


// =========================
// Navigation
// =========================

document.addEventListener("click", async e => {
  const btn = e.target.closest("[data-page]");

  if (!btn) return;

  const page = btn.dataset.page;

  showPage(page);

  if (page === "attendance" && me) {
    await loadAttendance();

    if (["admin", "manager"].includes(me.role)) {
      await loadAdminAttendance();
    }
  }
});


// =========================
// Language button
// =========================

$("langBtn")?.addEventListener("click", () => {
  currentLang =
    currentLang === "ar"
      ? "en"
      : "ar";

  localStorage.setItem(
    "cz_lang",
    currentLang
  );

  updateLanguage();

  loadDashboard();
  loadReports();
  loadTasks();
  loadClients();
  loadAttendance();

  if (["admin", "manager"].includes(me?.role)) {
    loadUsers();
    loadAdminAttendance();
  }
});


// =========================
// Login
// =========================

$("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  $("loginErr").classList.add("hidden");

  try {
    me = await api("/api/login", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        username: $("username").value.trim(),
        password: $("password").value
      })
    });

    $("login").style.display = "none";

    // إزالة hidden حتى يظهر التطبيق مع التصميم الأصلي
    $("app").classList.remove("hidden");
    $("app").style.display = "block";

    showPage("dashboard");

    document.querySelectorAll(".adminOnly").forEach(el => {
      el.style.display =
        ["admin", "manager"].includes(me.role)
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

    if (["admin", "manager"].includes(me.role)) {
      await loadUsers();
      await loadAdminAttendance();
    }

  } catch (error) {
    $("loginErr").textContent = error.message;

    $("loginErr").classList.remove("hidden");
  }
});


// =========================
// Logout
// =========================

$("logout")?.addEventListener("click", async () => {
  try {
    await api("/api/logout", {
      method: "POST"
    });
  } catch (error) {
    console.error(error);
  }

  location.reload();
});


// =========================
// Dashboard
// =========================

async function loadDashboard() {
  try {
    const d = await api("/api/dashboard");

    if ($("sReports")) {
      $("sReports").textContent = d.reports;
    }

    if ($("sPending")) {
      $("sPending").textContent = d.pending;
    }

    if ($("sTasks")) {
      $("sTasks").textContent = d.tasks;
    }

    if ($("sEmployees")) {
      $("sEmployees").textContent = d.employees;
    }

  } catch (error) {
    console.error(error);
  }
}


// =========================
// Reports
// =========================

async function loadReports() {
  const box = $("reportsTable");

  if (!box) return;

  try {
    const rows = await api("/api/reports");

    if (!rows.length) {
      box.innerHTML =
        `<p class="muted">لا توجد ريبورتات حتى الآن.</p>`;

      return;
    }

    box.innerHTML = `
      <table class="table">

        <thead>
          <tr>
            <th>ID</th>
            <th>الموظف</th>
            <th>العنوان</th>
            <th>التاريخ</th>
            <th>العميل</th>
            <th>المشروع</th>
            <th>النوع</th>
            <th>الحالة</th>
            <th>التفاصيل</th>
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

  if (dateInput && !dateInput.value) {
    dateInput.value =
      new Date().toISOString().split("T")[0];
  }
}


function hideReportForm() {
  $("reportForm")?.classList.add("hidden");
}


$("reportAdd")?.addEventListener("submit", async e => {
  e.preventDefault();

  try {

    const formData =
      new FormData($("reportAdd"));

    await api("/api/reports", {
      method: "POST",
      body: formData
    });

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
});


// =========================
// Users
// =========================

async function loadUsers() {
  const box = $("usersTable");

  if (!box) return;

  try {

    const rows = await api("/api/users");

    box.innerHTML = `
      <table class="table">

        <thead>
          <tr>
            <th>ID</th>
            <th>الاسم</th>
            <th>اسم المستخدم</th>
            <th>الصلاحية</th>
            <th>الحالة</th>
            <th>إجراء</th>
          </tr>
        </thead>

        <tbody>

          ${rows.map(u => `
            <tr>

              <td>
                ${u.id}
              </td>

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
                      ? "نشط"
                      : "متوقف"
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
                      ? "إيقاف"
                      : "تفعيل"
                  }

                </button>

              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>
    `;

    const select = $("taskUser");

    if (select) {

      select.innerHTML = rows
        .filter(u => Number(u.active))
        .map(u =>
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

    await api(`/api/users/${id}/toggle`, {
      method: "POST"
    });

    await loadUsers();

  } catch (error) {

    alert(error.message);
  }
}


window.toggleUser = toggleUser;


$("userAdd")?.addEventListener("submit", async e => {

  e.preventDefault();

  const form =
    Object.fromEntries(
      new FormData($("userAdd")).entries()
    );

  try {

    await api("/api/users", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(form)
    });

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
});


// =========================
// Tasks
// =========================

async function loadTasks() {

  const box = $("tasksTable");

  if (!box) return;

  try {

    const rows = await api("/api/tasks");

    if (!rows.length) {

      box.innerHTML =
        `<p class="muted">لا توجد مهام.</p>`;

      return;
    }

    box.innerHTML = `
      <table class="table">

        <thead>

          <tr>
            <th>ID</th>
            <th>الموظف</th>
            <th>المهمة</th>
            <th>الاستحقاق</th>
            <th>الأولوية</th>
            <th>الحالة</th>
            <th>إجراء</th>
          </tr>

        </thead>

        <tbody>

          ${rows.map(t => `
            <tr>

              <td>
                ${t.id}
              </td>

              <td>
                ${escapeHtml(t.employee)}
              </td>

              <td>
                ${escapeHtml(t.title)}
              </td>

              <td>
                ${escapeHtml(t.due_date || "")}
              </td>

              <td>
                ${escapeHtml(t.priority)}
              </td>

              <td>
                ${escapeHtml(t.status)}
              </td>

              <td>

                ${
                  t.status !== "done"
                    ? `
                      <button
                        class="primary"
                        onclick="doneTask(${t.id})"
                      >
                        تم
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

    await api(`/api/tasks/${id}/done`, {
      method: "POST"
    });

    await loadTasks();

    await loadDashboard();

  } catch (error) {

    alert(error.message);
  }
}


window.doneTask = doneTask;


$("taskAdd")?.addEventListener("submit", async e => {

  e.preventDefault();

  const form =
    Object.fromEntries(
      new FormData($("taskAdd")).entries()
    );

  try {

    await api("/api/tasks", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(form)
    });

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
});


// =========================
// Clients
// =========================

async function loadClients() {

  const box = $("clientsTable");

  if (!box) return;

  try {

    const rows = await api("/api/clients");

    if (!rows.length) {

      box.innerHTML =
        `<p class="muted">لا يوجد عملاء.</p>`;

      return;
    }

    box.innerHTML = `
      <table class="table">

        <thead>

          <tr>
            <th>ID</th>
            <th>اسم العميل</th>
            <th>جهة الاتصال</th>
            <th>الهاتف</th>
            <th>ملاحظات</th>
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


$("clientAdd")?.addEventListener("submit", async e => {

  e.preventDefault();

  const form =
    Object.fromEntries(
      new FormData($("clientAdd")).entries()
    );

  try {

    await api("/api/clients", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(form)
    });

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
});


// =========================
// Attendance Labels
// =========================

function renderAttendanceLabels() {

  const title = $("attendanceTitle");

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

  const d = new Date(value);

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

  const d = new Date(value);

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

  const box = $("attendanceToday");

  if (!box) return;

  try {

    const record =
      await api("/api/attendance/today");

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

    await api("/api/attendance/check-in", {
      method: "POST"
    });

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

    await api("/api/attendance/check-out", {
      method: "POST"
    });

    await loadAttendance();

    alert(
      t().attendance.successOut
    );


    if (
      ["admin", "manager"].includes(
        me?.role
      )
    ) {

      await loadAdminAttendance();
    }

  } catch (error) {

    alert(error.message);
  }
}


window.checkIn = checkIn;
window.checkOut = checkOut;


// =========================
// Attendance - Admin
// =========================

async function loadAdminAttendance() {

  const box =
    $("attendanceTable");

  if (!box) return;


  try {

    const date =
      $("attendanceDate")?.value || "";


    const url = date
      ? `/api/attendance?date=${encodeURIComponent(date)}`
      : "/api/attendance";


    const rows =
      await api(url);


    if (!rows.length) {

      box.innerHTML = `

        <p class="muted">

          ${escapeHtml(
            t().attendance.noData
          )}

        </p>

      `;

      return;
    }


    box.innerHTML = `

      <table class="table">

        <thead>

          <tr>

            <th>
              ${t().attendance.date}
            </th>

            <th>
              ${t().attendance.employee}
            </th>

            <th>
              ${t().attendance.username}
            </th>

            <th>
              ${t().attendance.checkInTime}
            </th>

            <th>
              ${t().attendance.checkOutTime}
            </th>

            <th>
              ${t().attendance.hours}
            </th>

            <th>
              ${t().attendance.status}
            </th>

          </tr>

        </thead>


        <tbody>

          ${rows.map(r => {

            let status = "";


            if (!r.check_in) {

              status =
                t().attendance.notCheckedIn;

            } else if (!r.check_out) {

              status =
                t().attendance.working;

            } else {

              status =
                t().attendance.completed;
            }


            return `

              <tr>

                <td>
                  ${escapeHtml(
                    String(
                      r.work_date || ""
                    )
                  )}
                </td>


                <td>
                  ${escapeHtml(
                    r.employee || ""
                  )}
                </td>


                <td>
                  ${escapeHtml(
                    r.username || ""
                  )}
                </td>


                <td>
                  ${escapeHtml(
                    formatTime(
                      r.check_in
                    )
                  )}
                </td>


                <td>
                  ${escapeHtml(
                    formatTime(
                      r.check_out
                    )
                  )}
                </td>


                <td>

                  ${
                    r.hours !== null &&
                    r.hours !== undefined

                      ? `

                        ${escapeHtml(
                          String(r.hours)
                        )}

                        ${
                          currentLang === "ar"
                            ? "ساعة"
                            : "h"
                        }

                      `

                      : "-"
                  }

                </td>


                <td>

                  <span
                    class="badge ${
                      r.check_out
                        ? "approved"
                        : r.check_in
                          ? "pending"
                          : "rejected"
                    }"
                  >

                    ${escapeHtml(status)}

                  </span>

                </td>

              </tr>

            `;

          }).join("")}

        </tbody>

      </table>

    `;

  } catch (error) {

    box.innerHTML =
      `<p class="danger">${escapeHtml(error.message)}</p>`;
  }
}


// =========================
// Attendance Filter
// =========================

$("attendanceDate")?.addEventListener(
  "change",
  loadAdminAttendance
);


// =========================
// Attendance Export
// =========================

$("attendanceExport")?.addEventListener(
  "click",
  () => {

    window.location.href =
      "/api/attendance/export";

  }
);


// =========================
// Utilities
// =========================

function escapeHtml(value) {

  return String(value ?? "")

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


// =========================
// Service Worker
// =========================

if ("serviceWorker" in navigator) {

  navigator.serviceWorker.register("/sw.js")
    .catch(error => {
      console.error(
        "Service Worker error:",
        error
      );
    });

}


// =========================
// Start
// =========================

boot();
