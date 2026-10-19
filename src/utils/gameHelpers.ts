import { SpaceObject } from '../types/game';
import { identifySubjectInText } from './celestialDictionary';
import confetti from 'canvas-confetti';
import { sound } from './audio';

export interface CheckAnswerResult {
  isCorrect: boolean;
  isPartial: boolean;          // true when user guessed category e.g. "nebula", "galaxy"
  partialCategory?: 'nebula' | 'galaxy' | 'planet' | 'moon';
  closeness: number;
  matchType: 'exact' | 'partial' | 'wrong';
  message?: string;
}

export function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Intelligent celestial answer evaluation:
 * - If user writes just 'nebula' and the object is a nebula, they get half points (+150 pts).
 * - If user guesses the exact nebula (e.g. 'crab nebula', 'crab', 'orion', 'ring'), they get all 300 pts!
 * - Also handles category guesses for 'galaxy', 'planet', 'moon' gracefully.
 */
export function checkAnswer(guess: string, target: SpaceObject): CheckAnswerResult {
  const normGuess = normalizeStr(guess);
  if (!normGuess || normGuess === 'pass') {
    return { isCorrect: false, isPartial: false, closeness: 0, matchType: 'wrong' };
  }

  const targetNameNorm = normalizeStr(target.name);
  const targetFullText = ` ${target.name} ${target.aliases.join(' ')} `.toLowerCase();

  // Determine if target is a nebula
  const isTargetNebula =
    target.category === 'nebula' ||
    targetFullText.includes('nebula') ||
    ['pillars of creation', 'crab', 'orion', 'ring', 'helix', 'carina', 'cats eye', 'cat eye', 'horsehead', 'eagle', 'lagoon', 'tarantula', 'veil', 'butterfly', 'rosette'].some(
      (n) => targetFullText.includes(n)
    );

  // Determine if target is a galaxy
  const isTargetGalaxy =
    target.category === 'galaxy' ||
    targetFullText.includes('galaxy') ||
    ['andromeda', 'whirlpool', 'sombrero', 'triangulum', 'pinwheel', 'cartwheel', 'centaurus', 'messier 87', 'm87'].some(
      (g) => targetFullText.includes(g)
    );

  // Determine if target is a planet
  const isTargetPlanet =
    target.category === 'planet & moon' &&
    ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].some((p) =>
      targetFullText.includes(p)
    );

  // Determine if target is a moon
  const isTargetEarthMoon = target.id === 'the-moon' || targetNameNorm === 'the moon' || targetNameNorm === 'moon';
  const isTargetOtherMoon =
    !isTargetEarthMoon &&
    (targetFullText.includes('moon') ||
      ['europa', 'titan', 'enceladus', 'ganymede', 'io', 'callisto', 'triton', 'phobos', 'deimos', 'charon'].some(
        (m) => targetFullText.includes(m)
      ));

  // --- 1. Generic Category Checks (Awards Half Points) ---

  // User wrote just "nebula" or "a nebula" or "nebulae"
  const isGenericNebulaGuess = ['nebula', 'a nebula', 'the nebula', 'nebulae'].includes(normGuess);
  if (isGenericNebulaGuess) {
    if (isTargetNebula) {
      return {
        isCorrect: true,
        isPartial: true,
        partialCategory: 'nebula',
        closeness: 0.5,
        matchType: 'partial',
        message: 'Category match: Nebula (+150 pts). Name the exact nebula for all 300 pts!',
      };
    } else {
      return { isCorrect: false, isPartial: false, closeness: 0, matchType: 'wrong' };
    }
  }

  // User wrote just "galaxy"
  const isGenericGalaxyGuess = ['galaxy', 'a galaxy', 'the galaxy', 'galaxies'].includes(normGuess);
  if (isGenericGalaxyGuess) {
    if (isTargetGalaxy) {
      return {
        isCorrect: true,
        isPartial: true,
        partialCategory: 'galaxy',
        closeness: 0.5,
        matchType: 'partial',
        message: 'Category match: Galaxy (+150 pts). Name the exact galaxy for all 300 pts!',
      };
    } else {
      return { isCorrect: false, isPartial: false, closeness: 0, matchType: 'wrong' };
    }
  }

  // User wrote just "planet"
  const isGenericPlanetGuess = ['planet', 'a planet', 'the planet', 'planets'].includes(normGuess);
  if (isGenericPlanetGuess) {
    if (isTargetPlanet) {
      return {
        isCorrect: true,
        isPartial: true,
        partialCategory: 'planet',
        closeness: 0.5,
        matchType: 'partial',
        message: 'Category match: Planet (+150 pts). Name the exact planet for all 300 pts!',
      };
    } else {
      return { isCorrect: false, isPartial: false, closeness: 0, matchType: 'wrong' };
    }
  }

  // User wrote just "moon" when target is another moon (like Titan, Europa, Enceladus)
  if (['moon', 'a moon', 'the moon'].includes(normGuess) && isTargetOtherMoon) {
    return {
      isCorrect: true,
      isPartial: true,
      partialCategory: 'moon',
      closeness: 0.5,
      matchType: 'partial',
      message: 'Category match: Moon (+150 pts). Name the specific moon for all 300 pts!',
    };
  }

  // --- 2. Exact Candidate Matching (Awards ALL 300 Points) ---

  const allCandidates = [target.name, ...target.aliases].map(normalizeStr);

  for (const c of allCandidates) {
    if (normGuess === c) {
      return { isCorrect: true, isPartial: false, closeness: 1.0, matchType: 'exact' };
    }

    // Substring match if candidate contains guess or vice versa (and guess is not just a category word)
    if (
      normGuess.length >= 3 &&
      !['nebula', 'galaxy', 'planet', 'moon', 'space', 'star'].includes(normGuess) &&
      (c.includes(normGuess) || normGuess.includes(c))
    ) {
      return { isCorrect: true, isPartial: false, closeness: 0.95, matchType: 'exact' };
    }

    // Levenshtein fuzzy match for slight typos in exact name
    const dist = levenshteinDistance(normGuess, c);
    const maxLen = Math.max(normGuess.length, c.length);
    const similarity = 1 - dist / maxLen;
    if (maxLen > 4 && dist <= 2) {
      return { isCorrect: true, isPartial: false, closeness: similarity, matchType: 'exact' };
    }
  }

  // Also check candidate names with "nebula" / "galaxy" stripped (e.g. target "Crab Nebula", stripped "Crab")
  for (const c of allCandidates) {
    const stripped = c.replace(/\b(nebula|galaxy|planet)\b/g, '').trim();
    if (stripped.length >= 3 && (normGuess === stripped || normGuess.includes(stripped) || stripped.includes(normGuess))) {
      return { isCorrect: true, isPartial: false, closeness: 1.0, matchType: 'exact' };
    }
  }

  // --- 3. Recognized Celestial Subject Matching ---
  const guessSubject = identifySubjectInText(normGuess);
  const targetSubject = identifySubjectInText(target.name) || identifySubjectInText(target.aliases.join(' '));

  if (guessSubject && targetSubject && guessSubject.canonical === targetSubject.canonical) {
    return { isCorrect: true, isPartial: false, closeness: 1.0, matchType: 'exact' };
  }

  // --- 4. Whole Word-Boundary Match ---
  const safeGuess = normGuess.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`\\b${safeGuess}\\b`, 'i');
  if (
    !['nebula', 'galaxy', 'planet', 'moon', 'space', 'star', 'the'].includes(normGuess) &&
    wordBoundaryRegex.test(targetFullText)
  ) {
    return { isCorrect: true, isPartial: false, closeness: 0.95, matchType: 'exact' };
  }

  // --- 5. Solar Planet Names Explicit Match ---
  const solarPlanets = ['saturn', 'jupiter', 'mars', 'venus', 'mercury', 'pluto', 'neptune', 'uranus', 'sun'];
  for (const p of solarPlanets) {
    if (normGuess.includes(p) && targetFullText.includes(p)) {
      return { isCorrect: true, isPartial: false, closeness: 0.95, matchType: 'exact' };
    }
  }

  return { isCorrect: false, isPartial: false, closeness: 0, matchType: 'wrong' };
}

export function triggerStarDust(type: 'exact' | 'partial' = 'exact') {
  try {
    if (type === 'exact') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#38bdf8', '#bae6fd', '#fef08a', '#ffffff', '#e0f2fe'],
        shapes: ['circle', 'star'],
        scalar: 0.9,
        ticks: 200,
      });
      sound.playSuccessChime();
    } else {
      confetti({
        particleCount: 28,
        spread: 45,
        origin: { y: 0.65 },
        colors: ['#e2e8f0', '#94a3b8', '#38bdf8'],
        shapes: ['circle'],
        scalar: 0.75,
        ticks: 140,
      });
      sound.playPartialChime();
    }
  } catch {
    // ignore
  }
}

export function getDailyTargets(pool: SpaceObject[], dateStr: string): SpaceObject[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) & 0xffffffff;
  }

  const selected: SpaceObject[] = [];
  const poolCopy = [...pool];

  for (let round = 0; round < 3; round++) {
    const idx = Math.abs(hash + round * 17) % poolCopy.length;
    selected.push(poolCopy[idx]);
    poolCopy.splice(idx, 1);
  }

  return selected;
}
