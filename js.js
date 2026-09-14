const RANKS = [
  { name: "E",   min: 0,    color: "var(--r-e)"   },
  { name: "D",   min: 80,   color: "var(--r-d)"   },
  { name: "C",   min: 200,  color: "var(--r-c)"   },
  { name: "B",   min: 400,  color: "var(--r-b)"   },
  { name: "A",   min: 700,  color: "var(--r-a)"   },
  { name: "S",   min: 1100, color: "var(--r-s)"   },
  { name: "SS",  min: 1700, color: "var(--r-ss)"  },
  { name: "SSS", min: 2600, color: "var(--r-sss)" },
];

const GROUPS = [
  { key: "peito",   name: "Peito" },
  { key: "costas",  name: "Costas" },
  { key: "pernas",  name: "Pernas" },
  { key: "ombros",  name: "Ombros" },
  { key: "bracos",  name: "Braços" },
  { key: "core",    name: "Core / Abdômen" },
];

let state = {};
const STORAGE_KEY = "muscle-groups-progress";

function defaultState(){
  const s = {};
  GROUPS.forEach(g => { s[g.key] = { xp: 0, count: 0, history: [] }; });
  return s;
}

function rankFor(xp){
  let current = RANKS[0];
  for(const r of RANKS){ if(xp >= r.min) current = r; }
  const idx = RANKS.indexOf(current);
  const next = RANKS[idx + 1] || null;
  return { current, next, idx };
}

const SHIELD = "M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z";

const INSIGNIA = {
  // E — recruta: contorno simples, sem marcação interna
  E: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="none"/>`,

  // D — um traço central
  D: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="none"/>
           <line x1="12" y1="8" x2="12" y2="15" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`,

  // C — cruz simples
  C: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="none"/>
           <line x1="9" y1="11.5" x2="15" y2="11.5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
           <line x1="12" y1="8.5" x2="12" y2="14.5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`,

  // B — diamante interno
  B: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="none"/>
           <path d="M12 8L15 11.5L12 15L9 11.5Z" stroke="${c}" stroke-width="1.4" fill="none"/>`,

  // A — escudo preenchido
  A: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="${c}" fill-opacity="0.28"/>`,

  // S — estrela única
  S: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="${c}" fill-opacity="0.16"/>
           <path d="M12 7.6L13.2 10.3L16 10.6L13.9 12.5L14.5 15.4L12 13.9L9.5 15.4L10.1 12.5L8 10.6L10.8 10.3Z" fill="${c}"/>`,

  // SS — duas estrelas
  SS: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="${c}" fill-opacity="0.22"/>
           <path d="M9.3 8.6L10 10.4L11.9 10.6L10.5 11.9L10.9 13.8L9.3 12.8L7.7 13.8L8.1 11.9L6.7 10.6L8.6 10.4Z" fill="${c}"/>
           <path d="M14.7 8.6L15.4 10.4L17.3 10.6L15.9 11.9L16.3 13.8L14.7 12.8L13.1 13.8L13.5 11.9L12.1 10.6L14 10.4Z" fill="${c}"/>`,

  // SSS — coroa
  SSS: c => `<path d="${SHIELD}" stroke="${c}" stroke-width="1.6" fill="${c}" fill-opacity="0.28"/>
           <path d="M7.5 13.5L8.2 9.8L10.3 11.9L12 8.8L13.7 11.9L15.8 9.8L16.5 13.5Z" fill="${c}" stroke="${c}" stroke-width="0.6" stroke-linejoin="round"/>`,
};

function shieldSvg(color, rankName){
  const draw = INSIGNIA[rankName] || INSIGNIA.E;
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${draw(color)}</svg>`;
}

function render(){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  let totalTreinos = 0;
  let totalXpForAvg = 0;
  let topGroup = null, topXp = -1;

  GROUPS.forEach(g => {
    const data = state[g.key];
    const { current, next, idx } = rankFor(data.xp);
    totalTreinos += data.count;
    totalXpForAvg += idx;
    if(data.xp > topXp){ topXp = data.xp; topGroup = g.name; }

    const span = next ? (next.min - current.min) : 1;
    const progress = next ? Math.min(100, ((data.xp - current.min) / span) * 100) : 100;

    const card = document.createElement("div");
    card.className = "card";
    card.style.setProperty("--rank-color", current.color);

    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="group-name">${g.name}</div>
          <div class="group-meta">${data.count} treino${data.count === 1 ? "" : "s"} registrado${data.count === 1 ? "" : "s"}</div>
        </div>
        <div class="badge">${shieldSvg(current.color, current.name)}${current.name}</div>
      </div>
      <div>
        <div class="bar-track"><div class="bar-fill" style="width:${progress}%"></div></div>
        <div class="bar-labels">
          <span>${data.xp} XP</span>
          <span>${next ? `próximo: ${next.name} em ${next.min - data.xp} XP` : "rank máximo"}</span>
        </div>
      </div>
      <div class="actions">
        <button class="registrar-link" data-group="${g.key}">Registrar treino</button>
      </div>
    `;
    grid.appendChild(card);
  });

  document.getElementById("stat-total").textContent = totalTreinos;
  document.getElementById("stat-top").textContent = topGroup || "—";

  const avgIdx = Math.round(totalXpForAvg / GROUPS.length);
  document.getElementById("stat-rank-medio").textContent = RANKS[avgIdx] ? RANKS[avgIdx].name : "E";

  grid.querySelectorAll(".registrar-link").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("form-group").value = btn.dataset.group;
      showTab("registrar");
    });
  });
}

