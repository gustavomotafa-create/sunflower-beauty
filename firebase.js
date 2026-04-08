// Importa Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Config do site da sua esposa (NOVO PROJETO)
const firebaseConfig = {
  apiKey: "AIzaSyC8MeOV36Wm0ZJocnPFN7x5rNqls-kb4eM",
  authDomain: "sunflower-Beauty-maquiagem.firebaseapp.com",
  projectId: "sunflower-beauty-maquiagem",
  storageBucket: "sunflower-beauty-maquiagem.firebasestorage.app",
  messagingSenderId: "616836084056",
  appId: "1:616836084056:web:1c98fda77cbcbdaef752d"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporta
export { db };