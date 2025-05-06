// lib/firebase-db.ts
import { getFirestore } from "firebase/firestore";
import app from "./firebase-config";

export const db = getFirestore(app);
