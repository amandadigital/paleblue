import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { BotPlayer, SpaceObject } from '../types/game';
import { BOT_PLAYERS } from '../data/customization';
import { SPACE_OBJECTS } from '../data/spaceObjects';
import { checkAnswer, triggerStarDust } from '../utils/gameHelpers';
import { getRandomNasaTargets } from '../services/nasaService';
import { ExploreViewer } from './ExploreViewer';
import { VerifiedBadge, isUserVerified } from './VerifiedBadge';

export const DuelMode: React.FC = () => {
  const { profile, awardPoints, seenPhotoIds, markPhotosAsSeen } = useAuth();
  const [selectedBot, setSelectedBot] = useState<BotPlayer | null>(null);
  const [duelState, setDuelState] = useState<'lobby' | 'in_progress' | 'finished'>('lobby');

  const [currentRound, setCurrentRound] = useState(0); // 0, 1, 2
  const [targets, setTargets] = useState<SpaceObject[]>([]);
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  const [isRoundGuessedByUser, setIsRoundGuessedByUser] = useState(false);
  const [userRoundResult, setUserRoundResult] = useState<{
    isCorrect: boolean;
    isPartial?: boolean;
    partialCategory?: string;
    pointsEarned: number;
    submittedName: string;
  } | null>(null);

  const [botStatus, setBotStatus] = useState<'analyzing' | 'guessed'>('analyzing');
  const [botGuessText, setBotGuessText] = useState<string>('');

  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startDuel = async (bot: BotPlayer) => {
    setSelectedBot(bot);
    const chosenTargets = await getRandomNasaTargets(3, new Set(), seenPhotoIds);
    markPhotosAsSeen(chosenTargets.map((t) => t.id));
    setTargets(chosenTargets);
    setCurrentRound(0);
    setUserScore(0);
    setBotScore(0);
    setDuelState('in_progress');
    setupRound(0, bot, chosenTargets[0]);
  };

  const setupRound = (roundIndex: number, bot: BotPlayer, roundTarget: SpaceObject) => {
    setIsRoundGuessedByUser(false);
    setUserRoundResult(null);
    setBotStatus('analyzing');
    setBotGuessText('');

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    const delay = (bot.minDelaySec + Math.random() * (bot.maxDelaySec - bot.minDelaySec)) * 1000;

    botTimerRef.current = setTimeout(() => {
      const willSucceed = Math.random() < bot.accuracy;
      setBotStatus('guessed');

      if (willSucceed) {
        setBotGuessText(roundTarget.name);
        setBotScore((prev) => prev + 1);
      } else {
        const wrongObjects = SPACE_OBJECTS.filter((o) => o.id !== roundTarget.id);
        const wrongName = wrongObjects[Math.floor(Math.random() * wrongObjects.length)].name;
        setBotGuessText(wrongName);
      }
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  const handleUserGuess = (guess: string, hintsUsed: number) => {
    if (isRoundGuessedByUser || !targets[currentRound]) return;

    const roundTarget = targets[currentRound];
    const check = checkAnswer(guess, roundTarget);
    const roundPts = check.isCorrect
      ? check.isPartial
        ? 75
        : Math.max(50, 150 - hintsUsed * 15)
      : 0;

    if (check.isCorrect) {
      setUserScore((prev) => prev + (check.isPartial ? 0.5 : 1));
      triggerStarDust(check.isPartial ? 'partial' : 'exact');
    }

    setUserRoundResult({
      isCorrect: check.isCorrect,
      isPartial: check.isPartial,
      partialCategory: check.partialCategory,
      pointsEarned: roundPts,
      submittedName: guess,
    });
    setIsRoundGuessedByUser(true);
  };

  const handleNextRound = () => {
    if (currentRound < 2 && selectedBot) {
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      setupRound(nextR, selectedBot, targets[nextR]);
    } else {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      const userWon = userScore > botScore;
      const awarded = userWon ? 850 : userScore === botScore ? 450 : 200;
      awardPoints(awarded, 'duel', { wonDuel: userWon });
      setDuelState('finished');
      if (userWon) {
        triggerStarDust();
      }
    }
  };

  // Lobby view: heading is just "duels" with no chips or descriptions
  if (duelState === 'lobby') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 select-none">
        <h2 className="text-3xl font-heading text-white text-center">
          duels
        </h2>

        {/* Bot selection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BOT_PLAYERS.map((bot) => (
            <div
              key={bot.id}
              className="p-4 sketch-border border-neutral-800 bg-neutral-950 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-heading text-white">{bot.name}</span>
                <span className="text-xs text-neutral-500 font-mono">
                  {Math.round(bot.accuracy * 100)}% accuracy
                </span>
              </div>

              <button
                onClick={() => startDuel(bot)}
                className="w-full py-2 sketch-border bg-white text-black hover:bg-neutral-200 text-sm font-semibold cursor-pointer"
              >
                duel
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Finished view: "results", "wins", "rematch", "back"
  if (duelState === 'finished' && selectedBot) {
    const userWon = userScore > botScore;
    const isDraw = userScore === botScore;

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
        <h2 className="text-3xl font-heading text-white">results</h2>
        <p className="text-neutral-300 text-base">
          {userWon ? 'you win' : isDraw ? 'draw' : `${selectedBot.name} wins`} ({userScore} - {botScore})
        </p>

        <div className="p-4 sketch-border border-neutral-800 bg-neutral-950">
          <div className="text-4xl font-heading text-white">
            +{userWon ? '850' : isDraw ? '450' : '200'} pts
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setDuelState('lobby')}
            className="flex-1 py-2 sketch-border border-neutral-800 text-neutral-300 hover:text-white text-sm cursor-pointer"
          >
            back
          </button>
          <button
            onClick={() => startDuel(selectedBot)}
            className="flex-1 py-2 sketch-border bg-white text-black hover:bg-neutral-200 text-sm font-semibold cursor-pointer"
          >
            rematch
          </button>
        </div>
      </div>
    );
  }

  // Active round in progress
  const currentTarget = targets[currentRound];

  return (
    <div className="w-full select-none">
      {/* Live scoreboard */}
      <div className="max-w-7xl mx-auto px-4 py-2 border-b border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
        <div>
          <span className="inline-flex items-center gap-1">
            <span>{profile?.username || 'you'}</span>
            {isUserVerified(profile?.username, profile?.isVerified) && (
              <VerifiedBadge size={12} title="verified user" />
            )}
            <span>: {userScore}</span>
          </span>
        </div>
        <div>
          <span>round {currentRound + 1}/3</span>
        </div>
        <div>
          <span>{selectedBot?.name}: {botScore}</span>
        </div>
      </div>

      {currentTarget && (
        <ExploreViewer
          target={currentTarget}
          onGuessSubmitted={handleUserGuess}
          isGuessed={isRoundGuessedByUser}
          userResult={userRoundResult || undefined}
          onNextTarget={handleNextRound}
          titleHeading={`duel: round ${currentRound + 1}/3`}
        />
      )}
    </div>
  );
};
