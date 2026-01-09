import React, { useState } from 'react';
import { Button } from './Button';
import { Settings, Save } from 'lucide-react';
import { AppConfig } from '../types';

interface ConfigScreenProps {
  onSave: (config: AppConfig) => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ onSave }) => {
  const [firebaseJson, setFirebaseJson] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(firebaseJson);
      onSave({ firebaseConfig: parsedConfig });
    } catch (e) {
      setError('Invalid JSON format for Firebase Config. Please copy the object directly from Firebase Console.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup FeatureVote</h1>
          <p className="text-gray-500">Configure your backend to get started.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firebase Config Object (JSON)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Go to Firebase Console {'>'} Project Settings {'>'} General {'>'} Your Apps {'>'} SDK Setup/Config. Copy the `firebaseConfig` object (content between the braces).
            </p>
            <textarea
              className="w-full h-48 font-mono text-sm p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/50 outline-none bg-gray-50"
              placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
              value={firebaseJson}
              onChange={(e) => setFirebaseJson(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button onClick={handleSave} className="w-full py-3 text-lg">
            <Save className="w-5 h-5 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};