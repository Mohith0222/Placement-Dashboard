const storageKey = "placementMetricsStudents";
const adminStorageKey = "placementAdminAccount";
const sessionStorageKey = "placementAdminSession";
const defaultAdminAccount = { username: "admin", password: "admin123" };

function ensureAdminAccount() {
  try {
    const account = JSON.parse(localStorage.getItem(adminStorageKey));
    if (account && typeof account.username === "string" && typeof account.password === "string") {
      return;
    }
  } catch {
    localStorage.removeItem(adminStorageKey);
  }

  localStorage.setItem(adminStorageKey, JSON.stringify(defaultAdminAccount));
}

ensureAdminAccount();

if (localStorage.getItem(sessionStorageKey) !== "active") {
  window.location.href = "login.html";
}

const studentForm = document.getElementById("studentForm");
const studentIdInput = document.getElementById("studentId");
const studentNameInput = document.getElementById("studentName");
const rollNoInput = document.getElementById("rollNo");
const cgpaInput = document.getElementById("cgpa");
const skillsInput = document.getElementById("skills");
const placementStatusInput = document.getElementById("placementStatus");
const tableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const cgpaFilter = document.getElementById("cgpaFilter");
const skillFilter = document.getElementById("skillFilter");
const sortSelect = document.getElementById("sortSelect");
const totalStudents = document.getElementById("totalStudents");
const placedStudents = document.getElementById("placedStudents");
const averageCgpa = document.getElementById("averageCgpa");
const resultCount = document.getElementById("resultCount");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const loadSampleBtn = document.getElementById("loadSampleBtn");
const downloadReportBtn = document.getElementById("downloadReportBtn");
const logoutBtn = document.getElementById("logoutBtn");
const placementChartCanvas = document.getElementById("placementChart");
const cgpaChartCanvas = document.getElementById("cgpaChart");

const formErrors = {
  name: document.getElementById("studentNameError"),
  rollNo: document.getElementById("rollNoError"),
  cgpa: document.getElementById("cgpaError"),
  skills: document.getElementById("skillsError"),
  placementStatus: document.getElementById("placementStatusError"),
  summary: document.getElementById("formSummaryError"),
};

let students = loadStudents();
let placementChart;
let cgpaChart;

