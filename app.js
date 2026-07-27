/**
 * Core Application Logic for Project Schedule Landing Page
 */

// Application State
let appTasks = [];
let appCategories = [...INITIAL_CATEGORIES];
let currentCalendarDate = new Date(2026, 7, 1); // August 2026

// Gantt Date Scope Constants
const GANTT_DATES = [
  "2026-07-30", "2026-07-31", // July
  "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", 
  "2026-08-06", "2026-08-07", "2026-08-08", "2026-08-09", "2026-08-10", 
  "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14" // August
];

// Document Elements
const elTotalTasks = document.getElementById("stat-total-tasks");
const elCompletionRate = document.getElementById("stat-completion-rate");
const elProgressBar = document.getElementById("stat-progress-bar");
const elWorkloadReza = document.getElementById("stat-workload-reza");
const elWorkloadAnnas = document.getElementById("stat-workload-annas");
const elWorkloadTimMHS = document.getElementById("stat-workload-timmhs");

const elGanttDateHeaderRow = document.getElementById("gantt-date-header-row");
const elGanttTbody = document.getElementById("gantt-tbody");

const elKanbanTodo = document.getElementById("kanban-todo-list");
const elKanbanProgress = document.getElementById("kanban-progress-list");
const elKanbanDone = document.getElementById("kanban-done-list");
const elBadgeTodo = document.getElementById("badge-todo-count");
const elBadgeProgress = document.getElementById("badge-progress-count");
const elBadgeDone = document.getElementById("badge-done-count");

const elCalendarTitle = document.getElementById("calendar-title");
const elCalendarDays = document.getElementById("calendar-days-container");

const elListTbody = document.getElementById("list-tbody");

const elFilterSearch = document.getElementById("filter-search");
const elFilterCategory = document.getElementById("filter-category");
const elFilterAssignee = document.getElementById("filter-assignee");

// Modals
const modalSettings = document.getElementById("modal-settings");
const modalTask = document.getElementById("modal-task");
const modalSyncProgress = document.getElementById("modal-sync-progress");

// Forms
const formSettings = document.getElementById("form-settings");
const formTask = document.getElementById("form-task");

/* ==========================================================================
   1. Initialize Application
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Load tasks from LocalStorage or populate default
  const savedTasks = localStorage.getItem("project_schedule_tasks");
  if (savedTasks) {
    appTasks = JSON.parse(savedTasks);
  } else {
    appTasks = [...INITIAL_TASKS];
    saveTasksToLocalStorage();
  }

  // Load custom categories from storage if any
  const savedCategories = localStorage.getItem("project_schedule_categories");
  if (savedCategories) {
    appCategories = JSON.parse(savedCategories);
  }

  // Setup UI elements and icons
  lucide.createIcons();
  
  // Theme check
  const savedTheme = localStorage.getItem("project_theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  // Populate Filter and Form Dropdowns
  populateDropdowns();
  
  // Initialize dynamic headers for Gantt Chart
  renderGanttHeaders();

  // Load configuration settings
  loadSettingsForm();

  // Perform Initial Render
  renderAllViews();

  // Setup event listeners
  setupEventListeners();
});

function saveTasksToLocalStorage() {
  localStorage.setItem("project_schedule_tasks", JSON.stringify(appTasks));
}

function updateThemeIcon(theme) {
  const icon = document.querySelector("#btn-toggle-theme i");
  if (!icon) return;
  if (theme === "light") {
    icon.setAttribute("data-lucide", "moon");
  } else {
    icon.setAttribute("data-lucide", "sun");
  }
  lucide.createIcons();
}

/* ==========================================================================
   2. Render Dashboard Statistics
   ========================================================================== */

function renderDashboardStats() {
  const total = appTasks.length;
  const done = appTasks.filter(t => t.status === "done").length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  elTotalTasks.textContent = total;
  elCompletionRate.textContent = `${rate}%`;
  elProgressBar.style.width = `${rate}%`;

  const countTasksByAssignee = (id) => appTasks.filter(t => t.assignee === id).length;

  elWorkloadReza.textContent = `${countTasksByAssignee("reza")} Tugas`;
  elWorkloadAnnas.textContent = `${countTasksByAssignee("annas")} Tugas`;
  elWorkloadTimMHS.textContent = `${countTasksByAssignee("timmhs")} Tugas`;
}

