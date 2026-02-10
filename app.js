const DAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const STORAGE = {
  weekly: "fit_dashboard_weekly",
  progress: "fit_dashboard_progress",
  exercises: "fit_dashboard_exercises",
  planHistory: "fit_dashboard_plan_history",
};

const weeklySection = {
  label: document.getElementById("currentWeekLabel"),
  daysGrid: document.getElementById("daysGrid"),
  strengthCount: document.getElementById("strengthCount"),
  cardioCount: document.getElementById("cardioCount"),
  mobilityCount: document.getElementById("mobilityCount"),
  goalStatus: document.getElementById("goalStatus"),
  prevBtn: document.getElementById("prevWeekBtn"),
  thisBtn: document.getElementById("thisWeekBtn"),
  nextBtn: document.getElementById("nextWeekBtn"),
};

const progressForm = document.getElementById("progressForm");
const progressTableBody = document.getElementById("progressTableBody");
const exerciseForm = document.getElementById("exerciseForm");
const exerciseFilter = document.getElementById("exerciseFilter");
const exerciseChips = document.getElementById("exerciseChips");
const planHistory = document.getElementById("planHistory");

let weekOffset = 0;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getMonday(baseDate = new Date()) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekByOffset(offset) {
  const monday = getMonday();
  monday.setDate(monday.getDate() + offset * 7);
  return monday;
}

function weekKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const dayOfYear = Math.floor((d - start) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + start.getDay()) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("cs-CZ");
}

function defaultWeekState() {
  return DAYS.map((name) => ({ day: name, type: "volno", note: "" }));
}

function renderWeek() {
  const monday = getWeekByOffset(weekOffset);
  const key = weekKey(monday);
  const weeklyData = read(STORAGE.weekly, {});
  if (!weeklyData[key]) weeklyData[key] = defaultWeekState();

  weeklySection.label.textContent = `Týden: ${key} (${formatDate(monday)} – ${formatDate(
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  )})`;

  weeklySection.daysGrid.innerHTML = "";

  weeklyData[key].forEach((entry, index) => {
    const box = document.createElement("article");
    box.className = "day-box";
    box.innerHTML = `
      <h4>${entry.day}</h4>
      <select data-index="${index}" class="day-type">
        <option value="volno" ${entry.type === "volno" ? "selected" : ""}>Volno</option>
        <option value="silovy" ${entry.type === "silovy" ? "selected" : ""}>Silový trénink</option>
        <option value="kardio" ${entry.type === "kardio" ? "selected" : ""}>Kardio</option>
        <option value="mobilita" ${entry.type === "mobilita" ? "selected" : ""}>Mobilita</option>
      </select>
      <input data-index="${index}" class="day-note" placeholder="poznámka" value="${entry.note || ""}" />
    `;
    weeklySection.daysGrid.appendChild(box);
  });

  weeklySection.daysGrid.querySelectorAll(".day-type").forEach((el) => {
    el.addEventListener("change", (e) => {
      const i = Number(e.target.dataset.index);
      weeklyData[key][i].type = e.target.value;
      save(STORAGE.weekly, weeklyData);
      updateSummary(weeklyData[key]);
    });
  });

  weeklySection.daysGrid.querySelectorAll(".day-note").forEach((el) => {
    el.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.index);
      weeklyData[key][i].note = e.target.value;
      save(STORAGE.weekly, weeklyData);
    });
  });

  save(STORAGE.weekly, weeklyData);
  updateSummary(weeklyData[key]);
}

function updateSummary(days) {
  const strength = days.filter((d) => d.type === "silovy").length;
  const cardio = days.filter((d) => d.type === "kardio").length;
  const mobility = days.filter((d) => d.type === "mobilita").length;

  weeklySection.strengthCount.textContent = strength;
  weeklySection.cardioCount.textContent = cardio;
  weeklySection.mobilityCount.textContent = mobility;

  const success = strength >= 3 && cardio >= 2;
  weeklySection.goalStatus.classList.remove("success", "fail");
  weeklySection.goalStatus.classList.add(success ? "success" : "fail");
  weeklySection.goalStatus.querySelector("p").textContent = success
    ? "Splněno ✅ Dobrá práce!"
    : "Zatím nesplněno · zkus dát 3× silový + 2× kardio";
}

