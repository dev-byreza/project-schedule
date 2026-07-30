/**
 * Google Apps Script Web App Backend
 * Project: Project Schedule Dashboard & Calendar Integration
 * Database: Google Sheets ("Project Schedule Database")
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Project Schedule Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Called by frontend on startup to ensure the database (Spreadsheet) is ready.
 * Creates and seeds the spreadsheet if it doesn't exist yet.
 * Also seeds initial data if sheets are empty.
 */
function setupDatabase() {
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      throw new Error("Could not access or create the spreadsheet database.");
    }

    // Ensure all required sheets exist
    var tasksSheet = getTasksSheet(ss);
    var categoriesSheet = getCategoriesSheet(ss);
    var projectsSheet = getProjectsSheet(ss);
    var assigneesSheet = getAssigneesSheet(ss);

    // Seed Projects if empty
    if (projectsSheet.getLastRow() <= 1) {
      var initProjects = getInitialProjects();
      for (var p = 0; p < initProjects.length; p++) {
        projectsSheet.appendRow([initProjects[p]]);
      }
    }

    // Seed Categories if empty
    if (categoriesSheet.getLastRow() <= 1) {
      var initCats = getInitialCategories();
      for (var c = 0; c < initCats.length; c++) {
        categoriesSheet.appendRow([initCats[c]]);
      }
    }

    // Seed Assignees if empty
    if (assigneesSheet.getLastRow() <= 1) {
      var initAssignees = getInitialAssigneesList();
      for (var a = 0; a < initAssignees.length; a++) {
        assigneesSheet.appendRow([initAssignees[a].id, initAssignees[a].name, initAssignees[a].color]);
      }
    }

    // Seed Tasks if empty
    if (tasksSheet.getLastRow() <= 1) {
      var initTasks = getInitialTasks();
      var defaultProject = getInitialProjects()[0];
      for (var t = 0; t < initTasks.length; t++) {
        var task = initTasks[t];
        tasksSheet.appendRow([
          task.id, task.title, task.category, task.assignee,
          task.startDate, task.endDate, task.status, task.notes || "",
          defaultProject
        ]);
      }
    }

    return true;
  } catch(e) {
    Logger.log("setupDatabase error: " + e.message);
    throw e;
  }
}

/**
 * 1. Database Connection & Self-Healing Setup
 */
function getSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    // Not bound
  }
  
  if (!ss) {
    var props = PropertiesService.getScriptProperties();
    var ssId = props.getProperty('spreadsheetId');
    if (ssId) {
      try {
        ss = SpreadsheetApp.openById(ssId);
      } catch (e) {
        // Invalid ID or deleted
      }
    }
  }
  
  if (!ss) {
    // Look in Drive
    try {
      var files = DriveApp.getFilesByName("Project Schedule Database");
      if (files.hasNext()) {
        var file = files.next();
        ss = SpreadsheetApp.open(file);
        PropertiesService.getScriptProperties().setProperty('spreadsheetId', ss.getId());
      } else {
        // Create a new spreadsheet!
        ss = SpreadsheetApp.create("Project Schedule Database");
        PropertiesService.getScriptProperties().setProperty('spreadsheetId', ss.getId());
        initializeSpreadsheet(ss);
      }
    } catch(err) {
      Logger.log("Error finding/creating spreadsheet: " + err.message);
    }
  }
  
  return ss;
}

function initializeSpreadsheet(ss) {
  // Tasks Sheet
  var tasksSheet = ss.getSheets()[0];
  tasksSheet.setName("Tasks");
  tasksSheet.appendRow(["ID", "Title", "Category", "Assignee", "Start Date", "End Date", "Status", "Notes", "Project"]);
  
  var initialTasks = getInitialTasks();
  for (var i = 0; i < initialTasks.length; i++) {
    var task = initialTasks[i];
    tasksSheet.appendRow([
      task.id,
      task.title,
      task.category,
      task.assignee,
      task.startDate,
      task.endDate,
      task.status,
      task.notes || "",
      "Wisuda XXXIII" // Seed default project
    ]);
  }
  
  // Categories Sheet
  var categoriesSheet = ss.insertSheet("Categories");
  categoriesSheet.appendRow(["Category Name"]);
  var initialCategories = getInitialCategories();
  for (var j = 0; j < initialCategories.length; j++) {
    categoriesSheet.appendRow([initialCategories[j]]);
  }
  
  // Projects Sheet
  var projectsSheet = ss.insertSheet("Projects");
  projectsSheet.appendRow(["Project Name"]);
  projectsSheet.appendRow(["Wisuda XXXIII"]);
  
  // Assignees Sheet
  var assigneesSheet = ss.insertSheet("Assignees");
  assigneesSheet.appendRow(["ID", "Name", "Color"]);
  var initialAssignees = getInitialAssigneesList();
  for (var k = 0; k < initialAssignees.length; k++) {
    assigneesSheet.appendRow([
      initialAssignees[k].id,
      initialAssignees[k].name,
      initialAssignees[k].color
    ]);
  }
  
  // Format headers
  tasksSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  tasksSheet.setFrozenRows(1);
  
  categoriesSheet.getRange(1, 1, 1, 1).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  categoriesSheet.setFrozenRows(1);
  
  projectsSheet.getRange(1, 1, 1, 1).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  projectsSheet.setFrozenRows(1);
  
  assigneesSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  assigneesSheet.setFrozenRows(1);
}

