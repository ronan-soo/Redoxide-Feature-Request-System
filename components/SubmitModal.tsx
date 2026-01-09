import React, { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { Button } from './Button';
import { polishFeatureRequest } from '../services/geminiService';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(title, description);
    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    onClose();
  };

  const handlePolish = async () => {
    if (!title || !description) return;
    setIsPolishing(true);
    try {
      const result = await polishFeatureRequest(title, description);
      setTitle(result.title);
      setDescription(result.description);
    } catch (error) {
      alert("Failed to polish text. Please try again.");
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Request a Feature</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dark Mode support"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the feature you'd like to see..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all min-h-[120px] resize-y"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePolish}
              disabled={isPolishing || !title || !description}
              isLoading={isPolishing}
              className="flex-1"
              title="Use AI to improve your writing"
            >
              <Sparkles size={16} className="mr-2" />
              AI Polish
            </Button>
            <Button 
              type="submit" 
              className="flex-[2]"
              isLoading={isSubmitting}
            >
              <Send size={16} className="mr-2" />
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};