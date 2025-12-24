import { db } from "../JS/firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc
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

// Apriori-related functions
export async function saveTransaction(transaction) {
  await addDoc(collection(db, "transactions"), {
    items: transaction,
    data: serverTimestamp()
  });
}

export async function getAllTransactions() {
  const q = query(collection(db, "transactions"), orderBy("data", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().items);
}

export async function saveFrequentItemsets(itemsets) {
  const docRef = doc(db, "apriori", "frequentItemsets");
  await updateDoc(docRef, {
    itemsets,
    lastUpdated: serverTimestamp()
  });
}

export async function getFrequentItemsets() {
  const docRef = doc(db, "apriori", "frequentItemsets");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

export async function saveAssociationRules(rules) {
  const docRef = doc(db, "apriori", "associationRules");
  await updateDoc(docRef, {
    rules,
    lastUpdated: serverTimestamp()
  });
}

export async function getAssociationRules() {
  const docRef = doc(db, "apriori", "associationRules");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}
