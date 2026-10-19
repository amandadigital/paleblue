import React from 'react';
import { useAuth } from '../context/AuthContext';
import { VerifiedBadge, isUserVerified } from './VerifiedBadge';

export const Leaderboard: React.FC = () => {
  const { leaderboard, profile, isRealtimeActive, setViewedProfile } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5 select-none">
      {/* Title & Live Status */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
        <h2 className="text-3xl font-heading text-white">
          leaderboard
        </h2>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRealtimeActive ? 'bg-white animate-pulse' : 'bg-neutral-600'
            }`}
          />
          <span>real-time</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div className="py-16 text-center text-sm text-neutral-500">
          no explorers yet. play a game to take the first spot.
        </div>
      ) : (
        <div className="sketch-border border-neutral-800 bg-neutral-950 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500 bg-black">
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3">user</th>
                <th className="py-2.5 px-3 text-center">games</th>
                <th className="py-2.5 px-3 text-center">accuracy</th>
                <th className="py-2.5 px-3 text-right">points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = profile?.id === entry.id || profile?.username === entry.username;
                const rank = index + 1;

                return (
                  <tr
                    key={entry.id || entry.username}
                    onClick={() => setViewedProfile(entry)}
                    className={`transition-colors cursor-pointer ${
                      isCurrentUser ? 'bg-neutral-900/60 font-semibold' : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-neutral-500 font-mono text-xs">
                      {rank}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-black border border-neutral-700 flex items-center justify-center text-xs overflow-hidden shrink-0">
                          {entry.avatar && entry.avatar.startsWith('data:image') ? (
                            <img src={entry.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-mono">{entry.username?.[0] || '·'}</span>
                          )}
                        </div>
                        <span className="text-white flex items-center gap-1.5">
                          <span>{entry.username}</span>
                          {isUserVerified(entry.username, entry.isVerified) && (
                            <VerifiedBadge size={14} title="verified user" />
                          )}
                          {isCurrentUser && (
                            <span className="text-neutral-500 font-normal text-xs">(you)</span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center text-neutral-400 font-mono text-xs">
                      {entry.gamesPlayed}
                    </td>

                    <td className="py-2.5 px-3 text-center text-neutral-400 font-mono text-xs">
                      {entry.accuracy}%
                    </td>

                    <td className="py-2.5 px-3 text-right text-white font-heading text-lg">
                      {entry.points} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center text-xs text-neutral-500">
        click any user to view their profile
      </div>
    </div>
  );
};
