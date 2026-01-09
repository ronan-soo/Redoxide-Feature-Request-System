export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  upvotes: number;
  upvotedBy: string[]; // Array of user IDs (UUIDs)
  status: 'open' | 'planned' | 'in-progress' | 'completed';
}

export enum SortOption {
  POPULAR = 'POPULAR',
  NEWEST = 'NEWEST'
}

export interface AppConfig {
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
    [key: string]: any;
  };
}