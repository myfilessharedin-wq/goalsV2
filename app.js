import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cardsWrapper = document.getElementById("cardsWrapper");
const goalNav = document.getElementById("goalNav");

const fabBtn = document.getElementById("fabBtn");
const addModal = document.getElementById("addModal");
const closeModal = document.getElementById("closeModal");
const addBtn = document.getElementById("addBtn");

const titleInput = document.getElementById("title");
const targetInput = document.getElementById("target");
const rewardInput = document.getElementById("reward");

let goals = [];
let editingGoalId = null;
const themes = [
  "theme-blue",
  "theme-pink",
  "theme-purple",
  "theme-star",
  "theme-holo"
];

function getRandomTheme() {
  return themes[Math.floor(Math.random() * themes.length)];
}
// =========================
// MODAL
// =========================
function openModal(goal = null) {
  addModal.classList.remove("hidden");

  if (goal) {
    editingGoalId = goal.id;
    titleInput.value = goal.title;
    targetInput.value = goal.target;
    rewardInput.value = goal.reward || "";
    addBtn.textContent = "Save Changes";
  } else {
    editingGoalId = null;
    clearInputs();
    addBtn.textContent = "Add Goal";
  }
}

function closeGoalModal() {
  addModal.classList.add("hidden");
  clearInputs();
  editingGoalId = null;
  addBtn.textContent = "Add Goal";
}

function clearInputs() {
  titleInput.value = "";
  targetInput.value = "";
  rewardInput.value = "";
}

// =========================
// MODAL EVENTS
// =========================
fabBtn.addEventListener("click", () => openModal());

closeModal?.addEventListener("click", closeGoalModal);

addModal.addEventListener("click", (e) => {
  if (e.target === addModal) closeGoalModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeGoalModal();

    document.querySelectorAll(".menu-dropdown").forEach((m) => {
      m.classList.add("hidden");
    });
  }
});

// =========================
// REALTIME LOAD
// =========================
onSnapshot(collection(db, "goals"), (snapshot) => {
  const newGoals = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const checked = data.checked || [];
    const current = checked.filter(Boolean).length;
    const completed = current >= data.target;

    newGoals.push({
      id: docSnap.id,
      ...data,
      checked,
      current,
      completed
    });
  });

  newGoals.sort((a, b) => a.completed - b.completed);

  goals = newGoals;

  renderCards();
  renderNav();
});

// =========================
// RENDER CARDS
// =========================
function renderCards() {
  cardsWrapper.innerHTML = "";

  goals.forEach((goal) => {
    const card = document.createElement("div");

    card.className = `
      card
      ${goal.theme || "theme-blue"}
      ${goal.completed ? "completed" : ""}
    `;

    card.dataset.id = goal.id;

    card.innerHTML = `
      <div class="card-menu">
        <button class="menu-btn" data-menu="${goal.id}">⋯</button>

        <div class="menu-dropdown hidden" data-menu-panel="${goal.id}">
          <div data-action="edit" data-id="${goal.id}">Edit</div>
          <div data-action="reset" data-id="${goal.id}">Reset</div>
          <div data-action="delete" data-id="${goal.id}">Delete</div>
        </div>
      </div>

      <div class="card-title">${goal.title}</div>

      <div class="card-reward">
        🎁 ${goal.reward || "No reward"}
      </div>

      <div class="progress-text">
        ${goal.current} / ${goal.target}
      </div>

      <div class="punches" data-id="${goal.id}">
        ${renderPunches(goal)}
      </div>
    `;

    cardsWrapper.appendChild(card);
  });
}

// =========================
// PUNCHES
// =========================
function renderPunches(goal) {
  const checked = goal.checked || [];
  let html = "";

  for (let i = 0; i < goal.target; i++) {
    const filled = checked[i] === true;

    html += `
      <svg
        class="punch ${filled ? "filled" : ""}"
        data-index="${i}"
        viewBox="0 0 24 24"
      >
        ${getShape(goal.theme)}
      </svg>
    `;
  }

  return html;
}

