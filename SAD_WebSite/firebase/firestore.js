import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function saveFeedback(userId, texto, score) {
  await addDoc(collection(db, "feedback"), {
    userId,
    texto,
    score,
    data: serverTimestamp()
  });
}

export async function getHistorico(userId) {
  const q = query(
    collection(db, "feedback"),
    where("userId", "==", userId),
    orderBy("data", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
