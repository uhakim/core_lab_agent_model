const STORAGE_KEY = "ai-game-lab-state-v1";

const DEFAULT_SETTINGS = {
  template: "runner",
  player: {
    name: "번개 고양이",
    archetype: "animal",
    accessory: "lightning",
    color: "yellow",
    speed: 4,
    hp: 3,
    jumpPower: 8,
  },
  background: "forest",
  obstacle: {
    name: "선인장",
    type: "cactus",
    shape: "spiky",
    speed: 4,
    spawnRate: 1400,
  },
  item: {
    name: "별",
    type: "star",
    shape: "star",
    score: 10,
    spawnRate: 1800,
  },
  game: {
    difficulty: "normal",
    duration: 60,
    goalScore: 100,
  },
};

const STEPS = [
  {
    id: "player",
    label: "캐릭터",
    question: "캐릭터는 어떤 모습이면 좋을까요?",
    hint: "동물, 로봇, 음식, 탈것처럼 자유롭게 말해도 됩니다.",
    placeholder: "예: 소, 상어, 피카츄, 햄버거",
    choices: ["고양이", "로봇", "토끼", "공룡"],
    fallback: "고양이",
  },
  {
    id: "background",
    label: "배경",
    question: "배경은 어떤 곳이면 좋을까요?",
    hint: "없는 장소를 말해도 가장 가까운 분위기로 바꿉니다.",
    placeholder: "예: 화산, 바닷속, 우주 정거장",
    choices: ["숲", "우주", "사막", "바다"],
    fallback: "숲",
  },
  {
    id: "obstacle",
    label: "장애물",
    question: "장애물은 무엇이 나오면 좋을까요?",
    hint: "러닝 게임 규칙은 유지하고, 장애물 모양과 이름을 바꿉니다.",
    placeholder: "예: 바나나 껍질, 운석, 물웅덩이",
    choices: ["선인장", "돌", "구름", "상자"],
    fallback: "선인장",
  },
  {
    id: "item",
    label: "아이템",
    question: "무엇을 모으면 점수가 오르면 좋을까요?",
    hint: "아이템 이름과 모양을 게임에 맞게 바꿉니다.",
    placeholder: "예: 사탕, 보석, 하트",
    choices: ["별", "코인", "하트", "보석"],
    fallback: "별",
  },
  {
    id: "difficulty",
    label: "난이도",
    question: "게임 난이도는 어떤 느낌이면 좋을까요?",
    hint: "규칙은 그대로 두고 속도와 등장 간격만 조정합니다.",
    placeholder: "예: 쉽게, 어렵게, 보통",
    choices: ["쉬움", "보통", "어려움"],
    fallback: "보통",
  },
];

const DISPLAY = {
  background: {
    forest: "숲",
    space: "우주",
    desert: "사막",
    ocean: "바다",
    school: "학교",
  },
  color: {
    red: "빨강",
    blue: "파랑",
    yellow: "노랑",
    green: "초록",
    purple: "보라",
    black: "검정",
    white: "하양",
    orange: "주황",
    pink: "분홍",
    brown: "갈색",
    gray: "회색",
  },
  difficulty: {
    easy: "쉬움",
    normal: "보통",
    hard: "어려움",
  },
};

const state = {
  stepIndex: 0,
  draft: structuredClone(DEFAULT_SETTINGS),
  answered: new Set(),
  messages: [],
};

const el = {};

function initCreator() {
  bindCreatorElements();
  bindCreatorEvents();
  renderCreator();
}

