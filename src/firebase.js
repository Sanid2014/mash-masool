import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// هذه معلومات مشروعك الخاصة اللي صورناها قبل شوي
const firebaseConfig = {
  apiKey: "AIzaSyAMmQR53p-gJ1NN0KXHd5-6UgMhzkKkOlw",
  authDomain: "mash-masool.firebaseapp.com",
  projectId: "mash-masool",
  storageBucket: "mash-masool.firebasestorage.app",
  messagingSenderId: "53594294414",
  appId: "1:53594294414:web:ef6ee531ce4c5f1be8e1df",
  measurementId: "G-JKMPHL1M3J"
};

// هنا نشغل الفايربيس
const app = initializeApp(firebaseConfig);

// هنا نطلع "قاعدة البيانات" عشان نستخدمها في الصفحات الثانية
export const db = getFirestore(app);