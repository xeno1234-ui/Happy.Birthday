import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import config from '../firebase-applet-config.json';
import { WishItem } from './types.ts';

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

// Ensure anonymous authentication so security rules allow all devices to read/write smoothly
let isAuthInit = false;
export const initAuth = async () => {
  if (isAuthInit) return;
  try {
    await signInAnonymously(auth);
    isAuthInit = true;
  } catch (err) {
    console.warn('Firebase anonymous auth note:', err);
  }
};
initAuth();

const WISHES_COLLECTION = 'wishes';

/**
 * Saves a new wish permanently to Firebase Firestore so all users and devices can view it.
 */
export async function addSharedWish(wishText: string): Promise<WishItem> {
  const trimmed = wishText.trim();
  const dateStr = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timestamp = Date.now();
  const tempId = 'wish_' + timestamp;

  const tempWish: WishItem = {
    id: tempId,
    wish: trimmed,
    timestamp,
    dateStr,
  };

  // Immediate local cache for zero-latency UI
  cacheWishLocally(tempWish);

  try {
    await initAuth();
    const docRef = await addDoc(collection(db, WISHES_COLLECTION), {
      wish: trimmed,
      timestamp,
      dateStr,
      authorId: auth.currentUser?.uid || 'anon',
    });

    const finalWish: WishItem = {
      id: docRef.id,
      wish: trimmed,
      timestamp,
      dateStr,
    };

    // Replace temp local wish with the firestore document id
    updateLocalWishId(tempId, finalWish);
    return finalWish;
  } catch (error) {
    console.warn('Firestore addDoc background sync notice:', error);
    return tempWish;
  }
}


/**
 * Deletes a wish permanently from Firestore and updates all connected devices.
 */
export async function deleteSharedWish(wishId: string): Promise<void> {
  await initAuth();
  try {
    // If it's a firestore document id
    if (!wishId.startsWith('wish_')) {
      await deleteDoc(doc(db, WISHES_COLLECTION, wishId));
    }
  } catch (error) {
    console.warn('Firestore deleteDoc note:', error);
  }

  // Update local storage backup
  try {
    const stored = localStorage.getItem('birthday_wishes_collection');
    if (stored) {
      const list: WishItem[] = JSON.parse(stored);
      const filtered = list.filter(w => w.id !== wishId);
      localStorage.setItem('birthday_wishes_collection', JSON.stringify(filtered));
    }
  } catch {}
}

/**
 * Subscribes to real-time updates from Firestore.
 * Every device viewing the page will receive updates instantly when any user adds/deletes a wish.
 */
export function subscribeToSharedWishes(onUpdate: (wishes: WishItem[]) => void): () => void {
  initAuth();
  const q = query(collection(db, WISHES_COLLECTION), orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    snapshot => {
      const liveWishes: WishItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        liveWishes.push({
          id: docSnap.id,
          wish: data.wish || '',
          timestamp: data.timestamp || 0,
          dateStr: data.dateStr || 'Special Day',
        });
      });

      // Save to localStorage as well for instant loading
      try {
        localStorage.setItem('birthday_wishes_collection', JSON.stringify(liveWishes));
      } catch {}

      onUpdate(liveWishes);
    },
    error => {
      console.warn('Firestore live subscription fallback:', error);
      // Fallback to local storage if offline or firestore unavailable
      try {
        const stored = localStorage.getItem('birthday_wishes_collection');
        if (stored) {
          onUpdate(JSON.parse(stored));
        }
      } catch {}
    }
  );

  return unsubscribe;
}

function cacheWishLocally(newWish: WishItem) {
  try {
    const raw = localStorage.getItem('birthday_wishes_collection');
    const list: WishItem[] = raw ? JSON.parse(raw) : [];
    if (!list.some(w => w.id === newWish.id)) {
      list.push(newWish);
      localStorage.setItem('birthday_wishes_collection', JSON.stringify(list));
    }
  } catch {}
}

function updateLocalWishId(oldId: string, updatedWish: WishItem) {
  try {
    const raw = localStorage.getItem('birthday_wishes_collection');
    if (raw) {
      const list: WishItem[] = JSON.parse(raw);
      const idx = list.findIndex(w => w.id === oldId);
      if (idx !== -1) {
        list[idx] = updatedWish;
        localStorage.setItem('birthday_wishes_collection', JSON.stringify(list));
      }
    }
  } catch {}
}