function getTasksSheet(ss) {
  var sheet = ss.getSheetByName("Tasks");
  if (!sheet) {
    sheet = ss.insertSheet("Tasks");
    sheet.appendRow(["ID", "Title", "Category", "Assignee", "Start Date", "End Date", "Status", "Notes", "Project"]);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getCategoriesSheet(ss) {
  var sheet = ss.getSheetByName("Categories");
  if (!sheet) {
    sheet = ss.insertSheet("Categories");
    sheet.appendRow(["Category Name"]);
    sheet.getRange(1, 1, 1, 1).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getProjectsSheet(ss) {
  var sheet = ss.getSheetByName("Projects");
  if (!sheet) {
    sheet = ss.insertSheet("Projects");
    sheet.appendRow(["Project Name"]);
    sheet.getRange(1, 1, 1, 1).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.appendRow(["Wisuda XXXIII"]); // Seed default project
  }
  return sheet;
}

function getAssigneesSheet(ss) {
  var sheet = ss.getSheetByName("Assignees");
  if (!sheet) {
    sheet = ss.insertSheet("Assignees");
    sheet.appendRow(["ID", "Name", "Color"]);
    sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    
    // Seed default assignees
    var initialAssignees = getInitialAssigneesList();
    for (var k = 0; k < initialAssignees.length; k++) {
      sheet.appendRow([
        initialAssignees[k].id,
        initialAssignees[k].name,
        initialAssignees[k].color
      ]);
    }
  }
  return sheet;
}

/**
 * 2. CRUD APIs mapped to Google Sheets
 */
function getTasks() {
  var ss = getSpreadsheet();
  if (!ss) return getInitialTasks();
  
  var sheet = getTasksSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    // Sheet is empty - return initial seed data
    return getInitialTasks().map(function(t) {
      return {
        id: t.id, title: t.title, category: t.category,
        assignee: t.assignee, startDate: t.startDate, endDate: t.endDate,
        status: t.status, notes: t.notes || "", project: getInitialProjects()[0]
      };
    });
  }
  
  var lastCol = sheet.getLastColumn();
  // Fetch up to column 9 (Project)
  var values = sheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, 9)).getValues();
  var tasks = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    
    var startDateStr = "";
    if (row[4] instanceof Date) {
      startDateStr = Utilities.formatDate(row[4], Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      startDateStr = String(row[4]);
    }
    
    var endDateStr = "";
    if (row[5] instanceof Date) {
      endDateStr = Utilities.formatDate(row[5], Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      endDateStr = String(row[5]);
    }
    
    var projects = getProjects();
    var defaultProject = projects.length > 0 ? projects[0] : "Wisuda XXXIII";
    var projectStr = defaultProject;
    if (row.length >= 9 && row[8] !== undefined && String(row[8]).trim() !== "") {
      var val = String(row[8]).trim();
      if (val !== "" && (projects.length === 0 || projects.indexOf(val) !== -1)) {
        projectStr = val;
      }
    }
    
    tasks.push({
      id: String(row[0]),
      title: String(row[1]),
      category: String(row[2]),
      assignee: String(row[3]),
      startDate: startDateStr,
      endDate: endDateStr,
      status: String(row[6]),
      notes: String(row[7]),
      project: projectStr
    });
  }
  return tasks;
}

function saveTasks(tasks) {
  var ss = getSpreadsheet();
  if (!ss) return false;
  if (!tasks || !Array.isArray(tasks)) return false;
  
  var sheet = getTasksSheet(ss);
  var lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 9).clearContent();
  }
  
  if (tasks.length === 0) {
    return true;
  }
  
  var projects = getProjects();
  var defaultProject = projects.length > 0 ? projects[0] : "Wisuda XXXIII";
  
  var rows = [];
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    rows.push([
      task.id,
      task.title,
      task.category,
      task.assignee,
      task.startDate,
      task.endDate,
      task.status,
      task.notes || "",
      task.project || defaultProject
    ]);
  }
  
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  return true;
}

