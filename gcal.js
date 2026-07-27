/**
 * Google Calendar Integration and ICS File Generator
 */

class GoogleCalendarService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.clientId = localStorage.getItem("gcal_client_id") || "";
    this.apiKey = localStorage.getItem("gcal_api_key") || "";
    this.calendarId = localStorage.getItem("gcal_calendar_id") || "primary";
    
    // Check if GIS is loaded
    this.gisLoaded = typeof google !== "undefined" && google.accounts && google.accounts.oauth2;
  }

  updateCredentials(clientId, apiKey, calendarId) {
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.calendarId = calendarId || "primary";
    
    localStorage.setItem("gcal_client_id", clientId);
    localStorage.setItem("gcal_api_key", apiKey);
    localStorage.setItem("gcal_calendar_id", this.calendarId);
    
    this.initTokenClient();
  }

  hasCredentials() {
    return this.clientId && this.apiKey;
  }

  initTokenClient() {
    if (!this.clientId) return;
    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: "https://www.googleapis.com/auth/calendar.events",
        callback: (response) => {
          if (response.error !== undefined) {
            console.error("GIS Authentication Error:", response);
            alert("Gagal melakukan autentikasi: " + response.error);
            return;
          }
          this.accessToken = response.access_token;
          localStorage.setItem("gcal_access_token", this.accessToken);
          
          // Notify app that we are authenticated and ready to sync
          window.dispatchEvent(new CustomEvent("gcal-auth-success"));
        },
      });
    } catch (e) {
      console.error("Failed to initialize Google Identity token client:", e);
    }
  }

  authenticate(callback) {
    if (!this.clientId) {
      alert("Harap atur Google Client ID terlebih dahulu di menu Pengaturan.");
      return;
    }
    
    // If we already have a valid token, we can proceed
    if (this.accessToken) {
      if (callback) callback();
      return;
    }

    if (!this.tokenClient) {
      this.initTokenClient();
    }

    if (this.tokenClient) {
      // Request access token (forces interactive dialog if needed)
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      alert("Gagal memuat Google SDK. Silakan periksa koneksi internet Anda atau matikan ad-blocker.");
    }
  }

  signOut() {
    if (this.accessToken) {
      google.accounts.oauth2.revokeToken(this.accessToken, () => {
        console.log("Token revoked");
      });
      this.accessToken = null;
      localStorage.removeItem("gcal_access_token");
      window.dispatchEvent(new CustomEvent("gcal-signed-out"));
    }
  }

  /**
   * Sync tasks directly to Google Calendar using REST API
   * @param {Array} tasks - List of task objects
   * @param {Function} progressCallback - Callback to show sync progress
   * @returns {Promise} Resolves when all tasks are synced
   */
  async syncTasks(tasks, progressCallback) {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (progressCallback) {
        progressCallback(i, tasks.length, task.title);
      }

      // Convert local date to exclusive end date for Google Calendar All-Day event
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      endDate.setDate(endDate.getDate() + 1); // exclusive end

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const assigneeName = INITIAL_ASSIGNEES[task.assignee]?.name || "Unassigned";

      const event = {
        summary: `[Schedule] ${task.title}`,
        description: `Kategori: ${task.category}\nPenanggung Jawab: ${assigneeName}\nStatus: ${task.status.toUpperCase()}\nCatatan: ${task.notes || "-"}`,
        start: {
          date: formattedStartDate
        },
        end: {
          date: formattedEndDate
        },
        colorId: this.getGoogleCalendarColorId(task.assignee),
        status: task.status === "done" ? "confirmed" : "tentative"
      };

      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events?key=${this.apiKey}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(event)
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          console.error("GCal Sync Failed for task:", task.title, errData);
          failCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        console.error("Fetch error during GCal sync:", e);
        failCount++;
      }
    }

    return { successCount, failCount };
  }

  /**
   * Map assignees to Google Calendar event colorIds
   * Reza -> Yellow (colorId 5 - Banana)
   * Kak Annas -> Blue (colorId 9 - Blueberry)
   * Tim MHS -> Green (colorId 2 - Sage)
   */
  getGoogleCalendarColorId(assigneeId) {
    switch (assigneeId) {
      case "reza": return "5"; // Yellow
      case "annas": return "9"; // Blueberry
      case "timmhs": return "2"; // Green (Sage)
      default: return "1"; // Lavender
    }
  }

  /**
   * Generate and trigger browser download of .ics calendar file
   * @param {Array} tasks - List of task objects
   */
  exportToICS(tasks) {
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MasterCAD//Project Schedule Manager//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    tasks.forEach(task => {
      // Setup dates (ICS expects YYYYMMDD for VALUE=DATE)
      const startDate = task.startDate.replace(/-/g, "");
      
      // Calculate exclusive end date
      const end = new Date(task.endDate);
      end.setDate(end.getDate() + 1);
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, "0");
      const day = String(end.getDate()).padStart(2, "0");
      const endDate = `${year}${month}${day}`;

      const assigneeName = INITIAL_ASSIGNEES[task.assignee]?.name || "Unassigned";
      const uid = `task-${task.id}-${startDate}@mastercad.project.schedule`;

      // Clean notes for ICS format (escape newlines, commas, semi-colons)
      let desc = `Kategori: ${task.category}\\nPJ: ${assigneeName}\\nStatus: ${task.status.toUpperCase()}`;
      if (task.notes) {
        desc += `\\nCatatan: ${task.notes.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")}`;
      }

      icsContent.push("BEGIN:VEVENT");
      icsContent.push(`UID:${uid}`);
      icsContent.push(`DTSTAMP:${this.getFormattedNowICS()}`);
      icsContent.push(`DTSTART;VALUE=DATE:${startDate}`);
      icsContent.push(`DTEND;VALUE=DATE:${endDate}`);
      icsContent.push(`SUMMARY:[Schedule] ${task.title.replace(/,/g, "\\,")}`);
      icsContent.push(`DESCRIPTION:${desc}`);
      icsContent.push("STATUS:" + (task.status === "done" ? "CONFIRMED" : "TENTATIVE"));
      icsContent.push("END:VEVENT");
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `project-schedule-${new Date().toISOString().split("T")[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getFormattedNowICS() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const hour = String(now.getUTCHours()).padStart(2, "0");
    const min = String(now.getUTCMinutes()).padStart(2, "0");
    const sec = String(now.getUTCSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hour}${min}${sec}Z`;
  }
}

const gcalService = new GoogleCalendarService();
