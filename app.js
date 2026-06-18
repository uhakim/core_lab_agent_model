const STORAGE_KEY = "ai-game-lab-state-v1";

const DEFAULT_SETTINGS = {
  template: "runner",
  player: {
    name: "번개 고양이",
    color: "yellow",
    speed: 4,
    hp: 3,
    jumpPower: 8,
  },
  background: "forest",
  obstacle: {
    type: "cactus",
    speed: 4,
    spawnRate: 1400,
  },
  item: {
    type: "star",
    score: 10,
    spawnRate: 1800,
  },
  game: {
    duration: 60,
    goalScore: 100,
  },
};

const LIMITS = {
  player: {
    speed: [1, 10],
    hp: [1, 10],
    jumpPower: [4, 15],
  },
  obstacle: {
    speed: [1, 10],
    spawnRate: [600, 3000],
  },
  item: {
    score: [1, 20],
    spawnRate: [600, 3000],
  },
  game: {
    duration: [30, 60, 90],
    goalScore: [10, 200],
  },
};

const LABELS = [
  { path: "player.name", label: "캐릭터 이름", concept: "variable", key: "player.name" },
  { path: "player.color", label: "캐릭터 색", concept: "variable", key: "player.color" },
  { path: "player.speed", label: "캐릭터 속도", concept: "variable", key: "player.speed" },
  { path: "player.hp", label: "체력", concept: "state", key: "player.hp" },
  { path: "player.jumpPower", label: "점프 힘", concept: "variable", key: "player.jumpPower" },
  { path: "background", label: "배경", concept: "variable", key: "background" },
  { path: "obstacle.type", label: "장애물", concept: "loop", key: "obstacle.type" },
  { path: "obstacle.speed", label: "장애물 속도", concept: "loop", key: "obstacle.speed" },
  { path: "obstacle.spawnRate", label: "장애물 나오는 간격", concept: "loop", key: "obstacle.spawnRate" },
  { path: "item.type", label: "아이템", concept: "loop", key: "item.type" },
  { path: "item.spawnRate", label: "아이템 나오는 간격", concept: "loop", key: "item.spawnRate" },
  { path: "game.duration", label: "게임 시간", concept: "condition", key: "game.duration" },
  { path: "game.goalScore", label: "목표 점수", concept: "condition", key: "game.goalScore" },
];

const DISPLAY_VALUES = {
  colors: {
    red: "빨강",
    blue: "파랑",
    yellow: "노랑",
    green: "초록",
    purple: "보라",
    black: "검정",
    white: "하양",
    orange: "주황",
    pink: "분홍",
  },
  backgrounds: {
    forest: "숲",
    space: "우주",
    desert: "사막",
    ocean: "바다",
    school: "학교",
  },
  obstacles: {
    cactus: "선인장",
    rock: "돌",
    cloud: "구름",
  },
  items: {
    star: "별",
    coin: "코인",
    heart: "하트",
  },
  concepts: {
    variable: "변수",
    loop: "반복",
    condition: "조건",
    state: "상태",
  },
};

const THEME_COLORS = {
  forest: {
    skyTop: "#8fd2ff",
    skyBottom: "#d7f2d4",
    ground: "#3d8b47",
    groundDark: "#246333",
    accent: "#1f7a3d",
  },
  space: {
    skyTop: "#12162f",
    skyBottom: "#293462",
    ground: "#465079",
    groundDark: "#252b4f",
    accent: "#f7d060",
  },
  desert: {
    skyTop: "#ffd38a",
    skyBottom: "#fff2c7",
    ground: "#d89b45",
    groundDark: "#a66624",
    accent: "#e26d3d",
  },
  ocean: {
    skyTop: "#70d6ff",
    skyBottom: "#caf0f8",
    ground: "#168aad",
    groundDark: "#05668d",
    accent: "#00b4d8",
  },
  school: {
    skyTop: "#dbeafe",
    skyBottom: "#f8fafc",
    ground: "#7c6f64",
    groundDark: "#4b5563",
    accent: "#2563eb",
  },
};

const PLAYER_COLORS = {
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#facc15",
  green: "#22c55e",
  purple: "#8b5cf6",
  black: "#111827",
  white: "#f8fafc",
  orange: "#fb923c",
  pink: "#f472b6",
};

