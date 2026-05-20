import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxYBR2OWosExkGfynF9cF38BFF3Onidyk",
  authDomain: "goals-ca808.firebaseapp.com",
  projectId: "goals-ca808",
  storageBucket: "goals-ca808.firebasestorage.app",
  messagingSenderId: "667647333017",
  appId: "1:667647333017:web:d4966e0613f7b71a525e08",
  measurementId: "G-2FW7B253N7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);