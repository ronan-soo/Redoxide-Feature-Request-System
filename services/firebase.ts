import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment,
  query,
  Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  Auth,
  User
} from 'firebase/auth';
import { FeatureRequest } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAyF1SPAe_47bRiT0WTnPMx3Wic_tfuqb4",
  authDomain: "upvote-system-10c5b.firebaseapp.com",
  projectId: "upvote-system-10c5b",
  storageBucket: "upvote-system-10c5b.firebasestorage.app",
  messagingSenderId: "1066052945196",
  appId: "1:1066052945196:web:bfec3d68018aebfa6a9889",
  measurementId: "G-B4BN1WP4CB"
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

// Helper to check if initialized
export const isFirebaseInitialized = () => !!app && !!db && !!auth;

export const initializeFirebase = (): boolean => {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    return true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return false;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async () => {
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const subscribeToFeatures = (
  onData: (features: FeatureRequest[]) => void,
  onError: (error: Error) => void
) => {
  if (!db) {
    console.warn("Attempted to subscribe before DB initialization");
    return () => {};
  }

  const q = query(collection(db, 'features'));
  
  return onSnapshot(q, (snapshot) => {
    const features = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FeatureRequest[];
    onData(features);
  }, (error) => {
    console.error("Firestore Subscription Error:", error);
    onError(error);
  });
};

export const addFeatureRequest = async (title: string, description: string): Promise<boolean> => {
  if (!db) {
    console.error("Firestore DB not initialized");
    return false;
  }
  // Check if user is logged in (optional, but good practice to ensure rules pass)
  if (!auth?.currentUser) {
    alert("You must be signed in to submit a request.");
    return false;
  }

  try {
    await addDoc(collection(db, 'features'), {
      title,
      description,
      createdAt: Date.now(),
      upvotes: 0,
      upvotedBy: [],
      status: 'open',
      createdBy: auth.currentUser.uid, // Track who created it
      authorName: auth.currentUser.displayName || 'Anonymous'
    });
    return true;
  } catch (e) {
    console.error("Error adding document: ", e);
    alert(`Failed to submit feature: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return false;
  }
};

export const toggleUpvote = async (featureId: string, userId: string, hasUpvoted: boolean) => {
  if (!db) return;
  const featureRef = doc(db, 'features', featureId);

  try {
    if (hasUpvoted) {
      // Remove upvote
      await updateDoc(featureRef, {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(userId)
      });
    } else {
      // Add upvote
      await updateDoc(featureRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(userId)
      });
    }
  } catch (e) {
    console.error("Error updating upvote: ", e);
    alert("Failed to update vote. Please check your connection or sign in.");
  }
};