function getCategories() {
  var ss = getSpreadsheet();
  if (!ss) return getInitialCategories();
  
  var sheet = getCategoriesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return getInitialCategories();
  }
  
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var categories = [];
  for (var i = 0; i < values.length; i++) {
    categories.push(String(values[i][0]));
  }
  return categories;
}

function saveCategories(categories) {
  var ss = getSpreadsheet();
  if (!ss) return false;
  
  var sheet = getCategoriesSheet(ss);
  var lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).clearContent();
  }
  
  if (categories.length === 0) {
    return true;
  }
  
  var rows = [];
  for (var i = 0; i < categories.length; i++) {
    rows.push([categories[i]]);
  }
  
  sheet.getRange(2, 1, rows.length, 1).setValues(rows);
  return true;
}

function getProjects() {
  var ss = getSpreadsheet();
  if (!ss) return getInitialProjects();
  
  var sheet = getProjectsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return getInitialProjects();
  }
  
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var projects = [];
  for (var i = 0; i < values.length; i++) {
    projects.push(String(values[i][0]));
  }
  return projects;
}

function saveProjects(projects) {
  var ss = getSpreadsheet();
  if (!ss) return false;
  
  var sheet = getProjectsSheet(ss);
  var lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).clearContent();
  }
  
  if (projects.length === 0) {
    return true;
  }
  
  var rows = [];
  for (var i = 0; i < projects.length; i++) {
    rows.push([projects[i]]);
  }
  
  sheet.getRange(2, 1, rows.length, 1).setValues(rows);
  return true;
}

function getAssignees() {
  var ss = getSpreadsheet();
  if (!ss) return getInitialAssigneesList();
  
  var sheet = getAssigneesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return getInitialAssigneesList();
  }
  
  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    list.push({
      id: String(values[i][0]),
      name: String(values[i][1]),
      color: String(values[i][2])
    });
  }
  return list;
}

function saveAssignees(list) {
  var ss = getSpreadsheet();
  if (!ss) return false;
  
  var sheet = getAssigneesSheet(ss);
  var lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
  }
  
  if (list.length === 0) {
    return true;
  }
  
  var rows = [];
  for (var i = 0; i < list.length; i++) {
    rows.push([
      list[i].id,
      list[i].name,
      list[i].color
    ]);
  }
  
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  return true;
}

function getCalendarId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('calendarId') || 'primary';
}

function saveCalendarId(calendarId) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('calendarId', calendarId || 'primary');
  return true;
}

function getDatabaseUrl() {
  var ss = getSpreadsheet();
  return ss ? ss.getUrl() : "";
}

/**
 * 3. Native Google Calendar Sync
 */
function syncTasksToGoogleCalendarServer(tasks, calendarId) {
  var targetCalendarId = calendarId || 'primary';
  var calendar;
  
  try {
    calendar = CalendarApp.getCalendarById(targetCalendarId);
  } catch (e) {
    calendar = CalendarApp.getDefaultCalendar();
  }
  
  if (!calendar) {
    throw new Error("Calendar not found or access denied. Please verify your calendar permissions.");
  }
  
  var projects = getProjects();
  var defaultProject = projects.length > 0 ? projects[0] : "Wisuda XXXIII";
  
  var successCount = 0;
  var failCount = 0;
  
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    try {
      var startDate = new Date(task.startDate);
      var endDate = new Date(task.endDate);
      endDate.setDate(endDate.getDate() + 1); // Exclusive end date for Google Calendar All-Day event
      
      var eventTitle = "[Schedule] " + task.title;
      
      var searchStart = new Date(task.startDate);
      var searchEnd = new Date(task.startDate);
      searchEnd.setDate(searchEnd.getDate() + 2);
      
      var events = calendar.getEvents(searchStart, searchEnd);
      var existingEvent = null;
      for (var j = 0; j < events.length; j++) {
        if (events[j].getTitle() === eventTitle) {
          existingEvent = events[j];
          break;
        }
      }
      
      var description = "Project: " + (task.project || defaultProject) +
                        "\nKategori: " + task.category + 
                        "\nPenanggung Jawab: " + (task.assignee || "Unassigned") + 
                        "\nStatus: " + task.status.toUpperCase() + 
                        "\nCatatan: " + (task.notes || "-");
      
      if (existingEvent) {
        existingEvent.setDescription(description);
        existingEvent.setTime(startDate, endDate);
      } else {
        calendar.createAllDayEvent(eventTitle, startDate, endDate, {
          description: description
        });
      }
      successCount++;
    } catch (e) {
      failCount++;
    }
  }
  
  return { successCount: successCount, failCount: failCount };
}

/**
 * 4. Default Seed Data
 */
function getInitialProjects() {
  return ["Wisuda XXXIII"];
}

function getInitialCategories() {
  return [
    "Paket Wisudawan",
    "Orasi Ilmiah",
    "Wisuda XXXIII"
  ];
}

