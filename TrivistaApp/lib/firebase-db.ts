/**
 * Initializes and exports the Firestore database instance.
 *
 * @module firebase-db
 */
import { getFirestore } from "firebase/firestore";
import app from "./firebase-config";

/**
 * Firestore database instance initialized with the main Firebase app.
 *
 * @const {Firestore}
 */
export const db = getFirestore(app);
