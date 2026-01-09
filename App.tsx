import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquarePlus, Trophy, Clock, AlertTriangle } from 'lucide-react';

import { FeatureRequest, SortOption } from './types';
import { initializeFirebase, subscribeToFeatures, addFeatureRequest, toggleUpvote, isFirebaseInitialized } from './services/firebase';
import { FeatureCard } from './components/FeatureCard';
import { SubmitModal } from './components/SubmitModal';
import { Button } from './components/Button';

// Local Storage Keys
const USER_ID_KEY = 'feature_vote_user_id';

export default function App() {
  const [userId, setUserId] = useState<string>('');
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.POPULAR);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize App
  useEffect(() => {
    const init = async () => {
      // 1. Initialize Firebase (Async with Auth)
      const authUserId = await initializeFirebase();
      
      // 2. Set User ID (prefer Auth UID, fallback to local UUID)
      if (authUserId) {
        setUserId(authUserId);
        // Clean up local storage if we have a real auth ID
        localStorage.removeItem(USER_ID_KEY); 
      } else {
        // Fallback for offline or auth failure
        let storedUserId = localStorage.getItem(USER_ID_KEY);
        if (!storedUserId) {
          storedUserId = uuidv4();
          localStorage.setItem(USER_ID_KEY, storedUserId);
        }
        setUserId(storedUserId);
      }
      
      setIsLoading(false);
    };

    init();
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
          setError("Access denied. Please check your Firestore Security Rules to allow read/write.");
        } else {
          setError("Failed to load features. Please check your connection.");
        }
      }
    );

    return () => unsubscribe();
  }, [isLoading]);

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
    const success = await addFeatureRequest(title, description);
    if (!success) {
      // If add fails but we don't have a global error yet, it might be permissions
      // We rely on the internal alert in addFeatureRequest for now, but could update state here
    }
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
            <Button onClick={() => setIsModalOpen(true)}>
              <MessageSquarePlus size={18} className="mr-2" />
              Request Feature
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
              {!error && (
                <p className="text-xs text-gray-400 mt-4">
                  (If you added data, check if your Firestore collection is named "features")
                </p>
              )}
            </div>
          ) : (
            sortedFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                userId={userId}
                onToggleUpvote={(id, hasUpvoted) => toggleUpvote(id, userId, hasUpvoted)}
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