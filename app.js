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
// REALTIME LOAD
// =========================
onSnapshot(collection(db, "goals"), (snapshot) => {

  goals = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // 🔥 защита от рассинхрона
    const checked = data.checked || [];

    const computedCurrent = checked.filter(Boolean).length;
    const computedCompleted = computedCurrent >= data.target;

    goals.push({
      id: docSnap.id,
      ...data,
      checked,
      current: computedCurrent,
      completed: computedCompleted
    });
  });

  goals.sort((a, b) => a.completed - b.completed);

  renderCards();
});

// =========================
// RENDER CARDS
// =========================
function renderCards() {

  cardsWrapper.innerHTML = "";

  goals.forEach((goal) => {

    const card = document.createElement("div");
    card.className = `card ${goal.theme || ""} ${goal.completed ? "completed" : ""}`;

    card.innerHTML = `
      <div class="card-title">${goal.title}</div>

      <div class="card-reward">🎁 ${goal.reward || "No reward"}</div>

      <div class="progress-text">
        ${goal.current} / ${goal.target}
      </div>

      <div class="punches" data-id="${goal.id}">
        ${renderPunches(goal)}
      </div>

      <button class="reset-btn" data-reset="${goal.id}">
        Reset
      </button>
    `;

    cardsWrapper.appendChild(card);
  });
}

// =========================
// RENDER PUNCHES
// =========================
function renderPunches(goal) {

  let html = "";

  const checked = goal.checked || [];

  for (let i = 0; i < goal.target; i++) {

    const filled = checked[i] === true;

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

  // =========================
  // PUNCH CLICK
  // =========================
  const punch = e.target.closest(".punch");

  if (punch) {

    const wrapper = punch.closest(".punches");
    const id = wrapper.dataset.id;

    const goal = goals.find(g => g.id === id);
    if (!goal || goal.completed) return;

    const index = Number(punch.dataset.index);

    const updated = [...(goal.checked || [])];

    // уже заполнен → ничего не делаем
    if (updated[index]) return;

    updated[index] = true;

    const newCurrent = updated.filter(Boolean).length;
    const newCompleted = newCurrent >= goal.target;

    await updateDoc(doc(db, "goals", id), {
      checked: updated,
      current: newCurrent,
      completed: newCompleted
    });

    return;
  }

  // =========================
  // RESET
  // =========================
  const resetBtn = e.target.closest("[data-reset]");

  if (resetBtn) {

    const id = resetBtn.dataset.reset;

    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const resetChecked = Array(goal.target).fill(false);

    await updateDoc(doc(db, "goals", id), {
      checked: resetChecked,
      current: 0,
      completed: false
    });

    return;
  }
});