const state = {
  settings: structuredClone(DEFAULT_SETTINGS),
  pendingChanges: null,
  pendingExplanation: "",
  history: [],
  journals: [],
  filter: "all",
  paused: false,
};

const el = {};

function init() {
  bindElements();
  loadState();
  bindEvents();
  game.init();
  addSystemMessage("예시 버튼을 누르거나 직접 요청해 보세요. 제안은 적용 전 먼저 확인됩니다.");
  renderAll();
  requestAnimationFrame(game.loop);
}

function bindElements() {
  [
    "pauseBtn",
    "restartBtn",
    "scoreValue",
    "hpValue",
    "timeValue",
    "gameTitle",
    "gameSubtitle",
    "gameCanvas",
    "gameOverlay",
    "overlayTitle",
    "overlayText",
    "jumpBtn",
    "slideBtn",
    "resetBtn",
    "variableList",
    "chatMessages",
    "agentForm",
    "agentInput",
    "applyBtn",
    "clearProposalBtn",
    "undoBtn",
    "journalPrompt",
    "journalChanges",
    "journalResult",
    "journalNext",
    "saveJournalBtn",
    "historyList",
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
}

function bindEvents() {
  el.agentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = el.agentInput.value.trim();
    if (!prompt) return;
    requestAgent(prompt);
    el.agentInput.value = "";
  });

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.dataset.prompt;
      el.agentInput.value = prompt;
      requestAgent(prompt);
      el.agentInput.value = "";
    });
  });

  document.querySelectorAll(".concept-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll(".concept-tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      renderVariables();
    });
  });

  el.applyBtn.addEventListener("click", applyPendingChanges);
  el.clearProposalBtn.addEventListener("click", clearPendingChanges);
  el.undoBtn.addEventListener("click", undoLastChange);
  el.resetBtn.addEventListener("click", resetSettings);
  el.restartBtn.addEventListener("click", () => game.reset());
  el.pauseBtn.addEventListener("click", togglePause);
  el.jumpBtn.addEventListener("pointerdown", () => game.jump());
  el.slideBtn.addEventListener("pointerdown", () => game.setSlide(true));
  el.slideBtn.addEventListener("pointerup", () => game.setSlide(false));
  el.slideBtn.addEventListener("pointerleave", () => game.setSlide(false));
  el.saveJournalBtn.addEventListener("click", saveJournal);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      game.jump();
    }
    if (event.code === "ArrowDown") {
      event.preventDefault();
      game.setSlide(true);
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowDown") {
      game.setSlide(false);
    }
  });

  window.addEventListener("resize", () => game.resizeCanvas());
}

function requestAgent(prompt) {
  addMessage("user", prompt);
  const response = mockAgent(prompt, state.settings);
  state.pendingChanges = validateChanges(response.changes);
  state.pendingExplanation = response.studentExplanation;
  addMessage("agent", response.studentExplanation);
  fillJournalDraft(prompt);
  renderAll();
}

