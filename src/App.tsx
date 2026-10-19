import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IntroAnimation } from './components/IntroAnimation';
import { Navbar } from './components/Navbar';
import { DailyChallenge } from './components/DailyChallenge';
import { FreeMode } from './components/FreeMode';
import { DuelMode } from './components/DuelMode';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { SketchBackground } from './components/SketchBackground';
import { GameMode } from './types/game';

function MainApp() {
  const { user, profile, openAuthModal, loading, viewedProfile, setViewedProfile } = useAuth();
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    return sessionStorage.getItem('paleblue_seen_intro_v2') === 'true';
  });
  const [currentTab, setCurrentTab] = useState<GameMode | 'leaderboard'>('free');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (!loading && hasSeenIntro && !user) {
      openAuthModal();
    }
  }, [loading, hasSeenIntro, user, openAuthModal]);

  const handleIntroComplete = () => {
    setHasSeenIntro(true);
    sessionStorage.setItem('paleblue_seen_intro_v2', 'true');
    if (!user) {
      openAuthModal();
    }
  };

  const handleReplayIntro = () => {
    setHasSeenIntro(false);
  };

  if (!hasSeenIntro) {
    return (
      <IntroAnimation
        username={profile?.username || user?.user_metadata?.username || 'explorer'}
        onComplete={handleIntroComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col font-body selection:bg-neutral-800">
      <SketchBackground />

      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (!user) {
            openAuthModal();
            return;
          }
          setCurrentTab(tab);
        }}
        onOpenProfile={() => {
          if (!user) {
            openAuthModal();
            return;
          }
          setIsProfileOpen(true);
        }}
        onReplayIntro={handleReplayIntro}
      />

      <main className="flex-1 relative z-10 w-full flex flex-col items-center">
        {!user ? (
          <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
            <h2 className="text-3xl font-heading text-white">
              you need an account!
            </h2>
            <p className="text-neutral-400 text-sm">
              sign in or register to begin exploring.
            </p>
            <div>
              <button
                onClick={openAuthModal}
                className="px-5 py-2 sketch-border bg-white text-black text-sm hover:bg-neutral-200 cursor-pointer font-medium"
              >
                open account →
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col">
            {currentTab === 'daily' && <DailyChallenge />}
            {currentTab === 'free' && <FreeMode />}
            {currentTab === 'duel' && <DuelMode />}
            {currentTab === 'leaderboard' && <Leaderboard />}
          </div>
        )}
      </main>

      {/* Footer: strictly "by misiori (link to https://misiori.github.io)" */}
      <footer className="border-t border-neutral-900 py-3 text-center text-xs text-neutral-500 relative z-10 select-none">
        <a
          href="https://misiori.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          by misiori
        </a>
      </footer>

      {/* Modals */}
      <AuthModal />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      {viewedProfile && (
        <ProfileModal
          isOpen={true}
          targetProfile={viewedProfile}
          onClose={() => setViewedProfile(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