function populateDropdowns() {
  // Populate Category options in Filter Bar and Modal Form
  const filterCat = document.getElementById("filter-category");
  const formCat = document.getElementById("task-form-category");

  // Keep first option for filter ("Semua Kategori")
  filterCat.innerHTML = `<option value="">Semua Kategori</option>`;
  formCat.innerHTML = "";

  appCategories.forEach(cat => {
    filterCat.innerHTML += `<option value="${cat}">${cat}</option>`;
    formCat.innerHTML += `<option value="${cat}">${cat}</option>`;
  });

  // Add options for "Tambah Kategori Baru" in Modal Form
  formCat.innerHTML += `<option value="__new__">+ Kategori Baru...</option>`;
}

/* ==========================================================================
   3. View Switcher Control
   ========================================================================== */

function setupEventListeners() {
  // Tab view switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const activeBtn = e.currentTarget;
      document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      activeBtn.classList.add("active");

      const targetView = activeBtn.getAttribute("data-view");
      document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
      document.getElementById(`panel-${targetView}`).classList.add("active");

      // Re-trigger render for selected view if necessary
      renderAllViews();
    });
  });

  // Search and filters
  elFilterSearch.addEventListener("input", renderAllViews);
  elFilterCategory.addEventListener("change", renderAllViews);
  elFilterAssignee.addEventListener("change", renderAllViews);

  // Theme Toggle
  document.getElementById("btn-toggle-theme").addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", nextTheme);
    localStorage.setItem("project_theme", nextTheme);
    updateThemeIcon(nextTheme);
  });

  // Task Modal Handlers
  document.getElementById("btn-add-task").addEventListener("click", () => openTaskModal());
  document.getElementById("btn-close-task").addEventListener("click", closeTaskModal);
  document.getElementById("btn-cancel-task").addEventListener("click", closeTaskModal);
  document.getElementById("btn-save-task").addEventListener("click", saveTaskForm);
  document.getElementById("btn-delete-task").addEventListener("click", deleteTask);

  // Category change trigger (detect if they want a new category)
  document.getElementById("task-form-category").addEventListener("change", (e) => {
    if (e.target.value === "__new__") {
      const newCatName = prompt("Masukkan nama kategori baru:");
      if (newCatName && newCatName.trim() !== "") {
        const trimmed = newCatName.trim();
        if (!appCategories.includes(trimmed)) {
          appCategories.push(trimmed);
          localStorage.setItem("project_schedule_categories", JSON.stringify(appCategories));
          populateDropdowns();
        }
        e.target.value = trimmed;
      } else {
        e.target.value = appCategories[0]; // fallback
      }
    }
  });

  // Settings Modal Handlers
  document.getElementById("btn-open-settings").addEventListener("click", () => {
    modalSettings.classList.add("active");
  });
  document.getElementById("btn-close-settings").addEventListener("click", () => {
    modalSettings.classList.remove("active");
  });
  document.getElementById("btn-cancel-settings").addEventListener("click", () => {
    modalSettings.classList.remove("active");
  });
  document.getElementById("btn-save-settings").addEventListener("click", saveSettingsForm);

  // Export ICS
  document.getElementById("btn-export-ics").addEventListener("click", () => {
    const filtered = getFilteredTasks();
    if (filtered.length === 0) {
      alert("Tidak ada tugas yang bisa diekspor.");
      return;
    }
    gcalService.exportToICS(filtered);
  });

  // Sync Google Calendar
  document.getElementById("btn-sync-gcal").addEventListener("click", () => {
    if (!gcalService.hasCredentials()) {
      alert("Harap atur Google API Credentials terlebih dahulu di menu Pengaturan.");
      modalSettings.classList.add("active");
      return;
    }
    
    // Check authentication or trigger sign-in dialog
    gcalService.authenticate(() => {
      triggerGCalSync();
    });
  });

  // Calendar Nav buttons
  document.getElementById("btn-prev-month").addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendarView();
  });
  document.getElementById("btn-next-month").addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendarView();
  });
  document.getElementById("btn-current-month").addEventListener("click", () => {
    currentCalendarDate = new Date(2026, 7, 1); // August 2026 is default current range
    renderCalendarView();
  });

  // Listen to OAuth Auth Success events from gcal.js
  window.addEventListener("gcal-auth-success", () => {
    triggerGCalSync();
  });
}