function mockAgent(prompt, settings) {
  const text = prompt.toLowerCase();
  const changes = {};
  const reasons = [];

  if (containsAny(text, ["우주", "space"])) {
    changes.background = "space";
    reasons.push("배경을 우주로 바꾸었어요");
  } else if (containsAny(text, ["숲", "forest"])) {
    changes.background = "forest";
    reasons.push("배경을 숲으로 바꾸었어요");
  } else if (containsAny(text, ["사막", "desert"])) {
    changes.background = "desert";
    reasons.push("배경을 사막으로 바꾸었어요");
  } else if (containsAny(text, ["바다", "ocean"])) {
    changes.background = "ocean";
    reasons.push("배경을 바다로 바꾸었어요");
  } else if (containsAny(text, ["학교", "school"])) {
    changes.background = "school";
    reasons.push("배경을 학교로 바꾸었어요");
  }

  if (containsAny(text, ["고양이", "cat", "번개"])) {
    changes.player = { ...changes.player, name: "번개 고양이", color: "yellow" };
    reasons.push("캐릭터를 번개 고양이 느낌으로 바꾸었어요");
  }
  if (containsAny(text, ["로봇", "robot"])) {
    changes.player = { ...changes.player, name: "파란 로봇", color: "blue" };
    reasons.push("캐릭터를 로봇 느낌으로 바꾸었어요");
  }
  if (containsAny(text, ["토끼", "rabbit"])) {
    changes.player = { ...changes.player, name: "분홍 토끼", color: "pink" };
    reasons.push("캐릭터를 토끼 느낌으로 바꾸었어요");
  }

  if (containsAny(text, ["빠르게", "빠른", "속도 올", "speed up"])) {
    changes.player = {
      ...changes.player,
      speed: clamp(settings.player.speed + 2, ...LIMITS.player.speed),
    };
    changes.obstacle = {
      ...changes.obstacle,
      speed: clamp(settings.obstacle.speed + 1, ...LIMITS.obstacle.speed),
    };
    reasons.push("캐릭터와 장애물 속도를 조금 올렸어요");
  }

  if (containsAny(text, ["느리게", "천천히", "쉬운", "쉽게"])) {
    changes.obstacle = {
      ...changes.obstacle,
      speed: clamp(settings.obstacle.speed - 1, ...LIMITS.obstacle.speed),
      spawnRate: clamp(settings.obstacle.spawnRate + 500, ...LIMITS.obstacle.spawnRate),
    };
    reasons.push("장애물이 더 천천히 나오도록 바꾸었어요");
  }

  if (containsAny(text, ["어렵", "많이", "자주"])) {
    changes.obstacle = {
      ...changes.obstacle,
      speed: clamp(settings.obstacle.speed + 1, ...LIMITS.obstacle.speed),
      spawnRate: clamp(settings.obstacle.spawnRate - 350, ...LIMITS.obstacle.spawnRate),
    };
    reasons.push("장애물이 더 자주 나오도록 바꾸었어요");
  }

  if (containsAny(text, ["점프", "높게", "jump"])) {
    changes.player = {
      ...changes.player,
      jumpPower: clamp(settings.player.jumpPower + 3, ...LIMITS.player.jumpPower),
    };
    reasons.push("점프 힘을 높였어요");
  }

  if (containsAny(text, ["체력", "하트", "hp"])) {
    changes.player = {
      ...changes.player,
      hp: clamp(settings.player.hp + 1, ...LIMITS.player.hp),
    };
    reasons.push("체력을 늘렸어요");
  }

  const durationMatch = prompt.match(/(30|60|90)\s*초/);
  if (durationMatch) {
    changes.game = {
      ...changes.game,
      duration: Number(durationMatch[1]),
    };
    reasons.push(`게임 시간을 ${durationMatch[1]}초로 바꾸었어요`);
  }

  if (containsAny(text, ["코인", "coin"])) {
    changes.item = { ...changes.item, type: "coin" };
    reasons.push("아이템을 코인으로 바꾸었어요");
  } else if (containsAny(text, ["하트", "heart"])) {
    changes.item = { ...changes.item, type: "heart" };
    reasons.push("아이템을 하트로 바꾸었어요");
  } else if (containsAny(text, ["별", "star"])) {
    changes.item = { ...changes.item, type: "star" };
    reasons.push("아이템을 별로 바꾸었어요");
  }

  if (Object.keys(changes).length === 0) {
    changes.player = {
      speed: clamp(settings.player.speed + 1, ...LIMITS.player.speed),
    };
    reasons.push("요청이 조금 애매해서 캐릭터 속도를 조금만 바꾸었어요");
  }

  return {
    changes,
    studentExplanation: `${reasons.join(", ")}. 오른쪽 위에서 바뀔 값을 확인한 뒤 적용할 수 있어요.`,
  };
}

