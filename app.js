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

const fabBtn = document.getElementById("fabBtn");
const addModal = document.getElementById("addModal");
const closeModal = document.getElementById("closeModal");
const addBtn = document.getElementById("addBtn");

const titleInput = document.getElementById("title");
const targetInput = document.getElementById("target");
const rewardInput = document.getElementById("reward");

let goals = [];

// =========================
// =========================
// MODAL
// =========================
function openModal() {
  addModal.classList.remove("hidden");
}

function closeGoalModal() {
  addModal.classList.add("hidden");
}

function clearInputs() {
  titleInput.value = "";
  targetInput.value = "";
  rewardInput.value = "";
}

// open
fabBtn.addEventListener("click", () => {
  openModal();
});

// close by X
closeModal?.addEventListener("click", () => {
  closeGoalModal();
});

// close by backdrop
addModal.addEventListener("click", (e) => {
  if (e.target === addModal) {
    closeGoalModal();
  }
});

// ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeGoalModal();
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
      ${goal.theme || ""}
      ${goal.completed ? "completed" : ""}
    `;

    card.dataset.id = goal.id;

    card.innerHTML = `
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

      <button class="delete-btn" data-delete="${goal.id}">
        Delete
      </button>

      <button class="reset-btn" data-reset="${goal.id}">
        Reset
      </button>
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
        <path d="
          M12 2
          C14 6,18 6,18 10
          C18 14,14 14,12 18
          C10 14,6 14,6 10
          C6 6,10 6,12 2Z
        "></path>
      `;

    case "theme-purple":
      return `
        <path d="M12 21s-6-4.3-9-8.5C.5 9 2.5 5 6 5c2 0 3.5 1.2 4 2 .5-.8 2-2 4-2 3.5 0 5.5 4 3 7.5C18 16.7 12 21 12 21z"></path>
      `;

    case "theme-blue":
    default:
      return `
        <circle cx="12" cy="12" r="6"></circle>
      `;
  }
}

// =========================
// GLOBAL CLICK HANDLER
// =========================
document.addEventListener("click", async (e) => {
  // DELETE
  const delBtn = e.target.closest("[data-delete]");

  if (delBtn) {
    const id = delBtn.dataset.delete;
    await deleteDoc(doc(db, "goals", id));
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

    if (updated.length < goal.target) {
      for (let i = 0; i < goal.target; i++) {
        updated[i] = updated[i] || false;
      }
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

  // RESET
  const resetBtn = e.target.closest("[data-reset]");

  if (resetBtn) {
    const id = resetBtn.dataset.reset;

    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    await updateDoc(doc(db, "goals", id), {
      checked: Array(goal.target).fill(false),
      current: 0,
      completed: false
    });

    return;
  }
});

// =========================
// NAV
// =========================
function renderNav() {
  const nav = document.getElementById("goalNav");
  nav.innerHTML = "";

  goals.forEach((g) => {
    const item = document.createElement("div");
    item.className = "goal-nav-item";
    item.textContent = g.title;

    item.onclick = () => {
      const card = document.querySelector(`[data-id="${g.id}"]`);

      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          inline: "center"
        });
      }
    };

    nav.appendChild(item);
  });
}

// =========================
// ADD GOAL
// =========================
addBtn?.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const target = Number(targetInput.value);
  const reward = rewardInput.value.trim();

  if (!title || !target || target <= 0) return;

  await addDoc(collection(db, "goals"), {
    title,
    target,
    reward: reward || "",
    current: 0,
    checked: Array(target).fill(false),
    completed: false,
    theme: "theme-blue"
  });

  clearInputs();
  closeGoalModal();
});
