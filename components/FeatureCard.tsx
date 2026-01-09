import React from 'react';
import { FeatureRequest } from '../types';
import { ArrowBigUp } from 'lucide-react';

interface FeatureCardProps {
  feature: FeatureRequest;
  userId: string;
  onToggleUpvote: (id: string, hasUpvoted: boolean) => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, userId, onToggleUpvote }) => {
  const hasUpvoted = feature.upvotedBy.includes(userId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex gap-4 transition-all hover:shadow-md">
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => onToggleUpvote(feature.id, hasUpvoted)}
          className={`flex flex-col items-center justify-center w-12 h-14 rounded-lg border transition-colors ${
            hasUpvoted 
              ? 'bg-primary/10 border-primary text-primary' 
              : 'bg-white border-gray-200 text-gray-500 hover:border-primary/50 hover:text-primary'
          }`}
        >
          <ArrowBigUp className={`w-8 h-8 ${hasUpvoted ? 'fill-current' : ''}`} strokeWidth={1.5} />
        </button>
        <span className="text-sm font-bold text-gray-700">{feature.upvotes}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-1">{feature.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
            ${feature.status === 'completed' ? 'bg-green-100 text-green-700' :
              feature.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
              feature.status === 'planned' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-600'
            }`}>
            {feature.status}
          </span>
        </div>
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{feature.description}</p>
        <div className="mt-3 text-xs text-gray-400">
          Submitted {new Date(feature.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