function getInitialAssigneesList() {
  return [
    { id: "reza", name: "REZA FEBRIADI", color: "#f59e0b" },
    { id: "annas", name: "KAK ANNAS", color: "#38bdf8" },
    { id: "timmhs", name: "TIM MHS", color: "#10b981" }
  ];
}

function getInitialTasks() {
  return [
    {
      id: "task-1",
      title: "Slide Wisudawan (Reza)",
      category: "Paket Wisudawan",
      assignee: "reza",
      startDate: "2026-08-10",
      endDate: "2026-08-11",
      status: "in-progress",
      notes: "Persiapan slide untuk wisudawan berprestasi."
    },
    {
      id: "task-2",
      title: "Slide Wisudawan (Tim MHS)",
      category: "Paket Wisudawan",
      assignee: "timmhs",
      startDate: "2026-08-12",
      endDate: "2026-08-14",
      status: "todo",
      notes: "Finalisasi slide dan review bersama panitia."
    },
    {
      id: "task-3",
      title: "Plakat Wisudawan Terbaik",
      category: "Paket Wisudawan",
      assignee: "reza",
      startDate: "2026-07-30",
      endDate: "2026-07-30",
      status: "done",
      notes: "Desain plakat acrylic wisudawan terbaik."
    },
    {
      id: "task-4",
      title: "Selempang Wisudawan Terbaik",
      category: "Paket Wisudawan",
      assignee: "reza",
      startDate: "2026-07-30",
      endDate: "2026-07-30",
      status: "done",
      notes: "Pemesanan dan desain selempang bordir emas."
    },
    {
      id: "task-5",
      title: "Undangan Orasi Ilmiah",
      category: "Orasi Ilmiah",
      assignee: "annas",
      startDate: "2026-08-10",
      endDate: "2026-08-10",
      status: "todo",
      notes: "Distribusi undangan digital untuk orasi ilmiah."
    },
    {
      id: "task-6",
      title: "Backdrop Orasi (Reza)",
      category: "Orasi Ilmiah",
      assignee: "reza",
      startDate: "2026-08-05",
      endDate: "2026-08-05",
      status: "in-progress",
      notes: "Desain awal backdrop panggung orasi ilmiah."
    },
    {
      id: "task-7",
      title: "Backdrop Orasi (Kak Annas)",
      category: "Orasi Ilmiah",
      assignee: "annas",
      startDate: "2026-08-06",
      endDate: "2026-08-06",
      status: "todo",
      notes: "Review desain and pengiriman file cetak backdrop."
    },
    {
      id: "task-8",
      title: "Undangan Wisuda XXXIII",
      category: "Wisuda XXXIII",
      assignee: "reza",
      startDate: "2026-08-12",
      endDate: "2026-08-14",
      status: "todo",
      notes: "Desain dan distribusi undangan utama wisuda."
    },
    {
      id: "task-9",
      title: "Video Background Wisuda",
      category: "Wisuda XXXIII",
      assignee: "reza",
      startDate: "2026-07-31",
      endDate: "2026-08-10",
      status: "in-progress",
      notes: "Editing loop background video untuk LED screen utama."
    },
    {
      id: "task-10",
      title: "Spanduk Selamat Datang",
      category: "Wisuda XXXIII",
      assignee: "annas",
      startDate: "2026-08-13",
      endDate: "2026-08-13",
      status: "todo",
      notes: "Desain spanduk gerbang utama lokasi wisuda."
    },
    {
      id: "task-11",
      title: "Spanduk Foto Booth",
      category: "Wisuda XXXIII",
      assignee: "annas",
      startDate: "2026-08-12",
      endDate: "2026-08-12",
      status: "todo",
      notes: "Desain backdrop area photo booth wisudawan."
    },
    {
      id: "task-12",
      title: "Stand Banner TA",
      category: "Wisuda XXXIII",
      assignee: "timmhs",
      startDate: "2026-08-03",
      endDate: "2026-08-07",
      status: "todo",
      notes: "Desain dan layout stand banner Tugas Akhir."
    },
    {
      id: "task-13",
      title: "Video Sejarah Singkat Poliwako",
      category: "Wisuda XXXIII",
      assignee: "timmhs",
      startDate: "2026-08-03",
      endDate: "2026-08-07",
      status: "todo",
      notes: "Pembuatan bumper video sejarah perkembangan kampus Poliwako."
    }
  ];
}

function saveAllData(tasks, categories, projects, assignees) {
  if (tasks !== undefined && tasks !== null) saveTasks(tasks);
  if (categories !== undefined && categories !== null) saveCategories(categories);
  if (projects !== undefined && projects !== null) saveProjects(projects);
  if (assignees !== undefined && assignees !== null) saveAssignees(assignees);
  return true;
}