let flashTimeout;
function showFlash(msg){
  const el = document.getElementById("flash");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => el.classList.remove("show"), 2200);
}

function xpFromExercise(ex){
  return Math.round(ex.sets * ex.reps * 0.4);
}

function xpFromExercises(list){
  return list.reduce((sum, ex) => sum + xpFromExercise(ex), 0);
}

async function finalizeWorkout(groupKey, exercises){
  const data = state[groupKey];
  const before = rankFor(data.xp).current;

  const gained = xpFromExercises(exercises);
  data.xp += gained;
  data.count += 1;
  data.history = data.history || [];
  data.history.unshift({ date: new Date().toISOString(), exercises });
  data.history = data.history.slice(0, 10);

  const after = rankFor(data.xp).current;
  const groupName = GROUPS.find(g => g.key === groupKey).name;

  if(after.name !== before.name){
    showFlash(`${groupName} subiu para o rank ${after.name}!`);
  } else {
    showFlash(`+${gained} XP em ${groupName}`);
  }

  render();
  await saveState();
}

async function saveState(){
  try{
    await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
  } catch(err){
    console.error("Falha ao salvar progresso:", err);
  }
}

async function loadState(){
  try{
    const result = await window.storage.get(STORAGE_KEY, false);
    state = result ? JSON.parse(result.value) : defaultState();
  } catch(err){
    state = defaultState();
  }
  // garante que grupos novos existam mesmo se o storage for antigo
  GROUPS.forEach(g => { if(!state[g.key]) state[g.key] = { xp: 0, count: 0, history: [] }; });
  render();
}

document.getElementById("reset-btn").addEventListener("click", async () => {
  if(!confirm("Reiniciar todo o progresso de ranks? Essa ação não pode ser desfeita.")) return;
  state = defaultState();
  render();
  await saveState();
  showFlash("Progresso reiniciado.");
});

/* ---------- Abas ---------- */
function showTab(name){
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.getElementById("panel-ranks").classList.toggle("active", name === "ranks");
  document.getElementById("panel-registrar").classList.toggle("active", name === "registrar");
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});

/* ---------- Formulário de registro ---------- */
const groupSelect = document.getElementById("form-group");
groupSelect.innerHTML = GROUPS.map(g => `<option value="${g.key}">${g.name}</option>`).join("");

let currentExercises = [];

function renderExerciseList(){
  const list = document.getElementById("exercise-list");
  list.innerHTML = currentExercises.map((ex, i) => `
    <li class="exercise-item">
      <div><span class="ex-name">${ex.name}</span><span class="ex-detail">${ex.sets}x${ex.reps} · +${xpFromExercise(ex)} XP</span></div>
      <button class="remove-ex" data-idx="${i}" title="Remover">✕</button>
    </li>
  `).join("");

  list.querySelectorAll(".remove-ex").forEach(btn => {
    btn.addEventListener("click", () => {
      currentExercises.splice(Number(btn.dataset.idx), 1);
      renderExerciseList();
    });
  });

  document.getElementById("xp-preview").textContent = xpFromExercises(currentExercises);
  document.getElementById("finish-btn").disabled = currentExercises.length === 0;
}

document.getElementById("add-ex-btn").addEventListener("click", () => {
  const nameInput = document.getElementById("ex-name");
  const setsInput = document.getElementById("ex-sets");
  const repsInput = document.getElementById("ex-reps");

  const name = nameInput.value.trim();
  const sets = parseInt(setsInput.value, 10);
  const reps = parseInt(repsInput.value, 10);

  if(!name || !sets || !reps || sets < 1 || reps < 1){
    showFlash("Preencha o exercício, séries e repetições.");
    return;
  }

  currentExercises.push({ name, sets, reps });
  renderExerciseList();

  nameInput.value = "";
  setsInput.value = "3";
  repsInput.value = "10";
  nameInput.focus();
});

document.getElementById("ex-name").addEventListener("keydown", (e) => {
  if(e.key === "Enter"){ e.preventDefault(); document.getElementById("add-ex-btn").click(); }
});

document.getElementById("finish-btn").addEventListener("click", async () => {
  if(currentExercises.length === 0) return;
  const groupKey = groupSelect.value;
  await finalizeWorkout(groupKey, currentExercises);
  currentExercises = [];
  renderExerciseList();
  showTab("ranks");
});

loadState();