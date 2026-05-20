import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cardsWrapper = document.getElementById("cardsWrapper");

let goals = [];

// =========================
// LOAD REALTIME DATA
// =========================
onSnapshot(collection(db, "goals"), (snapshot) => {

  goals = [];

  snapshot.forEach((docSnap) => {
    goals.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  // sort: active first
  goals.sort((a, b) => a.completed - b.completed);

  renderCards();
});

// =========================
// RENDER
// =========================
function renderCards() {

  cardsWrapper.innerHTML = "";

  goals.forEach((goal) => {

    const card = document.createElement("div");
    card.className = `card ${goal.theme || ""} ${goal.completed ? "completed" : ""}`;

    const punchesHTML = renderPunches(goal);

    card.innerHTML = `
      <div class="card-title">${goal.title}</div>
      <div class="card-reward">🎁 ${goal.reward || "No reward"}</div>

      <div class="progress-text">
        ${goal.current} / ${goal.target}
      </div>

      <div class="punches" data-id="${goal.id}">
        ${punchesHTML}
      </div>

      <button class="reset-btn" data-reset="${goal.id}">
        Reset
      </button>
    `;

    cardsWrapper.appendChild(card);
  });
}

// =========================
// PUNCH RENDER
// =========================
function renderPunches(goal) {

  let html = "";

  for (let i = 0; i < goal.target; i++) {

    const filled = i < goal.current;

    html += `
      <div class="punch ${filled ? "filled" : ""}"
           data-index="${i}">
      </div>
    `;
  }

  return html;
}

// =========================
// CLICK HANDLER
// =========================
document.addEventListener("click", async (e) => {

  const punch = e.target.closest(".punch");

  // =========================
  // +1 PROGRESS
  // =========================
  if (punch) {

    const wrapper = punch.closest(".punches");
    const id = wrapper.dataset.id;

    const goal = goals.find(g => g.id === id);

    if (!goal || goal.completed) return;

    const newCurrent = Math.min(goal.current + 1, goal.target);

    await updateDoc(doc(db, "goals", id), {
      current: newCurrent,
      completed: newCurrent >= goal.target
    });

    return;
  }

  // =========================
  // RESET
  // =========================
  const resetBtn = e.target.closest("[data-reset]");

  if (resetBtn) {

    const id = resetBtn.dataset.reset;

    await updateDoc(doc(db, "goals", id), {
      current: 0,
      completed: false
    });

    return;
  }
});
