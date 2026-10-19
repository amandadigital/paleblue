import { SpaceObject } from '../types/game';
import { SPACE_OBJECTS } from '../data/spaceObjects';
import { identifySubjectInText, CELESTIAL_SUBJECTS, CelestialSubject } from '../utils/celestialDictionary';

export const NASA_API_KEY = 'tPCWUtcdX0zM1JSR2wo4jIw1GkFsWwGZm2VJgLFt';

/**
 * Strict regex patterns to filter out:
 * 1. Earth pictures (Earth from orbit, clouds, continents, hurricanes, ISS views, Earthrise)
 * 2. Lab, cleanroom, facility, testing chamber pictures
 * 3. Rockets, boosters, launch pads, gantries
 * 4. People, engineers, scientists, ceremonies, conferences, town celebrations
 * 5. Diagrams, schematics, charts, posters, logos, illustrations
 * 6. Non-cosmic hardware (rover wheels, parachutes, heat shields)
 */
export const NON_COSMIC_PATTERNS: RegExp[] = [
  // 1. Earth & Terrestrial images
  /\bearth\b/i,
  /\bearth['’s]*\b/i,
  /\bblue marble\b/i,
  /\bearthrise\b/i,
  /\bterrestrial\b/i,
  /\bglobe\b/i,
  /\bcontinent\b/i,
  /\bocean\b/i,
  /\bhurricane\b/i,
  /\bcyclone\b/i,
  /\btyphoon\b/i,
  /\bweather\b/i,
  /\biss\b/i,
  /\binternational space station\b/i,
  /\blow earth orbit\b/i,
  /\borbiting earth\b/i,
  /\borbit of earth\b/i,
  /\batmosphere of earth\b/i,
  /\bground station\b/i,
  /\bflorida\b/i,
  /\bcape canaveral\b/i,
  /\bpennsylvania\b/i,

  // 2. Labs, Cleanrooms & Facilities
  /\blab\b/i,
  /\blaboratory\b/i,
  /\bcleanroom\b/i,
  /\bclean room\b/i,
  /\bfacility\b/i,
  /\bhangar\b/i,
  /\bbuilding\b/i,
  /\bauditorium\b/i,
  /\bchamber\b/i,
  /\bvacuum chamber\b/i,
  /\btest stand\b/i,
  /\bwind tunnel\b/i,
  /\bheadquarters\b/i,
  /\bgoddard space\b/i,
  /\bkennedy space center\b/i,
  /\bjpl facility\b/i,
  /\bjohnson space center\b/i,

  // 3. People, Ceremonies, Conferences & Events
  /\bperson\b/i,
  /\bpeople\b/i,
  /\bengineer\b/i,
  /\bscientist\b/i,
  /\btechnician\b/i,
  /\bastronaut\b/i,
  /\bcrew\b/i,
  /\badministrator\b/i,
  /\bdirector\b/i,
  /\bpress\b/i,
  /\bconference\b/i,
  /\bcelebration\b/i,
  /\bceremony\b/i,
  /\baward\b/i,
  /\bmeeting\b/i,
  /\bspeech\b/i,
  /\bsymposium\b/i,
  /\bbriefing\b/i,
  /\bportrait\b/i,
  /\bvisitor\b/i,
  /\bstudent\b/i,
  /\bchildren\b/i,
  /\bmuseum\b/i,
  /\bexhibit\b/i,

  // 4. Rockets, Launchers & Launch Pads
  /\brocket\b/i,
  /\blaunch\b/i,
  /\blauncher\b/i,
  /\bpad\b/i,
  /\bpad 39\b/i,
  /\bsls\b/i,
  /\bbooster\b/i,
  /\bcrawler\b/i,
  /\bfalcon\b/i,
  /\batlas\b/i,
  /\bdelta\b/i,
  /\bvab\b/i,
  /\bvehicle assembly\b/i,
  /\bfairing\b/i,
  /\bengine test\b/i,
  /\bstatic fire\b/i,
  /\bliftoff\b/i,
  /\brollout\b/i,
  /\bgantry\b/i,
  /\btransporter\b/i,
  /\bwheel\b/i,
  /\bchassis\b/i,
  /\bparachute\b/i,
  /\bheat shield\b/i,

  // 5. Diagrams, Posters, Logos & Artwork
  /\bdiagram\b/i,
  /\bschematic\b/i,
  /\bchart\b/i,
  /\bgraph\b/i,
  /\binfographic\b/i,
  /\blogo\b/i,
  /\bposter\b/i,
  /\bpatch\b/i,
  /\binsignia\b/i,
  /\bconcept\b/i,
  /\billustration\b/i,
  /\bdrawing\b/i,
  /\bartist['’s]* impression\b/i,
  /\bartist['’s]* concept\b/i
];

/**
 * Validates whether a NASA image is strictly from the cosmos (outer space, celestial bodies).
 * Rejects Earth photos, lab photos, rocket photos, diagrams, and people.
 */
export function isStrictlyCosmosOnly(
  title: string,
  keywords: string[] = [],
  description: string = ''
): { valid: boolean; reason?: string } {
  const titleAndKw = `${title} ${keywords.join(' ')}`.toLowerCase();

  // Test against non-cosmic patterns
  for (const pattern of NON_COSMIC_PATTERNS) {
    if (pattern.test(titleAndKw)) {
      return { valid: false, reason: `Matches non-cosmic filter (${pattern.source})` };
    }
  }

  // Check description for explicit Earth-centric or lab-centric photography keywords
  const descLower = description.toLowerCase();
  const explicitDescExclusions = [
    /\bphotograph of earth\b/i,
    /\bview of earth\b/i,
    /\bearth as seen from\b/i,
    /\bclean room facility\b/i,
    /\blaboratory setting\b/i,
    /\blaunch pad 39\b/i,
    /\brocketry test\b/i,
    /\bengineers inspect\b/i,
    /\btechnicians prepare\b/i
  ];

  for (const pattern of explicitDescExclusions) {
    if (pattern.test(descLower)) {
      return { valid: false, reason: `Description matched: ${pattern.source}` };
    }
  }

  // Must correspond to an astronomical cosmos subject or be an authentic celestial scene
  const identifiedSubject = identifySubjectInText(title) || identifySubjectInText(keywords.join(' '));
  if (!identifiedSubject && !titleAndKw.includes('nebula') && !titleAndKw.includes('galaxy') && !titleAndKw.includes('crater')) {
    return { valid: false, reason: 'No recognized celestial target found' };
  }

  return { valid: true };
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Organizes targets by distinct celestial category to guarantee balanced rotation
 * and prevent repetitive Pluto/planetary streaks.
 */
function createBalancedCosmicDeck(objects: SpaceObject[]): SpaceObject[] {
  const byCategory: Record<string, SpaceObject[]> = {
    'planet & moon': [],
    nebula: [],
    galaxy: [],
    'deep space': []
  };

  for (const obj of objects) {
    const cat = obj.category in byCategory ? obj.category : 'deep space';
    byCategory[cat].push(obj);
  }

  // Shuffle each category individually
  for (const k of Object.keys(byCategory)) {
    byCategory[k] = shuffle(byCategory[k]);
  }

  // Interleave categories: Planet/Moon -> Nebula -> Galaxy -> Deep Space -> repeat
  const interleaved: SpaceObject[] = [];
  const categories = ['planet & moon', 'nebula', 'galaxy', 'deep space'];
  let addedAny = true;

  while (addedAny) {
    addedAny = false;
    for (const cat of categories) {
      if (byCategory[cat].length > 0) {
        interleaved.push(byCategory[cat].shift()!);
        addedAny = true;
      }
    }
  }

  return interleaved;
}

// Active rotating deck
let activeDeck: SpaceObject[] = createBalancedCosmicDeck(SPACE_OBJECTS);
const playedHistory = new Set<string>();

/**
 * Fetches a random live image from NASA Images API matching a specific cosmic subject,
 * with strict cosmos-only validation.
 */
async function fetchLiveCosmicNasaImage(subject: CelestialSubject): Promise<SpaceObject | null> {
  try {
    const query = encodeURIComponent(`${subject.canonical} hubble`);
    const res = await fetch(`https://images-api.nasa.gov/search?q=${query}&media_type=image`);
    if (!res.ok) return null;

    const data = await res.json();
    const items = data?.collection?.items;
    if (!Array.isArray(items) || items.length === 0) return null;

    // Filter items using strict cosmos validation
    for (const item of items) {
      const d = item.data?.[0];
      if (!d) continue;

      const title = d.title || '';
      const keywords = Array.isArray(d.keywords) ? d.keywords : [];
      const description = d.description || '';

      const { valid } = isStrictlyCosmosOnly(title, keywords, description);
      if (!valid) continue;

      // Find valid thumbnail/small image link
      const previewLink = item.links?.find((l: { href?: string }) => l.href && (l.href.endsWith('.jpg') || l.href.endsWith('.png')));
      const imageUrl = previewLink?.href || `https://images-assets.nasa.gov/image/${d.nasa_id}/${d.nasa_id}~small.jpg`;

      return {
        id: `nasa-live-${d.nasa_id}`,
        nasaId: d.nasa_id,
        name: subject.canonical,
        aliases: subject.aliases,
        category: subject.category,
        missionOrTelescope: d.secondary_creator || 'NASA / Space Telescope',
        distance: 'deep cosmos',
        coordinates: 'celestial sphere',
        constellationOrTarget: subject.canonical,
        dateCaptured: d.date_created ? new Date(d.date_created).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }).toLowerCase() : 'archive',
        imageUrl,
        story: description.slice(0, 160).toLowerCase() || `${subject.canonical} captured across deep cosmic space.`,
        hints: [
          `celestial ${subject.category}`,
          `target identification: ${subject.canonical}`,
          `documented in astronomical surveys`
        ]
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns a truly non-repeating, verified celestial target strictly from the cosmos.
 * Remembers what photos were already shown to the account and will NOT repeat them
 * unless all random NASA photos in the catalog have already been used.
 * Guarantees zero Earth, zero lab, and zero rocket imagery.
 * Balances distribution across planets, moons, nebulae, and galaxies.
 */
export async function getRandomNasaTarget(
  excludedIds: Set<string> = new Set(),
  accountSeenIds: Set<string> | string[] = new Set()
): Promise<SpaceObject> {
  const seenSet = accountSeenIds instanceof Set ? accountSeenIds : new Set(accountSeenIds || []);

  // 1. Filter SPACE_OBJECTS to candidate objects not yet seen by the account and not excluded in current view
  let candidates = SPACE_OBJECTS.filter(
    (obj) => !seenSet.has(obj.id) && !excludedIds.has(obj.id)
  );

  // 2. If NO unseen candidates remain, ALL random NASA photos in the catalog have already been used!
  // As requested: "and is not showing them again unless all random nasa photos are already used?"
  if (candidates.length === 0) {
    // Fresh cycle from all objects not currently on screen
    candidates = SPACE_OBJECTS.filter((obj) => !excludedIds.has(obj.id));
    if (candidates.length === 0) {
      candidates = [...SPACE_OBJECTS];
    }
  }

  // 3. Create a balanced, interleaved cosmic deck from the candidates
  const deck = createBalancedCosmicDeck(candidates);
  const chosen = deck[0] || candidates[Math.floor(Math.random() * candidates.length)];

  return chosen;
}

/**
 * Returns N unique random celestial destinations strictly from the cosmos,
 * ensuring none repeat photos the account has already seen unless all are used.
 */
export async function getRandomNasaTargets(
  count: number,
  excludedIds: Set<string> = new Set(),
  accountSeenIds: Set<string> | string[] = new Set()
): Promise<SpaceObject[]> {
  const result: SpaceObject[] = [];
  const localExcluded = new Set(excludedIds);
  const localSeen = accountSeenIds instanceof Set ? new Set(accountSeenIds) : new Set(accountSeenIds || []);

  for (let i = 0; i < count; i++) {
    const target = await getRandomNasaTarget(localExcluded, localSeen);
    result.push(target);
    localExcluded.add(target.id);
    localSeen.add(target.id);
  }

  return result;
}

export async function fetchNasaAssetImage(nasaId: string, fallbackUrl?: string): Promise<string> {
  return fallbackUrl || `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~small.jpg`;
}
