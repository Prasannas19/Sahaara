import { getFirestore } from 'firebase/firestore';
import { app } from './config';

// Firestore lives in its own module so the main app bundle can load
// without it; it is pulled in only by the lazily-loaded signed-in code.
export const db = getFirestore(app);
