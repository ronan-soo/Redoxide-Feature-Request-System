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
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
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
export const isFirebaseInitialized = () => !!app && !!db;

export const initializeFirebase = async (): Promise<string | null> => {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    db = getFirestore(app);
    auth = getAuth(app);

    // Sign in anonymously to handle security rules that require auth
    try {
      const userCredential = await signInAnonymously(auth);
      console.log("Firebase Auth: Signed in as", userCredential.user.uid);
      return userCredential.user.uid;
    } catch (authError) {
      console.error("Firebase Auth failed:", authError);
      return null; 
    }

  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return null;
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
  console.log("Subscribing to 'features' collection...");
  
  return onSnapshot(q, (snapshot) => {
    console.log(`Firestore Update: Received ${snapshot.docs.length} documents.`);
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
  try {
    await addDoc(collection(db, 'features'), {
      title,
      description,
      createdAt: Date.now(),
      upvotes: 0,
      upvotedBy: [],
      status: 'open'
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
    alert("Failed to update vote. Please check your connection.");
  }
};