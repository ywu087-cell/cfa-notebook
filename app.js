const state = {
  activeChapter: CFA_CHAPTERS[0].id,
  flipped: false,
  cardIndex: 0,
  quizIndex: 0,
  reviewOnly: false,
  searchTerm: "",
  completed: new Set(JSON.parse(localStorage.getItem("cfaNotebookCompleted") || "[]"))
};

const moduleList = document.getElementById("moduleList");
const searchInput = document.getElementById("searchInput");
const reviewMode = document.getElementById("reviewMode");
const chapterPath = document.getElementById("chapterPath");
const chapterTitle = document.getElementById("chapterTitle");
const chapterSummary = document.getElementById("chapterSummary");
const plainExplain = document.getElementById("plainExplain");
const deepDive = document.getElementById("deepDive");
const analogy = document.getElementById("analogy");
const financeUse = document.getElementById("financeUse");
const formulaList = document.getElementById("formulaList");
const scenarioLine = document.getElementById("scenarioLine");
const memoryLine = document.getElementById("memoryLine");
const trapLine = document.getElementById("trapLine");
const conceptCard = document.getElementById("conceptCard");
const cardFront = document.getElementById("cardFront");
const flipCard = document.getElementById("flipCard");
const nextCard = document.getElementById("nextCard");
const nextQuiz = document.getElementById("nextQuiz");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizFeedback = document.getElementById("quizFeedback");
const mindMap = document.getElementById("mindMap");
const mapSummary = document.getElementById("mapSummary");
const relationshipList = document.getElementById("relationshipList");
const crossLinks = document.getElementById("crossLinks");
const markDone = document.getElementById("markDone");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");

function getChapter(id) {
  return CFA_CHAPTERS.find((chapter) => chapter.id === id) || CFA_CHAPTERS[0];
}

function saveProgress() {
  localStorage.setItem("cfaNotebookCompleted", JSON.stringify([...state.completed]));
}

function matchesSearch(chapter) {
  if (!state.searchTerm) return true;
  const haystack = [
    chapter.title,
    chapter.module,
    chapter.summary,
    chapter.memory,
    chapter.trap,
    ...(chapter.cards || []).flatMap((card) => [card.front, card.back]),
    ...chapter.crossLinks,
    ...chapter.map.flat(),
    ...chapter.deepDive.flat()
  ].join(" ").toLowerCase();
  return haystack.includes(state.searchTerm.toLowerCase());
}

function visibleChapters() {
  return CFA_CHAPTERS.filter((chapter) => {
    const reviewMatch = !state.reviewOnly || !state.completed.has(chapter.id);
    return reviewMatch && matchesSearch(chapter);
  });
}

function renderLibrary() {
  const chapters = visibleChapters();
  const modules = [...new Set(chapters.map((chapter) => chapter.module))];
  moduleList.innerHTML = "";

  if (!chapters.length) {
    moduleList.innerHTML = '<div class="empty-state">没有匹配的章节。可以清空搜索，或退出复习中心。</div>';
    return;
  }

  modules.forEach((moduleName) => {
    const block = document.createElement("div");
    block.className = "module-block";
    block.innerHTML = `<p class="module-title">${moduleName}</p>`;

    chapters
      .filter((chapter) => chapter.module === moduleName)
      .forEach((chapter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chapter-button";
        button.classList.toggle("active", chapter.id === state.activeChapter);
        button.classList.toggle("done", state.completed.has(chapter.id));
        button.innerHTML = `<strong>${chapter.title}</strong><span>${chapter.summary}</span>`;
        button.addEventListener("click", () => renderChapter(chapter.id));
        block.appendChild(button);
      });

    moduleList.appendChild(block);
  });
}

function renderPairs(container, pairs) {
  container.innerHTML = "";
  pairs.forEach(([label, detail]) => {
    const item = document.createElement("div");
    item.className = "lesson-point";
    item.innerHTML = `<strong>${label}</strong><span>${detail}</span>`;
    container.appendChild(item);
  });
}

function updateProgress() {
  const total = CFA_CHAPTERS.length;
  progressText.textContent = `${state.completed.size} / ${total}`;
  progressBar.style.width = `${(state.completed.size / total) * 100}%`;
  markDone.textContent = state.completed.has(state.activeChapter) ? "已掌握" : "标记掌握";
  markDone.classList.toggle("done", state.completed.has(state.activeChapter));
  reviewMode.textContent = state.reviewOnly ? "全部章节" : "复习中心";
}

