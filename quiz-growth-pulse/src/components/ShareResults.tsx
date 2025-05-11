import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Twitter, Facebook, Linkedin, Link2, X, Copy, Check } from 'lucide-react';
import { showToast } from './ui/toast';

interface ShareResultsProps {
  score: number;
  totalQuestions: number;
  quizTitle?: string;
  attemptId?: string;
  className?: string;
}

/**
 * ShareResults component for sharing quiz results on social media
 */
const ShareResults: React.FC<ShareResultsProps> = ({
  score,
  totalQuestions,
  quizTitle = 'Quiz',
  attemptId,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Construct share content
  const shareTitle = `Check out my result on ${quizTitle}!`;
  const scorePercentage = Math.round((score / totalQuestions) * 100);
  const shareText = `I scored ${scorePercentage}% (${score}/${totalQuestions}) on the ${quizTitle}!`;
  
  // Construct the URL to share
  const baseUrl = window.location.origin;
  const shareUrl = attemptId 
    ? `${baseUrl}/results/${attemptId}` 
    : window.location.href;
  
  // Toggle share menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // Try to use Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        showToast({
          message: 'Shared successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error sharing:', error);
        if (error instanceof Error && error.name !== 'AbortError') {
          showToast({
            message: 'Failed to share. Try another method.',
            type: 'error'
          });
        }
      }
    } else {
      // Fallback to opening the menu if Web Share API is not available
      toggleMenu();
    }
  };
  
  // Handle sharing to specific platforms
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    setIsMenuOpen(false);
  };
  
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank');
    setIsMenuOpen(false);
  };
  
  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, '_blank');
    setIsMenuOpen(false);
  };
  
  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      showToast({
        message: 'Link copied to clipboard!',
        type: 'success'
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast({
        message: 'Failed to copy link',
        type: 'error'
      });
    }
    setIsMenuOpen(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleNativeShare}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        aria-label="Share results"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
          >
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Share your result
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {shareText}
                </p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={shareToTwitter}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Twitter className="h-4 w-4 mr-3 text-[#1DA1F2]" />
                  Twitter
                </button>
                <button
                  onClick={shareToFacebook}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Facebook className="h-4 w-4 mr-3 text-[#4267B2]" />
                  Facebook
                </button>
                <button
                  onClick={shareToLinkedIn}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Linkedin className="h-4 w-4 mr-3 text-[#0077B5]" />
                  LinkedIn
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-3 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-3 text-gray-500" />
                  )}
                  Copy link
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareResults;