function renderProgress() {
  const data = read(STORAGE.progress, []).sort((a, b) => (a.date < b.date ? 1 : -1));
  progressTableBody.innerHTML = "";

  if (!data.length) {
    progressTableBody.innerHTML = '<tr><td colspan="5">Zatím bez záznamu.</td></tr>';
    return;
  }

  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${row.weight || "—"}</td>
      <td>${row.waist || "—"}</td>
      <td>${row.note || "—"}</td>
      <td><button class="small-danger" data-remove="${index}">Smazat</button></td>
    `;
    progressTableBody.appendChild(tr);
  });

  progressTableBody.querySelectorAll("button[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sorted = read(STORAGE.progress, []).sort((a, b) => (a.date < b.date ? 1 : -1));
      sorted.splice(Number(btn.dataset.remove), 1);
      save(STORAGE.progress, sorted);
      renderProgress();
    });
  });
}

function seedExercises() {
  const current = read(STORAGE.exercises, null);
  if (current && current.length) return;

  const base = [
    { name: "Dřep s osou", group: "Nohy", type: "Silový", note: "4×6–10" },
    { name: "Bench press", group: "Hrudník", type: "Silový", note: "4×6–10" },
    { name: "Přítahy na hrazdě", group: "Záda", type: "Silový", note: "4×8–12" },
    { name: "Rychlá chůze do kopce", group: "Kardio", type: "Kardio", note: "20–40 min" },
    { name: "Mobilita kyčlí", group: "Celé tělo", type: "Mobilita", note: "8–10 min" },
  ];
  save(STORAGE.exercises, base);
}

function renderExercises() {
  const filter = exerciseFilter.value;
  const data = read(STORAGE.exercises, []);
  const list = filter === "all" ? data : data.filter((x) => x.type === filter);

  exerciseChips.innerHTML = "";
  if (!list.length) {
    exerciseChips.innerHTML = '<p>Žádné cviky pro filtr.</p>';
    return;
  }

  list.forEach((item) => {
    const chip = document.createElement("article");
    chip.className = "chip";
    chip.textContent = `${item.name} · ${item.group} · ${item.type}${item.note ? ` · ${item.note}` : ""}`;
    exerciseChips.appendChild(chip);
  });
}

function renderPlanHistory() {
  const history = read(STORAGE.planHistory, []);
  if (!history.length) {
    planHistory.textContent = "Historie splnění A/B zatím prázdná.";
    return;
  }

  const latest = history
    .slice(-10)
    .reverse()
    .map((h) => `${h.date}: Trénink ${h.plan}`)
    .join(" · ");
  planHistory.textContent = `Poslední splnění: ${latest}`;
}

weeklySection.prevBtn.addEventListener("click", () => {
  weekOffset -= 1;
  renderWeek();
});

weeklySection.thisBtn.addEventListener("click", () => {
  weekOffset = 0;
  renderWeek();
});

weeklySection.nextBtn.addEventListener("click", () => {
  weekOffset += 1;
  renderWeek();
});

progressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(progressForm);
  const row = {
    date: formData.get("date"),
    weight: formData.get("weight"),
    waist: formData.get("waist"),
    note: formData.get("note"),
  };
  if (!row.date) return;

  const data = read(STORAGE.progress, []);
  data.push(row);
  save(STORAGE.progress, data);
  progressForm.reset();
  renderProgress();
});

exerciseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(exerciseForm);
  const item = {
    name: formData.get("name")?.toString().trim(),
    group: formData.get("group"),
    type: formData.get("type"),
    note: formData.get("note")?.toString().trim(),
  };

  if (!item.name || !item.group || !item.type) return;

  const data = read(STORAGE.exercises, []);
  data.push(item);
  save(STORAGE.exercises, data);
  exerciseForm.reset();
  renderExercises();
});

exerciseFilter.addEventListener("change", renderExercises);

document.querySelectorAll(".plan-done").forEach((btn) => {
  btn.addEventListener("click", () => {
    const plan = btn.dataset.plan;
    const history = read(STORAGE.planHistory, []);
    history.push({ plan, date: new Date().toLocaleString("cs-CZ") });
    save(STORAGE.planHistory, history);
    renderPlanHistory();
  });
});

seedExercises();
renderWeek();
renderProgress();
renderExercises();
renderPlanHistory();
