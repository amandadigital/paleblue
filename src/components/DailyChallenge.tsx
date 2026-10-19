import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { SPACE_OBJECTS } from '../data/spaceObjects';
import { getDailyTargets, checkAnswer, triggerStarDust } from '../utils/gameHelpers';
import { ExploreViewer } from './ExploreViewer';
import { SpaceObject } from '../types/game';

export const DailyChallenge: React.FC = () => {
  const { profile, awardPoints, markPhotoAsSeen } = useAuth();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const dailyTargets = useMemo(() => getDailyTargets(SPACE_OBJECTS, todayStr), [todayStr]);
  const alreadyPlayedToday = Boolean(profile?.dailyLastPlayed === todayStr);

  const [currentRound, setCurrentRound] = useState(0); // 0, 1, 2
  const [roundResults, setRoundResults] = useState<
    { target: SpaceObject; isCorrect: boolean; pointsEarned: number; guess: string }[]
  >([]);
  const [isCurrentGuessed, setIsCurrentGuessed] = useState(false);
  const [currentResult, setCurrentResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    submittedName: string;
  } | null>(null);
  const [challengeFinished, setChallengeFinished] = useState(false);

  const currentTarget = dailyTargets[currentRound];

  React.useEffect(() => {
    if (currentTarget) {
      markPhotoAsSeen(currentTarget.id);
    }
  }, [currentTarget, markPhotoAsSeen]);

  const handleGuess = (guess: string, hintsUsed: number) => {
    if (isCurrentGuessed || !currentTarget) return;

    const check = checkAnswer(guess, currentTarget);
    const pts = check.isCorrect ? (check.isPartial ? 60 : Math.max(60, 120 - hintsUsed * 15)) : 0;

    const result = {
      isCorrect: check.isCorrect,
      isPartial: check.isPartial,
      partialCategory: check.partialCategory,
      pointsEarned: pts,
      submittedName: guess,
    };

    setCurrentResult(result);
    setIsCurrentGuessed(true);

    const updatedRoundResults = [
      ...roundResults,
      { target: currentTarget, isCorrect: check.isCorrect, pointsEarned: pts, guess },
    ];
    setRoundResults(updatedRoundResults);

    if (check.isCorrect) {
      triggerStarDust(check.isPartial ? 'partial' : 'exact');
    }
  };

  const handleNext = () => {
    if (currentRound < 2) {
      setCurrentRound((prev) => prev + 1);
      setIsCurrentGuessed(false);
      setCurrentResult(null);
    } else {
      const totalPoints = roundResults.reduce((acc, curr) => acc + curr.pointsEarned, 0);
      awardPoints(totalPoints, 'daily');
      setChallengeFinished(true);
    }
  };

  // If already played today
  if (alreadyPlayedToday && !challengeFinished && roundResults.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-3xl font-heading text-white">
          daily challenge completed
        </h2>
        <p className="text-neutral-400 text-sm">
          you have already completed today's challenge. return tomorrow for 3 new maps.
        </p>
      </div>
    );
  }

  // Finished summary
  if (challengeFinished) {
    const totalPoints = roundResults.reduce((acc, curr) => acc + curr.pointsEarned, 0);
    const correctCount = roundResults.filter((r) => r.isCorrect).length;

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
        <h2 className="text-3xl font-heading text-white">results</h2>
        <p className="text-neutral-400 text-sm">
          you identified {correctCount} of 3 targets.
        </p>

        <div className="p-4 sketch-border border-neutral-800 bg-neutral-950">
          <div className="text-4xl font-heading text-white">+{totalPoints} pts</div>
        </div>

        <div className="space-y-2 text-left">
          {roundResults.map((r, i) => (
            <div
              key={r.target.id}
              className="p-3 sketch-border border-neutral-800 flex items-center justify-between text-sm"
            >
              <div>
                <div className="text-white">round {i + 1}: {r.target.name}</div>
                <div className="text-xs text-neutral-500">your entry: {r.guess}</div>
              </div>
              <span className="text-neutral-300">
                {r.isCorrect ? `+${r.pointsEarned} pts` : '0 pts'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active round: heading is just "daily challenge: round 1/3"
  return (
    <div className="w-full">
      {currentTarget && (
        <ExploreViewer
          target={currentTarget}
          onGuessSubmitted={handleGuess}
          isGuessed={isCurrentGuessed}
          userResult={currentResult || undefined}
          onNextTarget={handleNext}
          titleHeading={`daily challenge: round ${currentRound + 1}/3`}
        />
      )}
    </div>
  );
};