function bindCreatorElements() {
  [
    "stepLabel",
    "questionTitle",
    "stepPills",
    "agentBubble",
    "choiceGrid",
    "creatorForm",
    "customAnswer",
    "backStepBtn",
    "skipStepBtn",
    "draftSummary",
    "finalPanel",
    "createGameBtn",
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
}

function bindCreatorEvents() {
  el.creatorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const answer = el.customAnswer.value.trim();
    if (!answer) return;
    answerStep(answer);
  });

  el.backStepBtn.addEventListener("click", () => {
    state.stepIndex = Math.max(0, state.stepIndex - 1);
    renderCreator();
  });

  el.skipStepBtn.addEventListener("click", () => {
    answerStep(currentStep().fallback);
  });

  el.createGameBtn.addEventListener("click", () => {
    const payload = {
      settings: state.draft,
      history: [],
      journals: [],
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.location.href = "./play.html";
  });
}

function currentStep() {
  return STEPS[state.stepIndex];
}

function answerStep(answer) {
  const step = currentStep();
  const mapped = mapAnswer(step.id, answer, state.draft);
  state.draft = mergeDeep(state.draft, mapped.changes);
  state.answered.add(step.id);
  state.messages.push(mapped.explanation);
  el.customAnswer.value = "";

  if (state.stepIndex < STEPS.length - 1) {
    state.stepIndex += 1;
  }
  renderCreator();
}

function mapAnswer(stepId, answer, draft) {
  if (stepId === "player") return mapPlayer(answer);
  if (stepId === "background") return mapBackground(answer);
  if (stepId === "obstacle") return mapObstacle(answer);
  if (stepId === "item") return mapItem(answer);
  return mapDifficulty(answer, draft);
}

function mapPlayer(answer) {
  const normalized = answer.toLowerCase();
  const base = {
    name: answer,
    archetype: "custom",
    accessory: "none",
    color: "green",
  };

  if (hasAny(normalized, ["피카", "pikachu", "번개"])) {
    return playerResult("노란 번개 캐릭터", "animal", "lightning", "yellow", "노란색 번개 느낌의 캐릭터로 일반화했어요.");
  }
  if (hasAny(normalized, ["소", "cow"])) {
    return playerResult("달리는 소", "animal", "horns", "brown", "갈색 몸통과 뿔이 있는 달리는 소로 만들게요.");
  }
  if (hasAny(normalized, ["상어", "shark", "물고기", "생선"])) {
    return playerResult("파란 상어", "animal", "fin", "blue", "파란색 지느러미가 있는 상어 느낌으로 만들게요.");
  }
  if (hasAny(normalized, ["고양", "cat"])) {
    return playerResult("번개 고양이", "animal", "ears", "yellow", "귀와 꼬리가 있는 고양이 캐릭터로 만들게요.");
  }
  if (hasAny(normalized, ["로봇", "robot"])) {
    return playerResult("파란 로봇", "robot", "helmet", "blue", "파란 로봇 캐릭터로 만들게요.");
  }
  if (hasAny(normalized, ["토끼", "rabbit"])) {
    return playerResult("분홍 토끼", "animal", "ears", "pink", "긴 귀가 있는 토끼 캐릭터로 만들게요.");
  }
  if (hasAny(normalized, ["공룡", "용", "dragon"])) {
    return playerResult("초록 공룡", "fantasy", "tail", "green", "꼬리가 있는 초록 공룡 캐릭터로 만들게요.");
  }
  if (hasAny(normalized, ["자동차", "차", "car"])) {
    return playerResult("빨간 자동차", "vehicle", "wheels", "red", "빨간 자동차 느낌의 캐릭터로 만들게요.");
  }
  if (hasAny(normalized, ["햄버거", "burger", "음식"])) {
    return playerResult("달리는 햄버거", "food", "none", "orange", "둥근 음식 캐릭터 느낌으로 만들게요.");
  }
  if (hasAny(normalized, ["귀신", "유령", "ghost"])) {
    return playerResult("하얀 유령", "monster", "floating", "white", "둥둥 떠다니는 유령 느낌으로 만들게요.");
  }

  return {
    changes: { player: base },
    explanation: `${answer}을 게임에 맞는 자유 캐릭터로 만들게요.`,
  };
}

