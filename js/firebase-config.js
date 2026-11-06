// ===== CONFIGURATION FIREBASE =====
// La clé "apiKey" d'une appli web Firebase n'est pas un secret : la sécurité vient des règles de la base
// (voir firebase/database.rules.json). Même projet que tes autres jeux.
const SG_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBwoQqcFCH7ssSUyGkFd52v6Wam1O4WiVw",
  authDomain: "lexica-488e9.firebaseapp.com",
  databaseURL: "https://lexica-488e9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lexica-488e9",
  storageBucket: "lexica-488e9.firebasestorage.app",
  messagingSenderId: "3644116964",
  appId: "1:3644116964:web:5ae47e4211bb5603c301f1"
};
const SG_TEACHER_EMAIL = "julie.granger.rennes@gmail.com"; // doit être identique à l'email des règles
const SG_DB_PATH = "jeux/natures";                           // nœud de la base (voir règles)
