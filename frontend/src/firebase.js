import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDw-HHdksQE3kz9am1Qbh6-qYcocdIID24",
  authDomain: "sociomee-ai.firebaseapp.com",
  projectId: "sociomee-ai",
  storageBucket: "sociomee-ai.firebasestorage.app",
  messagingSenderId: "989035249323",
  appId: "1:989035249323:web:a8e0144cbd74ea058781ee"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