const sampleStudents = [
  {
    id: "sample-001",
    name: "Aarav Sharma",
    rollNo: "CSE2026001",
    cgpa: 8.74,
    skills: "JavaScript, React, SQL",
    placementStatus: "Placed",
  },
  {
    id: "sample-002",
    name: "Diya Patel",
    rollNo: "CSE2026002",
    cgpa: 9.12,
    skills: "Python, Machine Learning, Pandas",
    placementStatus: "Placed",
  },
  {
    id: "sample-003",
    name: "Kabir Verma",
    rollNo: "ECE2026008",
    cgpa: 7.45,
    skills: "Java, Spring Boot, MySQL",
    placementStatus: "Not Placed",
  },
  {
    id: "sample-004",
    name: "Ananya Rao",
    rollNo: "IT2026014",
    cgpa: 8.33,
    skills: "HTML, CSS, UI Design",
    placementStatus: "Placed",
  },
  {
    id: "sample-005",
    name: "Rohan Mehta",
    rollNo: "CSE2026021",
    cgpa: 6.82,
    skills: "C++, DSA, Git",
    placementStatus: "Not Placed",
  },
  {
    id: "sample-006",
    name: "Meera Nair",
    rollNo: "AIML2026027",
    cgpa: 9.35,
    skills: "Deep Learning, Python, TensorFlow",
    placementStatus: "Placed",
  },
  {
    id: "sample-007",
    name: "Ishaan Gupta",
    rollNo: "CSE2026032",
    cgpa: 7.92,
    skills: "Node.js, MongoDB, Express",
    placementStatus: "Placed",
  },
  {
    id: "sample-008",
    name: "Sara Khan",
    rollNo: "DS2026040",
    cgpa: 8.58,
    skills: "Data Analysis, Excel, Power BI",
    placementStatus: "Not Placed",
  },
];

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `student-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStudents() {
  try {
    const parsedStudents = JSON.parse(localStorage.getItem(storageKey)) || [];
    return Array.isArray(parsedStudents) ? parsedStudents : [];
  } catch {
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(storageKey, JSON.stringify(students));
}

function normalizeStudentFromForm() {
  return {
    id: studentIdInput.value || createId(),
    name: studentNameInput.value.trim(),
    rollNo: rollNoInput.value.trim(),
    cgpa: Number(cgpaInput.value),
    skills: skillsInput.value.trim(),
    placementStatus: placementStatusInput.value,
  };
}

function setFieldError(input, errorElement, message) {
  errorElement.textContent = message;
  input.classList.toggle("input-error", Boolean(message));
}

function clearFormErrors() {
  setFieldError(studentNameInput, formErrors.name, "");
  setFieldError(rollNoInput, formErrors.rollNo, "");
  setFieldError(cgpaInput, formErrors.cgpa, "");
  setFieldError(skillsInput, formErrors.skills, "");
  setFieldError(placementStatusInput, formErrors.placementStatus, "");
  formErrors.summary.textContent = "";
}

function validateStudent(student) {
  clearFormErrors();

  let isValid = true;
  const duplicateRoll = students.some(
    (item) => item.rollNo.toLowerCase() === student.rollNo.toLowerCase() && item.id !== student.id
  );

  if (!student.name) {
    setFieldError(studentNameInput, formErrors.name, "Name is required.");
    isValid = false;
  }

  if (!student.rollNo) {
    setFieldError(rollNoInput, formErrors.rollNo, "Roll number is required.");
    isValid = false;
  } else if (duplicateRoll) {
    setFieldError(rollNoInput, formErrors.rollNo, "Roll number must be unique.");
    isValid = false;
  }

  if (!Number.isFinite(student.cgpa)) {
    setFieldError(cgpaInput, formErrors.cgpa, "CGPA is required.");
    isValid = false;
  } else if (student.cgpa < 0 || student.cgpa > 10) {
    setFieldError(cgpaInput, formErrors.cgpa, "CGPA must be between 0 and 10.");
    isValid = false;
  }

  if (!student.skills) {
    setFieldError(skillsInput, formErrors.skills, "At least one skill is required.");
    isValid = false;
  }

  if (!student.placementStatus) {
    setFieldError(placementStatusInput, formErrors.placementStatus, "Placement status is required.");
    isValid = false;
  }

  if (!isValid) {
    formErrors.summary.textContent = "Please fix the highlighted fields before submitting.";
  }

  return isValid;
}

function resetForm() {
  studentForm.reset();
  studentIdInput.value = "";
  placementStatusInput.value = "Placed";
  formTitle.textContent = "Add Student";
  submitBtn.textContent = "Add Student";
  cancelEditBtn.classList.add("hidden");
  clearFormErrors();
}

function updateStats() {
  const placedCount = students.filter((student) => student.placementStatus === "Placed").length;
  const cgpaTotal = students.reduce((sum, student) => sum + Number(student.cgpa), 0);
  const cgpaAverage = students.length ? cgpaTotal / students.length : 0;

  totalStudents.textContent = students.length;
  placedStudents.textContent = placedCount;
  averageCgpa.textContent = cgpaAverage.toFixed(2);
}

function getCgpaDistribution() {
  return students.reduce(
    (ranges, student) => {
      const cgpa = Number(student.cgpa);

      if (cgpa >= 9) {
        ranges["9+"] += 1;
      } else if (cgpa >= 8) {
        ranges["8-9"] += 1;
      } else if (cgpa >= 7) {
        ranges["7-8"] += 1;
      } else if (cgpa >= 6) {
        ranges["6-7"] += 1;
      }

      return ranges;
    },
    { "6-7": 0, "7-8": 0, "8-9": 0, "9+": 0 }
  );
}

function createCharts() {
  if (!window.Chart || !placementChartCanvas || !cgpaChartCanvas) {
    return;
  }

  Chart.defaults.color = "#9aa8bd";
  Chart.defaults.font.family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  placementChart = new Chart(placementChartCanvas, {
    type: "pie",
    data: {
      labels: ["Placed", "Not Placed"],
      datasets: [
        {
          data: [0, 0],
          backgroundColor: ["#42d392", "#ff6b6b"],
          borderColor: "#111827",
          borderWidth: 3,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            boxWidth: 12,
            boxHeight: 12,
          },
        },
      },
    },
  });

  cgpaChart = new Chart(cgpaChartCanvas, {
    type: "bar",
    data: {
      labels: ["6-7", "7-8", "8-9", "9+"],
      datasets: [
        {
          label: "Students",
          data: [0, 0, 0, 0],
          backgroundColor: ["#4db6ff", "#42d392", "#f7c948", "#b58cff"],
          borderRadius: 8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: "rgba(154, 168, 189, 0.08)",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
          grid: {
            color: "rgba(154, 168, 189, 0.12)",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function updateCharts() {
  if (!placementChart || !cgpaChart) {
    return;
  }

  const placedCount = students.filter((student) => student.placementStatus === "Placed").length;
  const notPlacedCount = students.length - placedCount;
  const cgpaDistribution = getCgpaDistribution();

  placementChart.data.datasets[0].data = [placedCount, notPlacedCount];
  placementChart.update();

  cgpaChart.data.datasets[0].data = Object.values(cgpaDistribution);
  cgpaChart.update();
}

function isInCgpaRange(cgpa, range) {
  if (range === "All") return true;
  if (range === "9+") return cgpa >= 9;

  const [min, max] = range.split("-").map(Number);
  return cgpa >= min && cgpa < max;
}

function getFilteredStudents() {
  const searchKeywords = searchInput.value
    .toLowerCase()
    .split(/\s+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const selectedStatus = statusFilter.value;
  const selectedCgpaRange = cgpaFilter.value;
  const skillKeywords = skillFilter.value
    .toLowerCase()
    .split(/\s+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const filteredStudents = students.filter((student) => {
    const cgpa = Number(student.cgpa);
    const matchesStatus = selectedStatus === "All" || student.placementStatus === selectedStatus;
    const matchesCgpa = isInCgpaRange(cgpa, selectedCgpaRange);
    const searchableText = `${student.name} ${student.rollNo} ${student.skills}`.toLowerCase();
    const matchesSearch = searchKeywords.every((keyword) => searchableText.includes(keyword));
    const skillText = student.skills.toLowerCase();
    const matchesSkills = skillKeywords.every((keyword) => skillText.includes(keyword));

    return matchesStatus && matchesCgpa && matchesSearch && matchesSkills;
  });

  return sortStudents(filteredStudents);
}

function sortStudents(studentList) {
  return [...studentList].sort((first, second) => {
    switch (sortSelect.value) {
      case "name-asc":
        return first.name.localeCompare(second.name);
      case "name-desc":
        return second.name.localeCompare(first.name);
      case "cgpa-asc":
        return Number(first.cgpa) - Number(second.cgpa);
      case "cgpa-desc":
        return Number(second.cgpa) - Number(first.cgpa);
      default:
        return 0;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderStudents() {
  const filteredStudents = getFilteredStudents();

  tableBody.innerHTML = filteredStudents
    .map((student) => {
      const statusClass = student.placementStatus === "Placed" ? "status-placed" : "status-not-placed";

      return `
        <tr>
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(student.rollNo)}</td>
          <td>${Number(student.cgpa).toFixed(2)}</td>
          <td class="skill-list">${escapeHtml(student.skills)}</td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(student.placementStatus)}</span></td>
          <td>
            <div class="actions">
              <button class="action-btn" type="button" data-action="edit" data-id="${student.id}">Edit</button>
              <button class="action-btn delete-btn" type="button" data-action="delete" data-id="${student.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  emptyState.classList.toggle("visible", filteredStudents.length === 0);
  resultCount.textContent = `${filteredStudents.length} of ${students.length} records`;
  updateStats();
  updateCharts();
}

