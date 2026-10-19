import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SpaceObject } from '../types/game';
import { SPACE_OBJECTS } from '../data/spaceObjects';
import { checkAnswer, triggerStarDust } from '../utils/gameHelpers';
import { getRandomNasaTarget } from '../services/nasaService';
import { ExploreViewer } from './ExploreViewer';
import { sound } from '../utils/audio';

export const FreeMode: React.FC = () => {
  const { awardPoints, seenPhotoIds, markPhotoAsSeen, totalCatalogCount } = useAuth();

  const [mapNumber, setMapNumber] = useState(1);
  const [currentTarget, setCurrentTarget] = useState<SpaceObject>(() => {
    // Pick an initial unseen target synchronously
    const seenSet = new Set(seenPhotoIds || []);
    const unseen = SPACE_OBJECTS.filter((obj) => !seenSet.has(obj.id));
    const pool = unseen.length > 0 ? unseen : SPACE_OBJECTS;
    return pool[Math.floor(Math.random() * pool.length)];
  });
  const [isCurrentGuessed, setIsCurrentGuessed] = useState(false);
  const [currentResult, setCurrentResult] = useState<{
    isCorrect: boolean;
    isPartial?: boolean;
    partialCategory?: string;
    pointsEarned: number;
    submittedName: string;
  } | null>(null);

  const playedIdsRef = useRef<Set<string>>(new Set([currentTarget.id]));

  // Record initial target in account memory
  useEffect(() => {
    if (currentTarget) {
      markPhotoAsSeen(currentTarget.id);
      playedIdsRef.current.add(currentTarget.id);
    }
  }, [currentTarget.id]);

  const loadNextRandomTarget = useCallback(async () => {
    setIsCurrentGuessed(false);
    setCurrentResult(null);

    try {
      const nextObj = await getRandomNasaTarget(playedIdsRef.current, seenPhotoIds);
      playedIdsRef.current.add(nextObj.id);
      markPhotoAsSeen(nextObj.id);
      setCurrentTarget(nextObj);
      setMapNumber((prev) => prev + 1);
    } catch {
      // Fallback
      const randomFallback = SPACE_OBJECTS[Math.floor(Math.random() * SPACE_OBJECTS.length)];
      setCurrentTarget(randomFallback);
      setMapNumber((prev) => prev + 1);
    }
  }, [seenPhotoIds, markPhotoAsSeen]);

  const handleGuess = (guess: string) => {
    if (isCurrentGuessed || !currentTarget) return;

    const check = checkAnswer(guess, currentTarget);
    let pts = 0;

    if (check.isCorrect) {
      if (check.isPartial) {
        // Half points (150 pts) for writing just 'nebula' or general category
        pts = 150;
        triggerStarDust('partial');
      } else {
        // ALL 300 points for guessing exact nebula / target
        pts = 300;
        triggerStarDust('exact');
      }
      awardPoints(pts, 'free');
    } else {
      pts = 0;
      sound.playMissTone();
      awardPoints(0, 'free');
    }

    setCurrentResult({
      isCorrect: check.isCorrect,
      isPartial: check.isPartial,
      partialCategory: check.partialCategory,
      pointsEarned: pts,
      submittedName: guess,
    });

    setIsCurrentGuessed(true);
  };

  return (
    <div className="w-full">
      {currentTarget && (
        <ExploreViewer
          key={currentTarget.id}
          target={currentTarget}
          onGuessSubmitted={handleGuess}
          isGuessed={isCurrentGuessed}
          userResult={currentResult || undefined}
          onNextTarget={loadNextRandomTarget}
          titleHeading={`free mode · map #${mapNumber} (${seenPhotoIds.length}/${totalCatalogCount} seen)`}
        />
      )}
    </div>
  );
};