function getFilteredTasks() {
  const query = elFilterSearch.value.toLowerCase().trim();
  const category = elFilterCategory.value;
  const assignee = elFilterAssignee.value;

  return appTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(query) || (task.notes && task.notes.toLowerCase().includes(query));
    const matchesCat = category === "" || task.category === category;
    const matchesAssignee = assignee === "" || task.assignee === assignee;
    return matchesSearch && matchesCat && matchesAssignee;
  });
}

function renderAllViews() {
  renderDashboardStats();
  
  const activeTab = document.querySelector(".tab-btn.active").getAttribute("data-view");
  if (activeTab === "gantt") renderGanttView();
  else if (activeTab === "kanban") renderKanbanView();
  else if (activeTab === "calendar") renderCalendarView();
  else if (activeTab === "list") renderListView();
}

/* ==========================================================================
   4. GANTT VIEW RENDER ENGINE
   ========================================================================== */

function renderGanttHeaders() {
  elGanttDateHeaderRow.innerHTML = "";
  
  GANTT_DATES.forEach(dateStr => {
    const d = new Date(dateStr);
    const dayNum = d.getDate();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6; // Sun = 0, Sat = 6
    
    // Weekend highlight logic match mockup (dates: 1, 2, 8, 9)
    const weekendClass = isWeekend ? "weekend" : "";
    
    elGanttDateHeaderRow.innerHTML += `
      <th class="date-column-header ${weekendClass}">${dayNum}</th>
    `;
  });
}

function renderGanttView() {
  elGanttTbody.innerHTML = "";
  const filteredTasks = getFilteredTasks();
  
  if (filteredTasks.length === 0) {
    elGanttTbody.innerHTML = `
      <tr>
        <td colspan="${GANTT_DATES.length + 1}" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Tidak ada tugas ditemukan yang cocok dengan kriteria filter.
        </td>
      </tr>
    `;
    return;
  }

  // Group tasks by category
  const tasksByCategory = {};
  appCategories.forEach(cat => {
    tasksByCategory[cat] = filteredTasks.filter(t => t.category === cat);
  });

  // Loop through categories to populate Gantt rows
  Object.keys(tasksByCategory).forEach(cat => {
    const catTasks = tasksByCategory[cat];
    if (catTasks.length === 0) return; // skip empty categories

    // Render Category Header Row
    elGanttTbody.innerHTML += `
      <tr class="gantt-row-category">
        <td colspan="${GANTT_DATES.length + 1}">${cat.toUpperCase()}</td>
      </tr>
    `;

    // Render Task Rows
    catTasks.forEach(task => {
      let rowHtml = `<tr class="gantt-row-task">`;
      rowHtml += `<td class="gantt-task-desc-cell" onclick="openTaskModal('${task.id}')" title="Klik untuk edit tugas">${task.title}</td>`;

      // Loop through columns
      for (let i = 0; i < GANTT_DATES.length; i++) {
        const currentDate = GANTT_DATES[i];
        const isWeekend = new Date(currentDate).getDay() === 0 || new Date(currentDate).getDay() === 6;
        const weekendClass = isWeekend ? "weekend" : "";

        // Check if task starts on this date
        if (currentDate === task.startDate) {
          // Calculate span
          let spanCount = 0;
          let tempIdx = i;
          
          while (tempIdx < GANTT_DATES.length && GANTT_DATES[tempIdx] <= task.endDate) {
            spanCount++;
            tempIdx++;
          }

          // Render task bar spanning colspan
          const assigneeData = INITIAL_ASSIGNEES[task.assignee] || { bgClass: "", name: "" };
          
          rowHtml += `
            <td class="gantt-date-cell ${weekendClass}" colspan="${spanCount}">
              <div class="gantt-bar-wrapper ${assigneeData.bgClass}" onclick="openTaskModal('${task.id}')">
                <span class="gantt-bar-content">${assigneeData.name}</span>
              </div>
            </td>
          `;

          // Skip loop indices that were merged
          i += (spanCount - 1);
        } else {
          // Draw empty cell
          rowHtml += `<td class="gantt-date-cell ${weekendClass}"></td>`;
        }
      }

      rowHtml += `</tr>`;
      elGanttTbody.innerHTML += rowHtml;
    });
  });
}