// =========================
// SHAPES
// =========================
function getShape(theme) {
  switch (theme) {
    case "theme-star":
      return `
        <path d="M12 2l2.9 6.6L22 9.3l-5 4.6L18.3 21 12 17.4 5.7 21 7 13.9 2 9.3l7.1-.7L12 2z"></path>
      `;

    case "theme-holo":
      return `
        <circle cx="12" cy="7" r="3"></circle>
        <circle cx="17" cy="12" r="3"></circle>
        <circle cx="12" cy="17" r="3"></circle>
        <circle cx="7" cy="12" r="3"></circle>
        <circle cx="12" cy="12" r="2"></circle>
      `;

    case "theme-pink":
      return `
        <path d="M12 2 C14 6,18 6,18 10 C18 14,14 14,12 18 C10 14,6 14,6 10 C6 6,10 6,12 2Z"></path>
      `;

    case "theme-purple":
      return `
        <path d="M12 21s-6-4.3-9-8.5C.5 9 2.5 5 6 5c2 0 3.5 1.2 4 2 .5-.8 2-2 4-2 3.5 0 5.5 4 3 7.5C18 16.7 12 21 12 21z"></path>
      `;

    case "theme-blue":
    default:
      return `<circle cx="12" cy="12" r="6"></circle>`;
  }
}

// =========================
// NAV
// =========================
function renderNav() {
  goalNav.innerHTML = "";

  goals.forEach((goal) => {
    const item = document.createElement("div");
    item.className = "goal-nav-item";
    item.textContent = goal.title;

    item.onclick = () => {
      const card = document.querySelector(`[data-id="${goal.id}"]`);

      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        });
      }
    };

    goalNav.appendChild(item);
  });
}

// =========================
// SAVE (ADD / EDIT)
// =========================
addBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const target = Number(targetInput.value);
  const reward = rewardInput.value.trim();

  if (!title || !target || target <= 0) return;

  // ADD
  if (!editingGoalId) {
    await addDoc(collection(db, "goals"), {
      title,
      priority: Number(priorityInput.value),
      target,
      reward: reward || "",
      current: 0,
      checked: Array(target).fill(false),
      completed: false,
 theme: getRandomTheme()
    });

    closeGoalModal();
    return;
  }

  // EDIT
  const goal = goals.find((g) => g.id === editingGoalId);
  if (!goal) return;

  const newChecked = Array(target)
    .fill(false)
    .map((_, i) => goal.checked?.[i] || false);

  const newCurrent = newChecked.filter(Boolean).length;
  const newCompleted = newCurrent >= target;

  await updateDoc(doc(db, "goals", editingGoalId), {
    title,
    reward,
    target,
    checked: newChecked,
    current: newCurrent,
    completed: newCompleted
  });

  closeGoalModal();
});

// =========================
// GLOBAL CLICK HANDLER
// =========================
document.addEventListener("click", async (e) => {
  // MENU TOGGLE
  const menuBtn = e.target.closest("[data-menu]");

  if (menuBtn) {
    const id = menuBtn.dataset.menu;
    const panel = document.querySelector(
      `[data-menu-panel="${id}"]`
    );

    document.querySelectorAll(".menu-dropdown").forEach((m) => {
      if (m !== panel) m.classList.add("hidden");
    });

    panel.classList.toggle("hidden");
    return;
  }

  // MENU ACTIONS
  const action = e.target.closest("[data-action]");

  if (action) {
    const id = action.dataset.id;
    const type = action.dataset.action;

    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    if (type === "delete") {
      await deleteDoc(doc(db, "goals", id));
    }

    if (type === "reset") {
      await updateDoc(doc(db, "goals", id), {
        checked: Array(goal.target).fill(false),
        current: 0,
        completed: false
      });
    }

    if (type === "edit") {
      openModal(goal);
    }

    document.querySelectorAll(".menu-dropdown").forEach((m) => {
      m.classList.add("hidden");
    });

    return;
  }

  // PUNCH
  const punch = e.target.closest(".punch");

  if (punch) {
    const wrapper = punch.closest(".punches");
    const id = wrapper.dataset.id;

    const goal = goals.find((g) => g.id === id);
    if (!goal || goal.completed) return;

    const index = Number(punch.dataset.index);

    const updated = [...(goal.checked || [])];

    for (let i = 0; i < goal.target; i++) {
      updated[i] = updated[i] || false;
    }

    updated[index] = !updated[index];

    const newCurrent = updated.filter(Boolean).length;
    const newCompleted = newCurrent >= goal.target;

    await updateDoc(doc(db, "goals", id), {
      checked: updated,
      current: newCurrent,
      completed: newCompleted
    });

    if (navigator.vibrate) {
      navigator.vibrate(15);
    }

    return;
  }

  // CLOSE MENU ON OUTSIDE CLICK
  document.querySelectorAll(".menu-dropdown").forEach((m) => {
    m.classList.add("hidden");
  });
});
