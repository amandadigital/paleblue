import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GameMode } from '../types/game';
import { Trophy, Compass, Swords, Calendar, Film, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/audio';
import { VerifiedBadge, isUserVerified } from './VerifiedBadge';

interface NavbarProps {
  currentTab: GameMode | 'leaderboard';
  onSelectTab: (tab: GameMode | 'leaderboard') => void;
  onOpenProfile: () => void;
  onReplayIntro: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfile,
  onReplayIntro,
}) => {
  const { user, profile, openAuthModal } = useAuth();
  const [mutedState, setMutedState] = React.useState(sound.getMuted());

  return (
    <header className="border-b border-neutral-900 bg-black/90 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectTab('free')}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <span className="text-3xl font-heading text-white transition-colors">
              paleblue
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block -mt-1" />
          </button>

          {/* Navigation modes */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <button
              onClick={() => onSelectTab('daily')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'daily'
                  ? 'text-white border-b border-white font-semibold'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Calendar size={14} />
              <span>daily challenge</span>
            </button>

            <button
              onClick={() => onSelectTab('free')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'free'
                  ? 'text-white border-b border-white font-semibold'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Compass size={14} />
              <span>free mode</span>
            </button>

            <button
              onClick={() => onSelectTab('duel')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'duel'
                  ? 'text-white border-b border-white font-semibold'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Swords size={14} />
              <span>duels</span>
            </button>

            <button
              onClick={() => onSelectTab('leaderboard')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'leaderboard'
                  ? 'text-white border-b border-white font-semibold'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Trophy size={14} />
              <span>leaderboard</span>
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setMutedState(muted);
              if (!muted) sound.playSuccessChime();
            }}
            title={mutedState ? 'unmute cosmic sound' : 'mute cosmic sound'}
            className="p-1.5 text-neutral-500 hover:text-white rounded cursor-pointer transition-colors"
          >
            {mutedState ? <VolumeX size={16} /> : <Volume2 size={16} className="text-sky-400" />}
          </button>

          <button
            onClick={onReplayIntro}
            title="replay intro sequence"
            className="p-1.5 text-neutral-500 hover:text-white rounded cursor-pointer transition-colors"
          >
            <Film size={16} />
          </button>

          {user && profile ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1 sketch-border border-neutral-800 hover:border-neutral-600 bg-neutral-950 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-black border border-neutral-700 flex items-center justify-center text-xs overflow-hidden">
                {profile.avatar && profile.avatar.startsWith('data:image') ? (
                  <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile.username?.[0] || '·'}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white text-xs">{profile.username}</span>
                {isUserVerified(profile.username, profile.isVerified) && (
                  <VerifiedBadge size={13} title="verified user" />
                )}
              </div>
              <span className="text-neutral-400 font-mono text-xs">({profile.points} pts)</span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3.5 py-1 sketch-border bg-white text-black text-xs hover:bg-neutral-200 cursor-pointer font-medium"
            >
              account
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center justify-around border-t border-neutral-900 py-2 px-1 text-xs text-neutral-500 bg-black">
        <button
          onClick={() => onSelectTab('daily')}
          className={`flex flex-col items-center gap-1 py-1 px-2 cursor-pointer ${
            currentTab === 'daily' ? 'text-white' : ''
          }`}
        >
          <Calendar size={14} />
          <span>daily</span>
        </button>
        <button
          onClick={() => onSelectTab('free')}
          className={`flex flex-col items-center gap-1 py-1 px-2 cursor-pointer ${
            currentTab === 'free' ? 'text-white' : ''
          }`}
        >
          <Compass size={14} />
          <span>free</span>
        </button>
        <button
          onClick={() => onSelectTab('duel')}
          className={`flex flex-col items-center gap-1 py-1 px-2 cursor-pointer ${
            currentTab === 'duel' ? 'text-white' : ''
          }`}
        >
          <Swords size={14} />
          <span>duels</span>
        </button>
        <button
          onClick={() => onSelectTab('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 cursor-pointer ${
            currentTab === 'leaderboard' ? 'text-white' : ''
          }`}
        >
          <Trophy size={14} />
          <span>ranks</span>
        </button>
      </div>
    </header>
  );
};