/* ==========================================================================
   5. KANBAN BOARD VIEW
   ========================================================================== */

function renderKanbanView() {
  elKanbanTodo.innerHTML = "";
  elKanbanProgress.innerHTML = "";
  elKanbanDone.innerHTML = "";

  const filteredTasks = getFilteredTasks();

  let todoCount = 0;
  let progressCount = 0;
  let doneCount = 0;

  filteredTasks.forEach(task => {
    const assigneeData = INITIAL_ASSIGNEES[task.assignee] || { name: "Panitia", color: "var(--accent-color)", textClass: "" };
    
    // Create card element
    const card = document.createElement("div");
    card.className = "kanban-card";
    card.style.setProperty("--card-accent", assigneeData.color);
    card.onclick = () => openTaskModal(task.id);

    card.innerHTML = `
      <div class="kanban-card-category">${task.category}</div>
      <div class="kanban-card-title">${task.title}</div>
      <div class="kanban-card-footer">
        <span class="kanban-card-date">
          <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
          ${formatKanbanDate(task.startDate, task.endDate)}
        </span>
        <span class="kanban-card-assignee ${assigneeData.textClass}">${assigneeData.name}</span>
      </div>
    `;

    // Append to correct column
    if (task.status === "todo") {
      elKanbanTodo.appendChild(card);
      todoCount++;
    } else if (task.status === "in-progress") {
      elKanbanProgress.appendChild(card);
      progressCount++;
    } else if (task.status === "done") {
      elKanbanDone.appendChild(card);
      doneCount++;
    }
  });

  // Update column counters
  elBadgeTodo.textContent = todoCount;
  elBadgeProgress.textContent = progressCount;
  elBadgeDone.textContent = doneCount;

  lucide.createIcons();
}