function playerResult(name, archetype, accessory, color, explanation) {
  return {
    changes: {
      player: {
        name,
        archetype,
        accessory,
        color,
      },
    },
    explanation,
  };
}

function mapBackground(answer) {
  const normalized = answer.toLowerCase();
  if (hasAny(normalized, ["우주", "space", "별"])) {
    return backgroundResult("space", "우주 느낌의 배경으로 만들게요.");
  }
  if (hasAny(normalized, ["화산", "용암", "불"])) {
    return backgroundResult("desert", "현재 배경 중에서는 사막을 바탕으로 붉은 화산 분위기에 가깝게 만들게요.");
  }
  if (hasAny(normalized, ["바다", "물", "ocean", "상어"])) {
    return backgroundResult("ocean", "바다 느낌의 배경으로 만들게요.");
  }
  if (hasAny(normalized, ["학교", "교실", "school"])) {
    return backgroundResult("school", "학교 느낌의 배경으로 만들게요.");
  }
  if (hasAny(normalized, ["사막", "desert"])) {
    return backgroundResult("desert", "사막 배경으로 만들게요.");
  }
  return backgroundResult("forest", `${answer}은 숲 배경을 바탕으로 상상해서 시작할게요.`);
}

function backgroundResult(background, explanation) {
  return {
    changes: { background },
    explanation,
  };
}

function mapObstacle(answer) {
  const normalized = answer.toLowerCase();
  if (hasAny(normalized, ["바나나", "껍질"])) {
    return obstacleResult("바나나 껍질", "cactus", "slippery", "미끄러운 바나나 껍질 장애물로 이름을 바꿀게요.");
  }
  if (hasAny(normalized, ["운석", "돌", "rock"])) {
    return obstacleResult("운석", "rock", "rock", "돌처럼 생긴 운석 장애물로 만들게요.");
  }
  if (hasAny(normalized, ["구름", "cloud"])) {
    return obstacleResult("먹구름", "cloud", "cloud", "구름 모양 장애물로 만들게요.");
  }
  if (hasAny(normalized, ["상자", "박스", "box"])) {
    return obstacleResult("상자", "rock", "box", "상자처럼 보이는 장애물로 만들게요.");
  }
  return obstacleResult(answer, "cactus", "custom", `${answer}을 피해야 하는 장애물로 만들게요.`);
}

function obstacleResult(name, type, shape, explanation) {
  return {
    changes: {
      obstacle: {
        name,
        type,
        shape,
      },
    },
    explanation,
  };
}

function mapItem(answer) {
  const normalized = answer.toLowerCase();
  if (hasAny(normalized, ["코인", "동전", "coin"])) {
    return itemResult("코인", "coin", "coin", "코인을 모으면 점수가 오르게 할게요.");
  }
  if (hasAny(normalized, ["하트", "heart", "체력"])) {
    return itemResult("하트", "heart", "heart", "하트를 먹으면 점수와 함께 도움이 되게 할게요.");
  }
  if (hasAny(normalized, ["보석", "gem"])) {
    return itemResult("보석", "star", "gem", "보석 느낌의 반짝이는 아이템으로 만들게요.");
  }
  return itemResult(answer || "별", "star", "star", `${answer || "별"}을 모으는 아이템으로 만들게요.`);
}

function itemResult(name, type, shape, explanation) {
  return {
    changes: {
      item: {
        name,
        type,
        shape,
      },
    },
    explanation,
  };
}