function validateChanges(changes) {
  const next = {};
  if (typeof changes.background === "string" && DISPLAY_VALUES.backgrounds[changes.background]) {
    next.background = changes.background;
  }
  if (changes.player) {
    next.player = {};
    if (typeof changes.player.name === "string") next.player.name = changes.player.name.slice(0, 16);
    if (typeof changes.player.color === "string" && DISPLAY_VALUES.colors[changes.player.color]) {
      next.player.color = changes.player.color;
    }
    if (Number.isFinite(changes.player.speed)) next.player.speed = clamp(changes.player.speed, ...LIMITS.player.speed);
    if (Number.isFinite(changes.player.hp)) next.player.hp = clamp(changes.player.hp, ...LIMITS.player.hp);
    if (Number.isFinite(changes.player.jumpPower)) {
      next.player.jumpPower = clamp(changes.player.jumpPower, ...LIMITS.player.jumpPower);
    }
    if (Object.keys(next.player).length === 0) delete next.player;
  }
  if (changes.obstacle) {
    next.obstacle = {};
    if (typeof changes.obstacle.type === "string" && DISPLAY_VALUES.obstacles[changes.obstacle.type]) {
      next.obstacle.type = changes.obstacle.type;
    }
    if (Number.isFinite(changes.obstacle.speed)) {
      next.obstacle.speed = clamp(changes.obstacle.speed, ...LIMITS.obstacle.speed);
    }
    if (Number.isFinite(changes.obstacle.spawnRate)) {
      next.obstacle.spawnRate = clamp(changes.obstacle.spawnRate, ...LIMITS.obstacle.spawnRate);
    }
    if (Object.keys(next.obstacle).length === 0) delete next.obstacle;
  }
  if (changes.item) {
    next.item = {};
    if (typeof changes.item.type === "string" && DISPLAY_VALUES.items[changes.item.type]) {
      next.item.type = changes.item.type;
    }
    if (Number.isFinite(changes.item.score)) next.item.score = clamp(changes.item.score, ...LIMITS.item.score);
    if (Number.isFinite(changes.item.spawnRate)) {
      next.item.spawnRate = clamp(changes.item.spawnRate, ...LIMITS.item.spawnRate);
    }
    if (Object.keys(next.item).length === 0) delete next.item;
  }
  if (changes.game) {
    next.game = {};
    if (LIMITS.game.duration.includes(changes.game.duration)) next.game.duration = changes.game.duration;
    if (Number.isFinite(changes.game.goalScore)) next.game.goalScore = clamp(changes.game.goalScore, ...LIMITS.game.goalScore);
    if (Object.keys(next.game).length === 0) delete next.game;
  }
  return next;
}

function applyPendingChanges() {
  if (!state.pendingChanges || Object.keys(state.pendingChanges).length === 0) return;
  const before = structuredClone(state.settings);
  const after = mergeDeep(state.settings, state.pendingChanges);
  const diff = createDiff(before, after);
  state.history.unshift({
    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    explanation: state.pendingExplanation,
    diff,
    before,
    after,
  });
  state.history = state.history.slice(0, 12);
  state.settings = after;
  state.pendingChanges = null;
  state.pendingExplanation = "";
  game.reset();
  saveState();
  renderAll();
}

function clearPendingChanges() {
  state.pendingChanges = null;
  state.pendingExplanation = "";
  renderAll();
}

function undoLastChange() {
  const last = state.history.shift();
  if (!last) return;
  state.settings = last.before;
  state.pendingChanges = null;
  state.pendingExplanation = "";
  game.reset();
  saveState();
  renderAll();
}

function resetSettings() {
  state.history.unshift({
    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    explanation: "기본값으로 초기화했습니다.",
    diff: createDiff(state.settings, DEFAULT_SETTINGS),
    before: structuredClone(state.settings),
    after: structuredClone(DEFAULT_SETTINGS),
  });
  state.settings = structuredClone(DEFAULT_SETTINGS);
  state.pendingChanges = null;
  state.pendingExplanation = "";
  game.reset();
  saveState();
  renderAll();
}

function fillJournalDraft(prompt) {
  el.journalPrompt.value = prompt;
  const preview = createDiff(state.settings, mergeDeep(state.settings, state.pendingChanges || {}));
  el.journalChanges.value = preview.length ? preview.join("\n") : "";
}

function saveJournal() {
  const entry = {
    time: new Date().toLocaleString("ko-KR"),
    prompt: el.journalPrompt.value.trim(),
    changes: el.journalChanges.value.trim(),
    result: el.journalResult.value.trim(),
    next: el.journalNext.value.trim(),
  };
  if (!entry.prompt && !entry.result && !entry.next) {
    addSystemMessage("기록할 내용을 먼저 적어주세요.");
    return;
  }
  state.journals.unshift(entry);
  state.journals = state.journals.slice(0, 20);
  el.journalResult.value = "";
  el.journalNext.value = "";
  saveState();
  addSystemMessage("해본 결과가 이 브라우저에 저장되었습니다.");
  renderHistory();
}

