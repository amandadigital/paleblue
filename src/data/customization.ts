import { BotPlayer } from '../types/game';

export interface AvatarOption {
  id: string;
  label: string;
  symbol: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'pale-dot', label: 'pale dot', symbol: '·' },
  { id: 'voyager', label: 'voyager', symbol: '🛰' },
  { id: 'rings', label: 'rings', symbol: '🪐' },
  { id: 'crescent', label: 'moon', symbol: '☽' },
  { id: 'telescope', label: 'telescope', symbol: '🔭' },
  { id: 'starburst', label: 'star', symbol: '✦' },
];

export const BOT_PLAYERS: BotPlayer[] = [
  {
    id: 'voyager-1',
    name: 'voyager-1',
    avatar: 'voyager',
    tagline: 'drifting into interstellar void since 1977',
    minDelaySec: 7,
    maxDelaySec: 14,
    accuracy: 0.72,
    dialogueSuccess: [
      'radio telemetry locked onto the target.',
      'narrow-angle camera confirmed the coordinates.',
      'transmitting packet back to goldstone station.'
    ],
    dialogueFail: [
      'signal attenuated across deep space...',
      'instrument sensor glitch in heliosphere...',
      'faint static on 8 ghz band...'
    ]
  },
  {
    id: 'sagan-bot',
    name: 'carl-sagan',
    avatar: 'starburst',
    tagline: 'stargazer pondering our fragile speck',
    minDelaySec: 5,
    maxDelaySec: 11,
    accuracy: 0.88,
    dialogueSuccess: [
      'extraordinary claims with extraordinary clarity.',
      'look again at that beauty. unmistakable.',
      'we are made of starstuff.'
    ],
    dialogueFail: [
      'for small creatures such as we, the vastness is bearable only through love...',
      'perhaps my eye was blinded by the light of a hundred billion suns.',
      'the cosmos keeps some secrets for tomorrow.'
    ]
  },
  {
    id: 'kepler-bot',
    name: 'kepler-452',
    avatar: 'telescope',
    tagline: 'photometer scanning stellar eclipses',
    minDelaySec: 6,
    maxDelaySec: 12,
    accuracy: 0.78,
    dialogueSuccess: [
      'light curve signature identified.',
      'photometric anomaly resolved.',
      'coordinates matched in star catalog.'
    ],
    dialogueFail: [
      'reaction wheel jitter degraded the focus...',
      'cosmic ray hit the ccd array...',
      'transit data inconclusive...'
    ]
  },
  {
    id: 'deep-sky-ghost',
    name: 'deep-sky-ghost',
    avatar: 'rings',
    tagline: 'spectral wanderer across messy catalogs',
    minDelaySec: 8,
    maxDelaySec: 16,
    accuracy: 0.65,
    dialogueSuccess: [
      'a familiar haunt in the dark sky.',
      'photons older than humanity caught in my gaze.',
      'i recall this dust lane from centuries past.'
    ],
    dialogueFail: [
      'the nebula drift confused my ancient lens...',
      'interstellar extinction dimmed the view...',
      'lost in the spiral arms...'
    ]
  }
];