function formatKanbanDate(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  
  if (start === end) {
    return `${s.getDate()} ${months[s.getMonth()]}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]} - ${e.getDate()} ${months[e.getMonth()]}`;
}

/* ==========================================================================
   6. MONTHLY CALENDAR VIEW
   ========================================================================== */

function renderCalendarView() {
  elCalendarDays.innerHTML = "";
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const monthsIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  elCalendarTitle.textContent = `${monthsIndo[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay(); // day of week for 1st day (0 = Sun, 6 = Sat)
  const lastDayDate = new Date(year, month + 1, 0).getDate(); // last date of this month
  const prevMonthLastDate = new Date(year, month, 0).getDate(); // last date of prev month
  
  const filteredTasks = getFilteredTasks();

  // Grid dates drawing
  // 1. Previous month overlapping dates
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthLastDate - i;
    const currentFullDate = formatDateString(year, month - 1, day);
    renderCalendarDayCell(day, currentFullDate, true);
  }

  // 2. Current Month dates
  for (let day = 1; day <= lastDayDate; day++) {
    const currentFullDate = formatDateString(year, month, day);
    const isToday = checkIsToday(year, month, day);
    renderCalendarDayCell(day, currentFullDate, false, isToday);
  }

  // 3. Next month overlapping dates (pad grid up to multiple of 7)
  const totalDaysSoFar = firstDayIndex + lastDayDate;
  const remainingCells = totalDaysSoFar % 7 === 0 ? 0 : 7 - (totalDaysSoFar % 7);
  for (let day = 1; day <= remainingCells; day++) {
    const currentFullDate = formatDateString(year, month + 1, day);
    renderCalendarDayCell(day, currentFullDate, true);
  }
}

function formatDateString(year, month, day) {
  // Safe normalization of month transitions
  const dateObj = new Date(year, month, day);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function checkIsToday(y, m, d) {
  const today = new Date();
  return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
}

function renderCalendarDayCell(dayNumber, dateString, isOtherMonth, isToday = false) {
  const dateObj = new Date(dateString);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  
  let cellClass = "calendar-day-cell";
  if (isOtherMonth) cellClass += " other-month";
  if (isToday) cellClass += " today";
  if (isWeekend) cellClass += " weekend";

  // Create Cell DOM
  const cell = document.createElement("div");
  cell.className = cellClass;
  cell.setAttribute("data-date", dateString);

  cell.innerHTML = `<span class="calendar-day-number">${dayNumber}</span>`;

  // Find tasks that cover this date
  const activeTasks = getFilteredTasks().filter(task => {
    return dateString >= task.startDate && dateString <= task.endDate;
  });

  // Render event block for each active task
  activeTasks.forEach(task => {
    const assigneeData = INITIAL_ASSIGNEES[task.assignee] || { bgClass: "", name: "" };
    const eventBlock = document.createElement("div");
    eventBlock.className = `calendar-event-block ${assigneeData.bgClass}`;
    eventBlock.textContent = task.title;
    eventBlock.title = `${task.title} (${assigneeData.name})`;
    eventBlock.onclick = (e) => {
      e.stopPropagation();
      openTaskModal(task.id);
    };
    cell.appendChild(eventBlock);
  });

  // Allow clicking on cell to add task on this day
  cell.onclick = () => {
    openTaskModal(null, dateString);
  };

  elCalendarDays.appendChild(cell);
}

/* ==========================================================================
   7. LIST VIEW RENDER TABLE
   ========================================================================== */

function renderListView() {
  elListTbody.innerHTML = "";
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    elListTbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Tidak ada tugas ditemukan yang cocok dengan kriteria filter.
        </td>
      </tr>
    `;
    return;
  }

  filteredTasks.forEach(task => {
    const assigneeData = INITIAL_ASSIGNEES[task.assignee] || { name: "Unassigned", bgClass: "", textClass: "" };
    
    // Status Badge
    let statusBadge = "";
    if (task.status === "todo") statusBadge = `<span class="badge badge-todo">TO DO</span>`;
    else if (task.status === "in-progress") statusBadge = `<span class="badge badge-in-progress">IN PROGRESS</span>`;
    else if (task.status === "done") statusBadge = `<span class="badge badge-done">COMPLETED</span>`;

    // Format Dates nicely
    const formatStrDate = (str) => {
      const d = new Date(str);
      return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    };

    elListTbody.innerHTML += `
      <tr class="list-row">
        <td style="font-weight: 600;">${task.title}</td>
        <td>${task.category}</td>
        <td><span class="badge ${assigneeData.textClass}">${assigneeData.name}</span></td>
        <td>${formatStrDate(task.startDate)}</td>
        <td>${formatStrDate(task.endDate)}</td>
        <td>${statusBadge}</td>
        <td style="color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${task.notes || "-"}</td>
        <td style="text-align: center;">
          <button class="btn-icon" onclick="openTaskModal('${task.id}')" style="width: 1.8rem; height: 1.8rem; border-radius: 4px;" title="Edit">
            <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
          </button>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

/* ==========================================================================
   8. TASK CREATION / EDITING MODAL
   ========================================================================== */

function openTaskModal(taskId = null, defaultStartDate = null) {
  const form = document.getElementById("form-task");
  form.reset();

  const titleEl = document.getElementById("modal-task-title");
  const deleteBtn = document.getElementById("btn-delete-task");
  
  if (taskId) {
    // Edit existing task
    const task = appTasks.find(t => t.id === taskId);
    if (!task) return;

    titleEl.innerHTML = `<i data-lucide="edit-3"></i> Edit Tugas`;
    document.getElementById("task-form-id").value = task.id;
    document.getElementById("task-form-title").value = task.title;
    document.getElementById("task-form-category").value = task.category;
    document.getElementById("task-form-assignee").value = task.assignee;
    document.getElementById("task-form-start-date").value = task.startDate;
    document.getElementById("task-form-end-date").value = task.endDate;
    document.getElementById("task-form-status").value = task.status;
    document.getElementById("task-form-notes").value = task.notes || "";

    deleteBtn.style.display = "inline-flex";
  } else {
    // New task
    titleEl.innerHTML = `<i data-lucide="plus-circle"></i> Tambah Tugas Baru`;
    document.getElementById("task-form-id").value = "";
    document.getElementById("task-form-category").value = appCategories[0];
    document.getElementById("task-form-status").value = "todo";
    
    // Auto-fill dates
    const todayStr = defaultStartDate || new Date().toISOString().split("T")[0];
    document.getElementById("task-form-start-date").value = todayStr;
    document.getElementById("task-form-end-date").value = todayStr;

    deleteBtn.style.display = "none";
  }

  lucide.createIcons();
  modalTask.classList.add("active");
}

function closeTaskModal() {
  modalTask.classList.remove("active");
}

function saveTaskForm(e) {
  e.preventDefault();
  
  const id = document.getElementById("task-form-id").value;
  const title = document.getElementById("task-form-title").value.trim();
  const category = document.getElementById("task-form-category").value;
  const assignee = document.getElementById("task-form-assignee").value;
  const startDate = document.getElementById("task-form-start-date").value;
  const endDate = document.getElementById("task-form-end-date").value;
  const status = document.getElementById("task-form-status").value;
  const notes = document.getElementById("task-form-notes").value.trim();

  if (!title) {
    alert("Harap masukkan nama tugas.");
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    alert("Tanggal selesai tidak boleh mendahului tanggal mulai.");
    return;
  }

  if (id) {
    // Update existing
    const taskIndex = appTasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      appTasks[taskIndex] = { id, title, category, assignee, startDate, endDate, status, notes };
    }
  } else {
    // Create new task
    const newId = "task-" + Date.now();
    appTasks.push({ id: newId, title, category, assignee, startDate, endDate, status, notes });
  }

  saveTasksToLocalStorage();
  closeTaskModal();
  renderAllViews();
}

function deleteTask() {
  const id = document.getElementById("task-form-id").value;
  if (!id) return;

  if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
    appTasks = appTasks.filter(t => t.id !== id);
    saveTasksToLocalStorage();
    closeTaskModal();
    renderAllViews();
  }
}

/* ==========================================================================
   9. GOOGLE CALENDAR CONFIGURATION FORM
   ========================================================================== */

function loadSettingsForm() {
  document.getElementById("setting-client-id").value = gcalService.clientId;
  document.getElementById("setting-api-key").value = gcalService.apiKey;
  document.getElementById("setting-calendar-id").value = gcalService.calendarId;
}

function saveSettingsForm(e) {
  e.preventDefault();

  const clientId = document.getElementById("setting-client-id").value.trim();
  const apiKey = document.getElementById("setting-api-key").value.trim();
  const calendarId = document.getElementById("setting-calendar-id").value.trim() || "primary";

  if (!clientId || !apiKey) {
    alert("Klien ID dan API Key tidak boleh kosong.");
    return;
  }

  gcalService.updateCredentials(clientId, apiKey, calendarId);
  modalSettings.classList.remove("active");
  alert("Pengaturan kredensial Google API berhasil disimpan!");
}

/* ==========================================================================
   10. GCAL GOOGLE SYNC LOADER & CONTROLLERS
   ========================================================================== */

async function triggerGCalSync() {
  const tasksToSync = getFilteredTasks();
  if (tasksToSync.length === 0) {
    alert("Tidak ada tugas yang memenuhi filter untuk disinkronkan.");
    return;
  }

  if (!confirm(`Apakah Anda ingin mensinkronkan ${tasksToSync.length} tugas langsung ke Google Calendar?`)) {
    return;
  }

  // Open Sync Loader Modal
  modalSyncProgress.classList.add("active");
  const titleEl = document.getElementById("sync-progress-title");
  const detailEl = document.getElementById("sync-progress-detail");
  const fillEl = document.getElementById("sync-progress-fill");

  fillEl.style.width = "0%";
  detailEl.textContent = `Tugas 0 dari ${tasksToSync.length}`;

  try {
    const result = await gcalService.syncTasks(tasksToSync, (current, total, taskName) => {
      const percentage = Math.round((current / total) * 100);
      fillEl.style.width = `${percentage}%`;
      titleEl.textContent = `Mengunggah: ${taskName}`;
      detailEl.textContent = `Tugas ${current + 1} dari ${total}`;
    });

    modalSyncProgress.classList.remove("active");
    
    // Status Report Dialog
    alert(`Sinkronisasi Selesai!\n\nBerhasil diekspor: ${result.successCount} tugas\nGagal: ${result.failCount} tugas`);
  } catch (e) {
    console.error("GCal Sync Process Failed:", e);
    modalSyncProgress.classList.remove("active");
    alert("Sinkronisasi gagal. Pastikan API Key / Client ID Anda valid dan Anda telah memberikan izin akses.");
  }
}