function renderAll() {
  renderHeader();
  renderVariables();
  renderButtons();
  renderHistory();
}

function renderHeader() {
  const bg = display("background", state.settings.background);
  el.gameTitle.textContent = `${state.settings.player.name}의 ${bg} 달리기`;
  el.gameSubtitle.textContent = `목표 점수 ${state.settings.game.goalScore}점, 제한 시간 ${state.settings.game.duration}초`;
}

function renderVariables() {
  const preview = mergeDeep(state.settings, state.pendingChanges || {});
  const rows = LABELS.filter((item) => state.filter === "all" || item.concept === state.filter);
  el.variableList.innerHTML = rows
    .map((item) => {
      const current = getPath(state.settings, item.path);
      const next = getPath(preview, item.path);
      const pending = JSON.stringify(current) !== JSON.stringify(next);
      const conceptClass = `concept-${item.concept}`;
      return `
        <article class="variable-item ${pending ? "pending" : ""}">
          <span class="concept-label ${conceptClass}">${DISPLAY_VALUES.concepts[item.concept]}</span>
          <div class="variable-copy">
            <div class="variable-title">
              <span>${item.label}</span>
              <span class="variable-key">${item.key}</span>
            </div>
            <div class="value-line">
              <span class="value-now">${formatValue(item.path, current)}</span>
              ${pending ? `<span class="value-arrow">-></span><span class="value-next">${formatValue(item.path, next)}</span>` : ""}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderButtons() {
  const hasPending = !!state.pendingChanges && Object.keys(flattenObject(state.pendingChanges)).length > 0;
  el.applyBtn.disabled = !hasPending;
  el.clearProposalBtn.disabled = !hasPending;
  el.undoBtn.disabled = state.history.length === 0;
  el.pauseBtn.textContent = state.paused ? "▶" : "II";
}

function renderHistory() {
  const changeItems = state.history.slice(0, 6).map((item) => {
    const summary = item.diff.length ? item.diff.slice(0, 2).join(" / ") : "변경 없음";
    return `<div class="history-item"><strong>${item.time} 변경</strong>${summary}</div>`;
  });
  const journalItems = state.journals.slice(0, 4).map((item) => {
    const summary = item.result || item.next || item.prompt || "기록";
    return `<div class="history-item"><strong>${item.time}</strong>${escapeHtml(summary)}</div>`;
  });
  el.historyList.innerHTML = [...changeItems, ...journalItems].join("") || `<div class="history-item"><strong>아직 기록 없음</strong>AI 제안을 적용하거나 해본 결과를 저장하면 여기에 남습니다.</div>`;
}

function addMessage(type, text) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  el.chatMessages.appendChild(node);
  el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

function addSystemMessage(text) {
  addMessage("system", text);
}

function togglePause() {
  state.paused = !state.paused;
  renderButtons();
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      settings: state.settings,
      history: state.history,
      journals: state.journals,
    }),
  );
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;
    state.settings = mergeDeep(DEFAULT_SETTINGS, saved.settings || {});
    state.history = Array.isArray(saved.history) ? saved.history : [];
    state.journals = Array.isArray(saved.journals) ? saved.journals : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function mergeDeep(base, patch) {
  const output = structuredClone(base);
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = mergeDeep(output[key] || {}, value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

function createDiff(before, after) {
  return LABELS.map((item) => {
    const prev = getPath(before, item.path);
    const next = getPath(after, item.path);
    if (JSON.stringify(prev) === JSON.stringify(next)) return null;
    return `${item.label}: ${formatValue(item.path, prev)} -> ${formatValue(item.path, next)}`;
  }).filter(Boolean);
}

function flattenObject(obj, prefix = "") {
  return Object.entries(obj || {}).reduce((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, path));
    } else {
      acc[path] = value;
    }
    return acc;
  }, {});
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function formatValue(path, value) {
  if (path === "background") return display("background", value);
  if (path === "player.color") return display("color", value);
  if (path === "obstacle.type") return display("obstacle", value);
  if (path === "item.type") return display("item", value);
  if (path.includes("spawnRate")) return `${value}ms`;
  if (path === "game.duration") return `${value}초`;
  if (path === "game.goalScore") return `${value}점`;
  return String(value);
}

function display(type, value) {
  if (type === "background") return DISPLAY_VALUES.backgrounds[value] || value;
  if (type === "color") return DISPLAY_VALUES.colors[value] || value;
  if (type === "obstacle") return DISPLAY_VALUES.obstacles[value] || value;
  if (type === "item") return DISPLAY_VALUES.items[value] || value;
  return value;
}

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

const game = {
  ctx: null,
  width: 960,
  height: 540,
  dpr: 1,
  lastTime: 0,
  elapsed: 0,
  score: 0,
  hp: 3,
  ended: false,
  player: {
    x: 150,
    y: 0,
    vy: 0,
    w: 60,
    h: 72,
    grounded: true,
    sliding: false,
  },
  obstacles: [],
  items: [],
  obstacleTimer: 0,
  itemTimer: 0,
  bgOffset: 0,

  init() {
    this.ctx = el.gameCanvas.getContext("2d");
    this.resizeCanvas();
    this.reset();
  },

  resizeCanvas() {
    const rect = el.gameCanvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(640, Math.floor(rect.width));
    this.height = Math.max(360, Math.floor(rect.height));
    el.gameCanvas.width = Math.floor(this.width * this.dpr);
    el.gameCanvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },

  reset() {
    this.elapsed = 0;
    this.score = 0;
    this.hp = state.settings.player.hp;
    this.ended = false;
    this.player.y = this.groundY() - this.player.h;
    this.player.vy = 0;
    this.player.grounded = true;
    this.player.sliding = false;
    this.obstacles = [];
    this.items = [];
    this.obstacleTimer = 500;
    this.itemTimer = 900;
    this.bgOffset = 0;
    el.gameOverlay.classList.add("hidden");
    this.updateHud();
  },

  loop(time) {
    const dt = Math.min(40, time - (game.lastTime || time));
    game.lastTime = time;
    if (!state.paused && !game.ended) {
      game.update(dt);
    }
    game.draw();
    requestAnimationFrame(game.loop);
  },

  update(dt) {
    const settings = state.settings;
    const dtSec = dt / 1000;
    this.elapsed += dt;
    const worldSpeed = 155 + settings.player.speed * 16 + settings.obstacle.speed * 12;
    this.bgOffset += worldSpeed * dtSec;

    this.player.vy += 1850 * dtSec;
    this.player.y += this.player.vy * dtSec;
    const ground = this.groundY();
    if (this.player.y + this.player.h >= ground) {
      this.player.y = ground - this.player.h;
      this.player.vy = 0;
      this.player.grounded = true;
    }

    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      this.spawnObstacle();
      this.obstacleTimer = settings.obstacle.spawnRate;
    }

    this.itemTimer -= dt;
    if (this.itemTimer <= 0) {
      this.spawnItem();
      this.itemTimer = settings.item.spawnRate;
    }

    this.obstacles.forEach((obstacle) => {
      obstacle.x -= worldSpeed * dtSec;
    });
    this.items.forEach((item) => {
      item.x -= worldSpeed * dtSec;
      item.float += dtSec * 5;
    });

    this.checkCollisions();
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x > -100);
    this.items = this.items.filter((item) => item.x > -80 && !item.collected);
    this.score += dtSec * 1.5;

    if (this.elapsed >= settings.game.duration * 1000) {
      this.end("시간 종료", "제한 시간이 끝났습니다.");
    }
    if (this.score >= settings.game.goalScore) {
      this.end("목표 달성", "목표 점수에 도착했습니다.");
    }
    if (this.hp <= 0) {
      this.end("체력 0", "장애물에 많이 부딪혔습니다.");
    }
    this.updateHud();
  },

  draw() {
    const ctx = this.ctx;
    const settings = state.settings;
    const theme = THEME_COLORS[settings.background] || THEME_COLORS.forest;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, theme.skyTop);
    gradient.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawBackground(theme, settings.background);
    this.drawGround(theme);
    this.items.forEach((item) => this.drawItem(item, settings.item.type));
    this.obstacles.forEach((obstacle) => this.drawObstacle(obstacle, settings.obstacle.type));
    this.drawPlayer(settings.player);
    if (state.paused) this.drawPause();
  },

  drawBackground(theme, background) {
    const ctx = this.ctx;
    const yBase = this.groundY();
    ctx.save();
    if (background === "space") {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < 42; i += 1) {
        const x = (i * 97 - this.bgOffset * 0.2) % (this.width + 120);
        const y = 28 + ((i * 53) % Math.max(80, yBase - 80));
        ctx.beginPath();
        ctx.arc(x < 0 ? x + this.width + 120 : x, y, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(this.width - 120, 88, 34, 0, Math.PI * 2);
      ctx.fill();
    } else if (background === "school") {
      for (let i = 0; i < 6; i += 1) {
        const x = ((i * 170 - this.bgOffset * 0.28) % (this.width + 200)) - 60;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(x, yBase - 190, 124, 122);
        ctx.fillStyle = "#93c5fd";
        ctx.fillRect(x + 16, yBase - 170, 28, 28);
        ctx.fillRect(x + 78, yBase - 170, 28, 28);
        ctx.fillRect(x + 16, yBase - 126, 28, 28);
        ctx.fillRect(x + 78, yBase - 126, 28, 28);
      }
    } else {
      for (let i = 0; i < 8; i += 1) {
        const x = ((i * 140 - this.bgOffset * 0.32) % (this.width + 180)) - 80;
        const h = 74 + (i % 3) * 26;
        ctx.fillStyle = background === "desert" ? "#b8792e" : background === "ocean" ? "#ffffff" : theme.accent;
        if (background === "desert") {
          ctx.fillRect(x + 34, yBase - h, 18, h);
          ctx.fillRect(x + 18, yBase - h + 28, 54, 14);
        } else if (background === "ocean") {
          ctx.beginPath();
          ctx.arc(x + 28, yBase - 150, 20, 0, Math.PI * 2);
          ctx.arc(x + 54, yBase - 154, 28, 0, Math.PI * 2);
          ctx.arc(x + 86, yBase - 150, 20, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(x + 42, yBase - h, 20, h);
          ctx.beginPath();
          ctx.arc(x + 52, yBase - h, 46, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  },

  drawGround(theme) {
    const ctx = this.ctx;
    const ground = this.groundY();
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, ground, this.width, this.height - ground);
    ctx.fillStyle = theme.groundDark;
    ctx.fillRect(0, ground, this.width, 14);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    for (let x = -(this.bgOffset % 64); x < this.width + 64; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, ground + 34);
      ctx.lineTo(x + 28, ground + 34);
      ctx.stroke();
    }
  },

  drawPlayer(playerSettings) {
    const ctx = this.ctx;
    const p = this.player;
    const color = PLAYER_COLORS[playerSettings.color] || PLAYER_COLORS.yellow;
    const h = p.sliding ? 44 : p.h;
    const y = p.sliding ? this.groundY() - h : p.y;
    ctx.save();
    ctx.translate(p.x, y);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(p.w / 2, h + 8, p.w * 0.45, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    roundRect(ctx, 8, 12, p.w - 16, h - 12, 14);
    ctx.fill();
    ctx.fillStyle = "#172033";
    ctx.beginPath();
    ctx.arc(25, 34, 4, 0, Math.PI * 2);
    ctx.arc(42, 34, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#172033";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, 46);
    ctx.quadraticCurveTo(34, 51, 42, 46);
    ctx.stroke();
    if (playerSettings.name.includes("고양이")) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(14, 15);
      ctx.lineTo(24, 0);
      ctx.lineTo(34, 15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(34, 15);
      ctx.lineTo(46, 0);
      ctx.lineTo(54, 18);
      ctx.fill();
    } else if (playerSettings.name.includes("로봇")) {
      ctx.fillStyle = "#172033";
      ctx.fillRect(28, 0, 5, 14);
      ctx.beginPath();
      ctx.arc(30, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      roundRect(ctx, 18, -8, 10, 26, 8);
      ctx.fill();
      roundRect(ctx, 38, -8, 10, 26, 8);
      ctx.fill();
    }
    ctx.restore();
  },

  drawObstacle(obstacle, type) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.fillStyle = "#0f766e";
    if (type === "rock") {
      ctx.fillStyle = "#6b7280";
      ctx.beginPath();
      ctx.moveTo(8, obstacle.h);
      ctx.lineTo(22, 12);
      ctx.lineTo(48, 0);
      ctx.lineTo(70, 20);
      ctx.lineTo(76, obstacle.h);
      ctx.closePath();
      ctx.fill();
    } else if (type === "cloud") {
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(20, 34, 18, 0, Math.PI * 2);
      ctx.arc(42, 24, 24, 0, Math.PI * 2);
      ctx.arc(68, 34, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      roundRect(ctx, 26, 0, 22, obstacle.h, 10);
      ctx.fill();
      roundRect(ctx, 8, 30, 22, 10, 8);
      ctx.fill();
      roundRect(ctx, 44, 48, 24, 10, 8);
      ctx.fill();
    }
    ctx.restore();
  },

  drawItem(item, type) {
    const ctx = this.ctx;
    const y = item.y + Math.sin(item.float) * 8;
    ctx.save();
    ctx.translate(item.x, y);
    if (type === "coin") {
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff7ad";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === "heart") {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.bezierCurveTo(-30, -8, -8, -24, 0, -10);
      ctx.bezierCurveTo(8, -24, 30, -8, 0, 16);
      ctx.fill();
    } else {
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const radius = i % 2 === 0 ? 18 : 8;
        const angle = -Math.PI / 2 + i * (Math.PI / 5);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },

  drawPause() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(23,32,51,0.45)";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("일시정지", this.width / 2, this.height / 2);
  },

  spawnObstacle() {
    const h = 58 + Math.random() * 28;
    this.obstacles.push({
      x: this.width + 80,
      y: this.groundY() - h,
      w: 76,
      h,
      hit: false,
    });
  },

  spawnItem() {
    this.items.push({
      x: this.width + 100,
      y: this.groundY() - 135 - Math.random() * 64,
      r: 18,
      float: Math.random() * 10,
      collected: false,
    });
  },

  checkCollisions() {
    const playerBox = this.playerBox();
    this.obstacles.forEach((obstacle) => {
      const obstacleBox = { x: obstacle.x + 10, y: obstacle.y + 8, w: obstacle.w - 20, h: obstacle.h - 8 };
      if (!obstacle.hit && intersects(playerBox, obstacleBox)) {
        obstacle.hit = true;
        this.hp -= 1;
      }
    });
    this.items.forEach((item) => {
      const itemBox = { x: item.x - item.r, y: item.y - item.r, w: item.r * 2, h: item.r * 2 };
      if (!item.collected && intersects(playerBox, itemBox)) {
        item.collected = true;
        this.score += state.settings.item.score;
        if (state.settings.item.type === "heart") {
          this.hp = clamp(this.hp + 1, 0, state.settings.player.hp);
        }
      }
    });
  },

  playerBox() {
    const p = this.player;
    const h = p.sliding ? 42 : p.h - 8;
    const y = p.sliding ? this.groundY() - h : p.y + 8;
    return { x: p.x + 8, y, w: p.w - 16, h };
  },

  jump() {
    if (this.ended || state.paused) return;
    if (this.player.grounded) {
      this.player.vy = -520 - state.settings.player.jumpPower * 28;
      this.player.grounded = false;
    }
  },

  setSlide(value) {
    if (this.ended || state.paused) return;
    this.player.sliding = value && this.player.grounded;
  },

  groundY() {
    return this.height - 88;
  },

  end(title, text) {
    this.ended = true;
    el.overlayTitle.textContent = title;
    el.overlayText.textContent = text;
    el.gameOverlay.classList.remove("hidden");
  },

  updateHud() {
    el.scoreValue.textContent = Math.floor(this.score);
    el.hpValue.textContent = Math.max(0, this.hp);
    el.timeValue.textContent = Math.max(0, Math.ceil(state.settings.game.duration - this.elapsed / 1000));
  },
};

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

init();
