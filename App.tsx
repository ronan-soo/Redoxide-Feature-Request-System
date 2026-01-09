import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquarePlus, Trophy, Clock, AlertTriangle, LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';

import { FeatureRequest, SortOption } from './types';
import { 
  initializeFirebase, 
  subscribeToFeatures, 
  addFeatureRequest, 
  toggleUpvote, 
  isFirebaseInitialized,
  signInWithGoogle,
  logOut,
  subscribeToAuthChanges
} from './services/firebase';
import { FeatureCard } from './components/FeatureCard';
import { SubmitModal } from './components/SubmitModal';
import { Button } from './components/Button';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.POPULAR);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize App and Auth
  useEffect(() => {
    const init = async () => {
      initializeFirebase();
      
      // Listen for auth changes
      const unsubscribeAuth = subscribeToAuthChanges((currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
      });

      return () => unsubscribeAuth();
    };

    const cleanup = init();
    return () => {
      // We can't await the cleanup of init, but we can handle unmounting logic if needed
    };
  }, []);

  // Listen to Features
  useEffect(() => {
    if (isLoading || !isFirebaseInitialized()) return;
    
    setError(null);

    const unsubscribe = subscribeToFeatures(
      (data) => {
        setFeatures(data);
        setError(null);
      },
      (err) => {
        console.error("Subscription failed:", err);
        if (err.message.includes("permission-denied")) {
          // If permission denied and not logged in, it's likely because rules require auth
          if (!user) {
             // We don't show a huge error here, we just might not show data or show a specific message
             // but usually read access is public in these apps. 
             // If rules require auth for read, we set error.
             // For now, let's assume public read, auth write.
          }
          setError("Access denied. Please check your Firestore Security Rules.");
        } else {
          setError("Failed to load features. Please check your connection.");
        }
      }
    );

    return () => unsubscribe();
  }, [isLoading, user]);

  // Derived state for sorted features
  const sortedFeatures = useMemo(() => {
    const sorted = [...features];
    if (sortBy === SortOption.POPULAR) {
      sorted.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
    return sorted;
  }, [features, sortBy]);

  const handleSubmitFeature = async (title: string, description: string) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    await addFeatureRequest(title, description);
  };

  const handleVote = (featureId: string, hasUpvoted: boolean) => {
    if (!user) {
      const confirmLogin = window.confirm("You need to sign in to vote. Sign in with Google?");
      if (confirmLogin) {
        signInWithGoogle();
      }
      return;
    }
    toggleUpvote(featureId, user.uid, hasUpvoted);
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen text-primary font-medium">Connecting to FeatureVote...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white p-2 rounded-lg shadow-sm">
              <Trophy size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">FeatureVote</h1>
              <p className="text-xs text-gray-500 mt-1">Community Roadmap</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-gray-50 pl-3 pr-2 py-1.5 rounded-full border border-gray-100">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="w-6 h-6 rounded-full border border-gray-200"
                    />
                  ) : (
                    <UserIcon size={16} className="text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user.displayName?.split(' ')[0] || 'User'}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button 
                  onClick={logOut}
                  className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Button onClick={() => signInWithGoogle()} variant="secondary" className="px-3 py-1.5 text-sm">
                <LogIn size={16} className="mr-2" />
                Sign In
              </Button>
            )}

            <Button onClick={() => user ? setIsModalOpen(true) : signInWithGoogle()}>
              <MessageSquarePlus size={18} className="mr-2" />
              <span className="hidden sm:inline">Request Feature</span>
              <span className="sm:hidden">Request</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Connection Error</h3>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-700">
            {features.length} {features.length === 1 ? 'Feature' : 'Features'} Requested
          </h2>
          <div className="bg-white p-1 rounded-lg border border-gray-200 flex space-x-1">
            <button
              onClick={() => setSortBy(SortOption.POPULAR)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                sortBy === SortOption.POPULAR 
                  ? 'bg-gray-100 text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <Trophy size={14} className="mr-1.5" />
                Popular
              </div>
            </button>
            <button
              onClick={() => setSortBy(SortOption.NEWEST)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                sortBy === SortOption.NEWEST 
                  ? 'bg-gray-100 text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <Clock size={14} className="mr-1.5" />
                Newest
              </div>
            </button>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-4">
          {sortedFeatures.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MessageSquarePlus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No features yet</h3>
              <p className="text-gray-500 mt-1">Be the first to request a new feature!</p>
              {!user && (
                <p className="text-sm text-primary mt-4 cursor-pointer hover:underline" onClick={() => signInWithGoogle()}>
                  Sign in to get started
                </p>
              )}
            </div>
          ) : (
            sortedFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                userId={user?.uid || ''}
                onToggleUpvote={handleVote}
              />
            ))
          )}
        </div>
      </main>

      <SubmitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitFeature}
      />
    </div>
  );
}