import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LeaderboardEntry } from '../types/game';
import { X, Upload, Check } from 'lucide-react';
import { VerifiedBadge, isUserVerified } from './VerifiedBadge';
import { SPACE_OBJECTS } from '../data/spaceObjects';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile?: LeaderboardEntry | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, targetProfile }) => {
  const { profile, updateProfile, signOut } = useAuth();
  const [usernameInput, setUsernameInput] = useState(profile?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // If viewing another user's profile
  const isViewingOther = Boolean(targetProfile && targetProfile.id !== profile?.id);
  const activeData = isViewingOther ? targetProfile : profile;

  if (!isOpen || !activeData) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress to small square avatar for snappy loading and db storage
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 160;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_SIZE) {
            h = Math.round((h * MAX_SIZE) / w);
            w = MAX_SIZE;
          }
        } else {
          if (h > MAX_SIZE) {
            w = Math.round((w * MAX_SIZE) / h);
            h = MAX_SIZE;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarPreview(dataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewingOther || !profile) return;

    await updateProfile({
      username: usernameInput.trim().toLowerCase() || profile.username,
      avatar: avatarPreview || profile.avatar,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const accuracy = activeData.gamesPlayed > 0
    ? Math.round(
        'correctGuesses' in activeData
          ? ((activeData as any).correctGuesses / activeData.gamesPlayed) * 100
          : activeData.accuracy
      )
    : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-950 sketch-border border-neutral-700 w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h2 className="text-3xl font-heading text-white flex items-center gap-2">
            <span>{isViewingOther ? `${activeData.username}'s profile` : 'profile'}</span>
            {isUserVerified(activeData.username, (activeData as any).isVerified) && (
              <VerifiedBadge size={22} title="verified user" />
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar display & upload */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full border-2 border-neutral-700 bg-black flex items-center justify-center overflow-hidden text-2xl font-mono text-white">
            {avatarPreview && avatarPreview.startsWith('data:image') ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : activeData.avatar && activeData.avatar.startsWith('data:image') ? (
              <img src={activeData.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{activeData.username?.[0] || '·'}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-mono text-neutral-300">@{activeData.username}</span>
            {isUserVerified(activeData.username, (activeData as any).isVerified) && (
              <VerifiedBadge size={15} showLabel title="verified user" />
            )}
          </div>

          {!isViewingOther && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1 sketch-border border-neutral-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={12} />
                <span>upload avatar</span>
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="space-y-2">
          <div className="text-xs text-neutral-500">statistics</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 sketch-border border-neutral-800 bg-black">
              <span className="text-xs text-neutral-500 block">points</span>
              <span className="text-xl font-heading text-white">{activeData.points}</span>
            </div>
            <div className="p-3 sketch-border border-neutral-800 bg-black">
              <span className="text-xs text-neutral-500 block">games</span>
              <span className="text-xl font-heading text-white">{activeData.gamesPlayed}</span>
            </div>
            <div className="p-3 sketch-border border-neutral-800 bg-black">
              <span className="text-xs text-neutral-500 block">accuracy</span>
              <span className="text-xl font-heading text-white">{accuracy}%</span>
            </div>
          </div>

          <div className="p-2.5 sketch-border border-neutral-800 bg-black/50 flex items-center justify-between text-xs">
            <span className="text-neutral-400">catalog exploration</span>
            <span className="font-mono text-sky-400">
              {((activeData as any).seenPhotoIds?.length || profile?.seenPhotoIds?.length || 0)} / {SPACE_OBJECTS.length} unique photos
            </span>
          </div>
        </div>

        {/* Form if own profile */}
        {!isViewingOther ? (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400">username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                placeholder="username"
                className="w-full px-3 py-2 bg-black border border-neutral-700 focus:border-white rounded text-white placeholder-neutral-500 outline-none text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={signOut}
                className="text-xs text-neutral-500 hover:text-red-400 cursor-pointer"
              >
                sign out
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 sketch-border border-neutral-800 text-xs text-neutral-400 cursor-pointer"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 sketch-border bg-white text-black hover:bg-neutral-200 text-xs font-semibold cursor-pointer"
                >
                  {savedSuccess ? 'saved ✓' : 'save'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 sketch-border border-neutral-800 text-xs text-neutral-300 cursor-pointer"
            >
              close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