function editStudent(id) {
  const student = students.find((item) => item.id === id);
  if (!student) return;

  studentIdInput.value = student.id;
  studentNameInput.value = student.name;
  rollNoInput.value = student.rollNo;
  cgpaInput.value = student.cgpa;
  skillsInput.value = student.skills;
  placementStatusInput.value = student.placementStatus;
  formTitle.textContent = "Edit Student";
  submitBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden");
  clearFormErrors();
  studentNameInput.focus();
}

function deleteStudent(id) {
  students = students.filter((student) => student.id !== id);
  saveStudents();
  renderStudents();

  if (studentIdInput.value === id) {
    resetForm();
  }
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function exportToCsv() {
  const headers = ["Name", "Roll No", "CGPA", "Skills", "Placement Status"];
  const rows = students.map((student) => [
    student.name,
    student.rollNo,
    Number(student.cgpa).toFixed(2),
    student.skills,
    student.placementStatus,
  ]);
  const csvContent = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "placement-metrics-students.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function loadSampleData() {
  students = sampleStudents.map((student) => ({ ...student }));
  saveStudents();
  resetForm();
  renderStudents();
}

function downloadReport() {
  if (!window.jspdf) {
    alert("PDF library could not be loaded. Please check your internet connection and try again.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  if (typeof doc.autoTable !== "function") {
    alert("PDF table library could not be loaded. Please check your internet connection and try again.");
    return;
  }

  const placedCount = students.filter((student) => student.placementStatus === "Placed").length;
  const notPlacedCount = students.length - placedCount;
  const cgpaTotal = students.reduce((sum, student) => sum + Number(student.cgpa), 0);
  const cgpaAverage = students.length ? cgpaTotal / students.length : 0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Placement Report", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Total students: ${students.length}`, 14, 32);
  doc.text(`Placed: ${placedCount}`, 14, 40);
  doc.text(`Not placed: ${notPlacedCount}`, 14, 48);
  doc.text(`Average CGPA: ${cgpaAverage.toFixed(2)}`, 14, 56);

  const tableRows = students.map((student) => [
    student.name,
    student.rollNo,
    Number(student.cgpa).toFixed(2),
    student.skills,
    student.placementStatus,
  ]);

  doc.autoTable({
    startY: 68,
    head: [["Name", "Roll No", "CGPA", "Skills", "Placement Status"]],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      3: { cellWidth: 52 },
    },
  });

  doc.save("placement-report.pdf");
}

function logout() {
  localStorage.removeItem(sessionStorageKey);
  window.location.href = "login.html";
}

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const student = normalizeStudentFromForm();
  if (!validateStudent(student)) {
    return;
  }

  const existingIndex = students.findIndex((item) => item.id === student.id);
  if (existingIndex >= 0) {
    students[existingIndex] = student;
  } else {
    students.push(student);
  }

  saveStudents();
  resetForm();
  renderStudents();
});

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "edit") {
    editStudent(id);
  }

  if (action === "delete") {
    deleteStudent(id);
  }
});

[studentNameInput, rollNoInput, cgpaInput, skillsInput, placementStatusInput].forEach((input) => {
  input.addEventListener("input", clearFormErrors);
  input.addEventListener("change", clearFormErrors);
});

[searchInput, skillFilter].forEach((input) => input.addEventListener("input", renderStudents));
[statusFilter, cgpaFilter, sortSelect].forEach((select) => select.addEventListener("change", renderStudents));

cancelEditBtn.addEventListener("click", resetForm);
exportCsvBtn.addEventListener("click", exportToCsv);
loadSampleBtn.addEventListener("click", loadSampleData);
downloadReportBtn.addEventListener("click", downloadReport);
logoutBtn.addEventListener("click", logout);

createCharts();
renderStudents();
