/**
 * Default Project Schedule Data
 * Pre-populated with the schedule from the provided spreadsheet mockup.
 * Date Scope: July 30, 2026 to August 14, 2026.
 */

const INITIAL_CATEGORIES = [
  "Paket Wisudawan",
  "Orasi Ilmiah",
  "Wisuda XXXII"
];

const INITIAL_ASSIGNEES = {
  "reza": {
    id: "reza",
    name: "REZA FEBRIADI",
    color: "var(--color-assignee-reza)",
    bgClass: "assignee-reza-bg",
    textClass: "assignee-reza-text"
  },
  "annas": {
    id: "annas",
    name: "KAK ANNAS",
    color: "var(--color-assignee-annas)",
    bgClass: "assignee-annas-bg",
    textClass: "assignee-annas-text"
  },
  "timmhs": {
    id: "timmhs",
    name: "TIM MHS",
    color: "var(--color-assignee-timmhs)",
    bgClass: "assignee-timmhs-bg",
    textClass: "assignee-timmhs-text"
  }
};

const INITIAL_TASKS = [
  // Paket Wisudawan
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

  // Orasi Ilmiah
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
    notes: "Review desain dan pengiriman file cetak backdrop."
  },

  // Wisuda XXXII
  {
    id: "task-8",
    title: "Undangan Wisuda XXXII",
    category: "Wisuda XXXII",
    assignee: "reza",
    startDate: "2026-08-12",
    endDate: "2026-08-14",
    status: "todo",
    notes: "Desain dan distribusi undangan utama wisuda."
  },
  {
    id: "task-9",
    title: "Video Background Wisuda",
    category: "Wisuda XXXII",
    assignee: "reza",
    startDate: "2026-07-31",
    endDate: "2026-08-10",
    status: "in-progress",
    notes: "Editing loop background video untuk LED screen utama."
  },
  {
    id: "task-10",
    title: "Spanduk Selamat Datang",
    category: "Wisuda XXXII",
    assignee: "annas",
    startDate: "2026-08-13",
    endDate: "2026-08-13",
    status: "todo",
    notes: "Desain spanduk gerbang utama lokasi wisuda."
  },
  {
    id: "task-11",
    title: "Spanduk Foto Booth",
    category: "Wisuda XXXII",
    assignee: "annas",
    startDate: "2026-08-12",
    endDate: "2026-08-12",
    status: "todo",
    notes: "Desain backdrop area photo booth wisudawan."
  },
  {
    id: "task-12",
    title: "Stand Banner TA",
    category: "Wisuda XXXII",
    assignee: "timmhs",
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    status: "todo",
    notes: "Desain dan layout stand banner Tugas Akhir."
  },
  {
    id: "task-13",
    title: "Video Sejarah Singkat Poliwako",
    category: "Wisuda XXXII",
    assignee: "timmhs",
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    status: "todo",
    notes: "Pembuatan bumper video sejarah perkembangan kampus Poliwako."
  }
];