function renderQuiz(chapter) {
  const quiz = chapter.quizzes[state.quizIndex];
  quizQuestion.textContent = `第 ${state.quizIndex + 1} 题：${quiz.question}`;
  quizFeedback.textContent = "";
  quizOptions.innerHTML = "";

  quiz.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => {
      quizOptions.querySelectorAll("button").forEach((item) => {
        item.disabled = true;
        item.classList.remove("correct", "wrong");
      });

      if (index === quiz.answer) {
        button.classList.add("correct");
        quizFeedback.textContent = quiz.feedback;
      } else {
        button.classList.add("wrong");
        quizFeedback.textContent = "还不对。先判断这个场景里的现金流、风险、利率或相关性发生了什么变化。";
      }
    });
    quizOptions.appendChild(button);
  });
}

function chapterCards(chapter) {
  return chapter.cards || [{ front: chapter.title, back: chapter.cardBack }];
}

function renderConceptCard(chapter) {
  const cards = chapterCards(chapter);
  const card = cards[state.cardIndex % cards.length];
  cardFront.textContent = state.flipped ? card.back : card.front;
  conceptCard.querySelector("span").textContent = state.flipped
    ? `${state.cardIndex + 1} / ${cards.length} 点击回到题面`
    : `${state.cardIndex + 1} / ${cards.length} 点击查看答案`;
}

function renderMap(chapter) {
  mapSummary.textContent = `${chapter.title} 的因果关系与跨主题连接`;
  mindMap.innerHTML = "";

  const root = document.createElement("div");
  root.className = "map-node root";
  root.innerHTML = `<strong>${chapter.title}</strong><span>${chapter.memory}</span>`;
  mindMap.appendChild(root);

  chapter.map.forEach(([name, detail]) => {
    const node = document.createElement("div");
    node.className = "map-node";
    node.innerHTML = `<strong>${name}</strong><span>${detail}</span>`;
    mindMap.appendChild(node);
  });

  relationshipList.innerHTML = '<div class="relationship-list"></div>';
  const list = relationshipList.querySelector(".relationship-list");
  chapter.relationships.forEach(([from, verb, to, detail]) => {
    const item = document.createElement("div");
    item.className = "relationship-item";
    item.innerHTML = `<strong>${from}</strong><em>${verb}</em><strong>${to}</strong><span>${detail}</span>`;
    list.appendChild(item);
  });

  crossLinks.innerHTML = '<div class="cross-link-list"></div>';
  const chips = crossLinks.querySelector(".cross-link-list");
  chapter.crossLinks.forEach((link) => {
    const chip = document.createElement("span");
    chip.className = "cross-link";
    chip.textContent = link;
    chips.appendChild(chip);
  });
}

function renderChapter(chapterId) {
  const chapter = getChapter(chapterId);
  state.activeChapter = chapter.id;
  state.flipped = false;
  state.cardIndex = 0;
  state.quizIndex = 0;

  chapterPath.textContent = `${chapter.level} / ${chapter.module}`;
  chapterTitle.textContent = chapter.title;
  chapterSummary.textContent = chapter.summary;
  plainExplain.textContent = chapter.plain;
  renderPairs(deepDive, chapter.deepDive);
  analogy.textContent = chapter.analogy;
  financeUse.textContent = chapter.finance;
  renderPairs(formulaList, chapter.formulas);
  scenarioLine.textContent = chapter.scenario;
  memoryLine.textContent = chapter.memory;
  trapLine.textContent = chapter.trap;
  renderConceptCard(chapter);

  renderQuiz(chapter);
  renderMap(chapter);
  renderLibrary();
  updateProgress();
}

function flipConceptCard() {
  const chapter = getChapter(state.activeChapter);
  state.flipped = !state.flipped;
  renderConceptCard(chapter);
}

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value.trim();
  renderLibrary();
});

reviewMode.addEventListener("click", () => {
  state.reviewOnly = !state.reviewOnly;
  renderLibrary();
  updateProgress();
});

conceptCard.addEventListener("click", flipConceptCard);
flipCard.addEventListener("click", flipConceptCard);
nextCard.addEventListener("click", () => {
  const chapter = getChapter(state.activeChapter);
  const cards = chapterCards(chapter);
  state.cardIndex = (state.cardIndex + 1) % cards.length;
  state.flipped = false;
  renderConceptCard(chapter);
});
nextQuiz.addEventListener("click", () => {
  const chapter = getChapter(state.activeChapter);
  state.quizIndex = (state.quizIndex + 1) % chapter.quizzes.length;
  renderQuiz(chapter);
});
markDone.addEventListener("click", () => {
  if (state.completed.has(state.activeChapter)) {
    state.completed.delete(state.activeChapter);
  } else {
    state.completed.add(state.activeChapter);
  }
  saveProgress();
  renderLibrary();
  updateProgress();
});

renderChapter(state.activeChapter);
