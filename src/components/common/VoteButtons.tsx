import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { reputationService } from '../../services/reputation.service';

interface VoteButtonsProps {
  responseId: string;
  onVote?: () => void;
}

export function VoteButtons({ responseId, onVote }: VoteButtonsProps) {
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [notHelpfulCount, setNotHelpfulCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadVotes();
  }, [responseId]);

  const loadVotes = async () => {
    const counts = await reputationService.getVoteCounts(responseId);
    setHelpfulCount(counts.helpful);
    setNotHelpfulCount(counts.notHelpful);
    
    const voted = await reputationService.hasUserVoted(responseId);
    setHasVoted(voted);
  };

  const handleVote = async (isHelpful: boolean) => {
    if (hasVoted || voting) return;
    
    setVoting(true);
    const result = await reputationService.voteSolution(responseId, isHelpful);
    
    if (result.success) {
      if (isHelpful) {
        setHelpfulCount(prev => prev + 1);
      } else {
        setNotHelpfulCount(prev => prev + 1);
      }
      setHasVoted(true);
      onVote?.();
      loadVotes();
    }
    setVoting(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleVote(true)}
        disabled={hasVoted || voting}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors ${
          hasVoted
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50'
        }`}
        title="Cette solution est utile"
      >
        <ThumbsUp className="w-3 h-3" />
        <span>{helpfulCount}</span>
      </button>
      
      <button
        onClick={() => handleVote(false)}
        disabled={hasVoted || voting}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors ${
          hasVoted
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50'
        }`}
        title="Cette solution n'est pas utile"
      >
        <ThumbsDown className="w-3 h-3" />
        <span>{notHelpfulCount}</span>
      </button>
      
      {hasVoted && (
        <span className="text-xs text-gray-400">Déjà voté</span>
      )}
    </div>
  );
}