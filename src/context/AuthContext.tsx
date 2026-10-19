import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, LeaderboardEntry } from '../types/game';
import { isUserVerified } from '../components/VerifiedBadge';
import { SPACE_OBJECTS } from '../data/spaceObjects';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signIn: (identifier: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  awardPoints: (amount: number, reason: 'daily' | 'free' | 'duel', details?: { wonDuel?: boolean }) => Promise<void>;
  leaderboard: LeaderboardEntry[];
  isRealtimeActive: boolean;
  viewedProfile: LeaderboardEntry | null;
  setViewedProfile: (entry: LeaderboardEntry | null) => void;
  seenPhotoIds: string[];
  markPhotoAsSeen: (photoId: string) => void;
  markPhotosAsSeen: (photoIds: string[]) => void;
  resetSeenPhotos: () => void;
  totalCatalogCount: number;
}

const LOCAL_STORAGE_PROFILE_KEY = 'paleblue_user_profile_v3';
const LOCAL_STORAGE_LEADERBOARD_KEY = 'paleblue_leaderboard_cache_v3';

const getSeenPhotosStorageKey = (userKey?: string) =>
  `paleblue_seen_photos_v2_${(userKey || 'guest').toLowerCase()}`;

const loadLocalSeenPhotos = (userKey?: string): string[] => {
  try {
    const raw = localStorage.getItem(getSeenPhotosStorageKey(userKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

const saveLocalSeenPhotos = (userKey: string | undefined, photoIds: string[]) => {
  try {
    localStorage.setItem(getSeenPhotosStorageKey(userKey), JSON.stringify(photoIds));
  } catch {
    // ignore
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<LeaderboardEntry | null>(null);
  const [seenPhotoIds, setSeenPhotoIds] = useState<string[]>(() => {
    return loadLocalSeenPhotos('guest');
  });

  // ONLY real users on leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_LEADERBOARD_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map((e: LeaderboardEntry) => ({
            ...e,
            isVerified: isUserVerified(e.username, e.isVerified),
          }));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [, startTransition] = useTransition();

  const loadLocalProfile = (userId: string, userEmail?: string, fallbackName?: string): UserProfile => {
    const userKey = userId || fallbackName || (userEmail ? userEmail.split('@')[0].toLowerCase() : 'guest');
    const existingSeen = loadLocalSeenPhotos(userKey);
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_KEY}_${userId}`);
      if (stored) {
        const p: UserProfile = JSON.parse(stored);
        p.isVerified = isUserVerified(p.username, p.isVerified);
        p.seenPhotoIds = p.seenPhotoIds && p.seenPhotoIds.length > 0 ? p.seenPhotoIds : existingSeen;
        return p;
      }
    } catch {
      // ignore
    }
    const defaultUsername = fallbackName || (userEmail ? userEmail.split('@')[0].toLowerCase() : `explorer_${Math.floor(100 + Math.random() * 900)}`);
    const newProfile: UserProfile = {
      id: userId,
      email: userEmail || '',
      username: defaultUsername,
      avatar: 'pale-dot',
      points: 0,
      gamesPlayed: 0,
      correctGuesses: 0,
      duelsWon: 0,
      duelsLost: 0,
      duelsPlayed: 0,
      isVerified: isUserVerified(defaultUsername),
      seenPhotoIds: existingSeen,
    };
    saveLocalProfile(newProfile);
    return newProfile;
  };

  const saveLocalProfile = (p: UserProfile) => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${p.id}`, JSON.stringify(p));
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  };

  const syncProfileToDatabase = async (p: UserProfile) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(p.id)) return;

    try {
      await supabase.from('profiles').upsert({
        id: p.id,
        email: p.email,
        username: p.username,
        avatar: p.avatar,
        points: p.points,
        games_played: p.gamesPlayed,
        correct_guesses: p.correctGuesses,
        duels_won: p.duelsWon,
        duels_lost: p.duelsLost,
        duels_played: p.duelsPlayed,
        daily_last_played: p.dailyLastPlayed || null,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('profiles table sync:', err);
    }
  };

  const upsertProfileToLeaderboard = (p: UserProfile) => {
    const accuracy = p.gamesPlayed > 0 ? Math.round((p.correctGuesses / p.gamesPlayed) * 100) : 100;
    const entry: LeaderboardEntry = {
      id: p.id,
      username: p.username,
      avatar: p.avatar,
      points: p.points,
      gamesPlayed: p.gamesPlayed,
      accuracy,
      duelsWon: p.duelsWon,
      updatedAt: new Date().toISOString(),
      isVerified: isUserVerified(p.username, p.isVerified),
    };

    setLeaderboard((prev) => {
      const next = [...prev.filter((item) => item.id !== entry.id), entry].sort(
        (a, b) => b.points - a.points
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_LEADERBOARD_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    return entry;
  };

  // Fetch only real users from database
  const fetchDbLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar, points, games_played, correct_guesses, duels_won, updated_at')
        .order('points', { ascending: false })
        .limit(50);

      if (!error && data) {
        const mapped: LeaderboardEntry[] = data.map((row) => ({
          id: row.id,
          username: row.username,
          avatar: row.avatar || 'pale-dot',
          points: row.points || 0,
          gamesPlayed: row.games_played || 0,
          accuracy: row.games_played > 0 ? Math.round(((row.correct_guesses || 0) / row.games_played) * 100) : 100,
          duelsWon: row.duels_won || 0,
          updatedAt: row.updated_at || new Date().toISOString(),
          isVerified: isUserVerified(row.username),
        }));

        startTransition(() => {
          setLeaderboard(mapped);
          try {
            localStorage.setItem(LOCAL_STORAGE_LEADERBOARD_KEY, JSON.stringify(mapped));
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDbLeaderboard();

    const channel = supabase.channel('paleblue-broadcast', {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'score_update' }, (payload) => {
        const incomingEntry = payload.payload as LeaderboardEntry;
        if (incomingEntry && incomingEntry.id) {
          incomingEntry.isVerified = isUserVerified(incomingEntry.username, incomingEntry.isVerified);
          startTransition(() => {
            setLeaderboard((prev) => {
              const updated = [...prev.filter((i) => i.id !== incomingEntry.id), incomingEntry].sort(
                (a, b) => b.points - a.points
              );
              try {
                localStorage.setItem(LOCAL_STORAGE_LEADERBOARD_KEY, JSON.stringify(updated));
              } catch {
                // ignore
              }
              return updated;
            });
          });
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          if (newRow && newRow.id) {
            const entry: LeaderboardEntry = {
              id: String(newRow.id),
              username: String(newRow.username || 'explorer'),
              avatar: String(newRow.avatar || 'pale-dot'),
              points: Number(newRow.points || 0),
              gamesPlayed: Number(newRow.games_played || 0),
              accuracy: Number(newRow.games_played) > 0
                ? Math.round((Number(newRow.correct_guesses || 0) / Number(newRow.games_played)) * 100)
                : 100,
              duelsWon: Number(newRow.duels_won || 0),
              updatedAt: String(newRow.updated_at || new Date().toISOString()),
              isVerified: isUserVerified(String(newRow.username || '')),
            };

            startTransition(() => {
              setLeaderboard((prev) => {
                const updated = [...prev.filter((i) => i.id !== entry.id), entry].sort(
                  (a, b) => b.points - a.points
                );
                return updated;
              });
            });
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const metaName = currentSession.user.user_metadata?.username;
          const p = loadLocalProfile(currentSession.user.id, currentSession.user.email, metaName);

          try {
            const { data: remoteProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (remoteProfile) {
              p.username = remoteProfile.username || p.username;
              p.avatar = remoteProfile.avatar || p.avatar;
              p.points = remoteProfile.points ?? p.points;
              p.gamesPlayed = remoteProfile.games_played ?? p.gamesPlayed;
              p.correctGuesses = remoteProfile.correct_guesses ?? p.correctGuesses;
              p.duelsWon = remoteProfile.duels_won ?? p.duelsWon;
              p.duelsLost = remoteProfile.duels_lost ?? p.duelsLost;
              p.duelsPlayed = remoteProfile.duels_played ?? p.duelsPlayed;
              if (remoteProfile.daily_last_played) p.dailyLastPlayed = remoteProfile.daily_last_played;
              saveLocalProfile(p);
            }
          } catch {
            // ignore
          }

          setProfile(p);
          upsertProfileToLeaderboard(p);
          const activeSeen = p.seenPhotoIds && p.seenPhotoIds.length > 0
            ? p.seenPhotoIds
            : (loadLocalSeenPhotos(currentSession.user.id).length > 0
              ? loadLocalSeenPhotos(currentSession.user.id)
              : loadLocalSeenPhotos(p.username));
          setSeenPhotoIds(activeSeen);
        }
      } catch (err) {
        console.warn('session check:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const metaName = newSession.user.user_metadata?.username;
        const p = loadLocalProfile(newSession.user.id, newSession.user.email, metaName);
        setProfile(p);
        upsertProfileToLeaderboard(p);
        const activeSeen = p.seenPhotoIds && p.seenPhotoIds.length > 0
          ? p.seenPhotoIds
          : (loadLocalSeenPhotos(newSession.user.id).length > 0
            ? loadLocalSeenPhotos(newSession.user.id)
            : loadLocalSeenPhotos(p.username));
        setSeenPhotoIds(activeSeen);
      } else {
        setProfile(null);
        setSeenPhotoIds(loadLocalSeenPhotos('guest'));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const broadcastLeaderboardEntry = async (entry: LeaderboardEntry) => {
    try {
      const channel = supabase.channel('paleblue-broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'score_update',
        payload: entry,
      });
    } catch {
      // ignore
    }
  };

  // Sign in by email OR by username
  const signIn = async (identifier: string, pass: string): Promise<{ error?: string }> => {
    try {
      const cleanId = identifier.trim().toLowerCase();
      let targetEmail = cleanId;

      if (!cleanId.includes('@')) {
        // Query profiles table for username to resolve email
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', cleanId)
            .maybeSingle();

          if (!error && data?.email) {
            targetEmail = data.email;
          } else {
            // fallback format if user registered with username directly
            targetEmail = `${cleanId}@paleblue.space`;
          }
        } catch {
          targetEmail = `${cleanId}@paleblue.space`;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      if (error) {
        return { error: error.message.toLowerCase() };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const p = loadLocalProfile(data.user.id, data.user.email, data.user.user_metadata?.username || cleanId);
        setProfile(p);
        upsertProfileToLeaderboard(p);
        await syncProfileToDatabase(p);
        setIsAuthModalOpen(false);
      }
      return {};
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'failed to sign in';
      return { error: msg.toLowerCase() };
    }
  };

  // Sign up with username & email (or auto-synthesized email from username)
  const signUp = async (rawEmail: string, pass: string, username: string): Promise<{ error?: string }> => {
    try {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) {
        return { error: 'please provide a username' };
      }

      const cleanEmail = rawEmail.trim().toLowerCase() || `${cleanUsername}@paleblue.space`;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) {
        return { error: error.message.toLowerCase() };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const p = loadLocalProfile(data.user.id, cleanEmail, cleanUsername);
        p.username = cleanUsername;
        saveLocalProfile(p);
        setProfile(p);
        const entry = upsertProfileToLeaderboard(p);
        await broadcastLeaderboardEntry(entry);
        await syncProfileToDatabase(p);
        setIsAuthModalOpen(false);
      }
      return {};
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'failed to sign up';
      return { error: msg.toLowerCase() };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    } catch {
      // ignore
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = { ...profile, ...updates };
    updated.isVerified = isUserVerified(updated.username, updated.isVerified);
    saveLocalProfile(updated);
    setProfile(updated);
    const entry = upsertProfileToLeaderboard(updated);
    await broadcastLeaderboardEntry(entry);
    await syncProfileToDatabase(updated);

    if (user && updates.username) {
      try {
        await supabase.auth.updateUser({
          data: { username: updates.username },
        });
      } catch {
        // ignore
      }
    }
  };

  const awardPoints = async (amount: number, reason: 'daily' | 'free' | 'duel', details?: { wonDuel?: boolean }) => {
    if (!profile) return;
    const isToday = new Date().toISOString().split('T')[0];

    const updated: UserProfile = {
      ...profile,
      points: Math.max(0, profile.points + amount),
      gamesPlayed: profile.gamesPlayed + 1,
      correctGuesses: amount > 0 ? profile.correctGuesses + 1 : profile.correctGuesses,
      dailyLastPlayed: reason === 'daily' ? isToday : profile.dailyLastPlayed,
      dailyHistory: reason === 'daily' ? { ...(profile.dailyHistory || {}), [isToday]: (profile.dailyHistory?.[isToday] || 0) + amount } : profile.dailyHistory,
      duelsPlayed: reason === 'duel' ? profile.duelsPlayed + 1 : profile.duelsPlayed,
      duelsWon: reason === 'duel' && details?.wonDuel ? profile.duelsWon + 1 : profile.duelsWon,
      duelsLost: reason === 'duel' && details?.wonDuel === false ? profile.duelsLost + 1 : profile.duelsLost,
    };

    saveLocalProfile(updated);
    setProfile(updated);
    const entry = upsertProfileToLeaderboard(updated);
    await broadcastLeaderboardEntry(entry);
    await syncProfileToDatabase(updated);
  };

  const markPhotosAsSeen = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const userKey = profile?.id || profile?.username || user?.id || 'guest';

    setSeenPhotoIds((prev) => {
      const set = new Set(prev);
      ids.forEach((id) => set.add(id));

      let nextList = Array.from(set);

      // If all photos in the catalog have been shown to the account:
      // "unless all random nasa photos are already used?"
      // Cycle resets with the current newly shown items so future picks don't duplicate current ones!
      if (nextList.length >= SPACE_OBJECTS.length) {
        nextList = Array.from(new Set(ids));
      }

      saveLocalSeenPhotos(userKey, nextList);

      if (profile) {
        const updated = { ...profile, seenPhotoIds: nextList };
        saveLocalProfile(updated);
        setProfile(updated);
      }

      return nextList;
    });
  };

  const markPhotoAsSeen = (id: string) => {
    markPhotosAsSeen([id]);
  };

  const resetSeenPhotos = () => {
    const userKey = profile?.id || profile?.username || user?.id || 'guest';
    saveLocalSeenPhotos(userKey, []);
    setSeenPhotoIds([]);
    if (profile) {
      const updated = { ...profile, seenPhotoIds: [] };
      saveLocalProfile(updated);
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signIn,
        signUp,
        signOut,
        updateProfile,
        awardPoints,
        leaderboard,
        isRealtimeActive,
        viewedProfile,
        setViewedProfile,
        seenPhotoIds,
        markPhotoAsSeen,
        markPhotosAsSeen,
        resetSeenPhotos,
        totalCatalogCount: SPACE_OBJECTS.length,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
