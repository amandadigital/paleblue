import React from 'react';
import { BadgeCheck } from 'lucide-react';

export const isVerifiedUsername = (username?: string | null): boolean => {
  if (!username) return false;
  return username.trim().toLowerCase() === 'misiori';
};

export const isUserVerified = (username?: string | null, isVerified?: boolean): boolean => {
  if (isVerified === true) return true;
  return isVerifiedUsername(username);
};

interface VerifiedBadgeProps {
  size?: number;
  showLabel?: boolean;
  className?: string;
  title?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 14,
  showLabel = false,
  className = '',
  title = 'verified user',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sky-400 align-middle shrink-0 ${className}`}
      title={title}
    >
      <BadgeCheck
        size={size}
        className="fill-sky-400/20 text-sky-400 transition-transform hover:scale-110"
      />
      {showLabel && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded font-medium">
          verified
        </span>
      )}
    </span>
  );
};