function mapDifficulty(answer) {
  const normalized = answer.toLowerCase();
  if (hasAny(normalized, ["쉬", "easy", "천천히"])) {
    return {
      changes: {
        game: { difficulty: "easy", duration: 60, goalScore: 80 },
        obstacle: { speed: 3, spawnRate: 1900 },
      },
      explanation: "장애물이 천천히 나오도록 쉬운 난이도로 설정할게요.",
    };
  }
  if (hasAny(normalized, ["어렵", "hard", "빠르게", "자주"])) {
    return {
      changes: {
        game: { difficulty: "hard", duration: 60, goalScore: 130 },
        obstacle: { speed: 6, spawnRate: 950 },
      },
      explanation: "장애물이 더 빠르고 자주 나오도록 어려운 난이도로 설정할게요.",
    };
  }
  return {
    changes: {
      game: { difficulty: "normal", duration: 60, goalScore: 100 },
      obstacle: { speed: 4, spawnRate: 1400 },
    },
    explanation: "처음 실험하기 좋은 보통 난이도로 설정할게요.",
  };
}

function renderCreator() {
  const step = currentStep();
  const complete = state.answered.size === STEPS.length;
  el.stepLabel.textContent = `${Math.min(state.stepIndex + 1, STEPS.length)} / ${STEPS.length}`;
  el.questionTitle.textContent = complete ? "설정을 확인해 주세요" : step.question;
  el.agentBubble.textContent = complete
    ? "모든 질문에 답했어요. 설정을 확인하고 게임 만들기를 누르면 작업실로 이동합니다."
    : step.hint;
  el.customAnswer.placeholder = complete ? "모든 질문이 끝났습니다." : step.placeholder;
  el.customAnswer.disabled = complete;
  el.skipStepBtn.disabled = complete;
  el.backStepBtn.disabled = complete || state.stepIndex === 0;

  renderSteps();
  renderChoices(complete ? null : step);
  renderSummary();
  el.finalPanel.classList.toggle("hidden", !complete);
}

function renderSteps() {
  el.stepPills.innerHTML = STEPS.map((step, index) => {
    const done = state.answered.has(step.id);
    const active = index === state.stepIndex && !state.answered.has(step.id);
    return `<span class="step-pill ${done ? "done" : ""} ${active ? "active" : ""}">${step.label}</span>`;
  }).join("");
}

function renderChoices(step) {
  if (!step) {
    el.choiceGrid.innerHTML = "";
    return;
  }
  el.choiceGrid.innerHTML = step.choices
    .map((choice) => `<button class="choice-button" type="button" data-choice="${escapeHtml(choice)}">${choice}</button>`)
    .join("");
  el.choiceGrid.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => answerStep(button.dataset.choice));
  });
}

function renderSummary() {
  const settings = state.draft;
  const latest = state.messages[state.messages.length - 1] || "아직 답변을 기다리고 있어요.";
  el.draftSummary.innerHTML = `
    <article class="summary-item">
      <span>캐릭터</span>
      <strong>${settings.player.name || "아직 안 정함"}</strong>
      <small>${display("color", settings.player.color)} · ${settings.player.accessory || "장식 없음"}</small>
    </article>
    <article class="summary-item">
      <span>배경</span>
      <strong>${display("background", settings.background) || "아직 안 정함"}</strong>
      <small>게임 분위기</small>
    </article>
    <article class="summary-item">
      <span>장애물</span>
      <strong>${settings.obstacle.name || display("obstacle", settings.obstacle.type)}</strong>
      <small>${settings.obstacle.shape || "기본 모양"}</small>
    </article>
    <article class="summary-item">
      <span>아이템</span>
      <strong>${settings.item.name || display("item", settings.item.type)}</strong>
      <small>${settings.item.score}점</small>
    </article>
    <article class="summary-item">
      <span>난이도</span>
      <strong>${display("difficulty", settings.game.difficulty)}</strong>
      <small>장애물 간격 ${settings.obstacle.spawnRate}ms</small>
    </article>
    <div class="agent-note">${escapeHtml(latest)}</div>
  `;
}

function display(type, value) {
  if (type === "background") return DISPLAY.background[value] || value;
  if (type === "color") return DISPLAY.color[value] || value;
  if (type === "difficulty") return DISPLAY.difficulty[value] || value;
  return value;
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

initCreator();
