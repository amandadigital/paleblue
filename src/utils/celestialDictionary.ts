export interface CelestialSubject {
  canonical: string;
  keywords: string[];
  aliases: string[];
  category: 'planet & moon' | 'nebula' | 'galaxy' | 'solar system' | 'historic mission' | 'deep space';
}

export const CELESTIAL_SUBJECTS: CelestialSubject[] = [
  // Solar System Planets & Moons
  { canonical: 'saturn', keywords: ['saturn', 'saturnian', 'kronian'], aliases: ['saturn', 'planet saturn', 'the ringed planet', 'saturn rings'], category: 'planet & moon' },
  { canonical: 'jupiter', keywords: ['jupiter', 'jovian', 'great red spot'], aliases: ['jupiter', 'planet jupiter', 'great red spot', 'jupiter red spot'], category: 'planet & moon' },
  { canonical: 'mars', keywords: ['mars', 'martian', 'olympus mons', 'jezero'], aliases: ['mars', 'planet mars', 'the red planet', 'olympus mons'], category: 'planet & moon' },
  { canonical: 'moon', keywords: ['the moon', 'lunar surface', 'lunar crater'], aliases: ['moon', 'the moon', 'lunar'], category: 'planet & moon' },
  { canonical: 'pluto', keywords: ['pluto', 'tombaugh', 'plutonian'], aliases: ['pluto', 'planet pluto', 'tombaugh regio'], category: 'planet & moon' },
  { canonical: 'venus', keywords: ['venus', 'venusian'], aliases: ['venus', 'planet venus'], category: 'planet & moon' },
  { canonical: 'mercury', keywords: ['mercury', 'hermean'], aliases: ['mercury', 'planet mercury'], category: 'planet & moon' },
  { canonical: 'neptune', keywords: ['neptune', 'neptunian'], aliases: ['neptune', 'planet neptune'], category: 'planet & moon' },
  { canonical: 'uranus', keywords: ['uranus', 'uranian'], aliases: ['uranus', 'planet uranus'], category: 'planet & moon' },
  { canonical: 'sun', keywords: ['sun', 'solar flare', 'corona', 'sunspot'], aliases: ['sun', 'the sun', 'sol'], category: 'solar system' },
  { canonical: 'io', keywords: ['io', 'io volcano', 'pele plume'], aliases: ['io', 'jupiter moon io', 'jupiter io'], category: 'planet & moon' },
  { canonical: 'titan', keywords: ['titan', 'titan lake', 'kraken mare'], aliases: ['titan', 'saturn moon titan', 'saturn titan'], category: 'planet & moon' },
  { canonical: 'europa', keywords: ['europa'], aliases: ['europa', 'jupiter moon europa'], category: 'planet & moon' },
  { canonical: 'enceladus', keywords: ['enceladus', 'enceladus geyser'], aliases: ['enceladus', 'saturn moon enceladus'], category: 'planet & moon' },
  { canonical: 'callisto', keywords: ['callisto'], aliases: ['callisto', 'jupiter moon callisto'], category: 'planet & moon' },
  { canonical: 'ganymede', keywords: ['ganymede'], aliases: ['ganymede', 'jupiter moon ganymede'], category: 'planet & moon' },
  { canonical: 'triton', keywords: ['triton'], aliases: ['triton', 'neptune moon triton'], category: 'planet & moon' },
  { canonical: 'charon', keywords: ['charon'], aliases: ['charon', 'pluto moon charon'], category: 'planet & moon' },
  { canonical: 'ceres', keywords: ['ceres', 'dwarf planet ceres'], aliases: ['ceres', 'dwarf planet ceres'], category: 'planet & moon' },
  { canonical: 'valles marineris', keywords: ['valles marineris', 'mariner valley'], aliases: ['valles marineris', 'mariner valley'], category: 'planet & moon' },

  // Famous Nebulae
  { canonical: 'pillars of creation', keywords: ['pillars of creation', 'eagle nebula', 'm16'], aliases: ['pillars of creation', 'eagle nebula', 'm16', 'messier 16', 'pillars'], category: 'nebula' },
  { canonical: 'crab nebula', keywords: ['crab nebula', 'm1', 'ngc 1952'], aliases: ['crab nebula', 'crab', 'm1', 'messier 1'], category: 'nebula' },
  { canonical: 'orion nebula', keywords: ['orion nebula', 'm42', 'ngc 1976'], aliases: ['orion nebula', 'orion', 'm42', 'messier 42'], category: 'nebula' },
  { canonical: 'carina nebula', keywords: ['carina nebula', 'cosmic cliffs', 'ngc 3324', 'eta carinae'], aliases: ['carina nebula', 'carina', 'cosmic cliffs', 'ngc 3324'], category: 'nebula' },
  { canonical: 'helix nebula', keywords: ['helix nebula', 'ngc 7293', 'eye of god'], aliases: ['helix nebula', 'helix', 'ngc 7293'], category: 'nebula' },
  { canonical: 'ring nebula', keywords: ['ring nebula', 'm57', 'ngc 6720'], aliases: ['ring nebula', 'ring', 'm57', 'messier 57'], category: 'nebula' },
  { canonical: 'horsehead nebula', keywords: ['horsehead nebula', 'barnard 33', 'b33'], aliases: ['horsehead nebula', 'horsehead', 'b33'], category: 'nebula' },
  { canonical: 'tarantula nebula', keywords: ['tarantula nebula', '30 doradus', 'ngc 2070'], aliases: ['tarantula nebula', 'tarantula', '30 doradus'], category: 'nebula' },
  { canonical: 'dumbbell nebula', keywords: ['dumbbell nebula', 'm27', 'ngc 6853'], aliases: ['dumbbell nebula', 'dumbbell', 'm27', 'messier 27'], category: 'nebula' },
  { canonical: 'rosette nebula', keywords: ['rosette nebula', 'ngc 2237'], aliases: ['rosette nebula', 'rosette', 'ngc 2237'], category: 'nebula' },
  { canonical: 'ant nebula', keywords: ['ant nebula', 'menzel 3', 'mz 3'], aliases: ['ant nebula', 'ant', 'menzel 3'], category: 'nebula' },
  { canonical: 'butterfly nebula', keywords: ['butterfly nebula', 'ngc 6302'], aliases: ['butterfly nebula', 'butterfly', 'ngc 6302'], category: 'nebula' },
  { canonical: 'cat\'s eye nebula', keywords: ['cat\'s eye', 'cats eye', 'ngc 6543'], aliases: ['cats eye nebula', 'cats eye', 'cat\'s eye nebula', 'ngc 6543'], category: 'nebula' },
  { canonical: 'trifid nebula', keywords: ['trifid nebula', 'm20', 'ngc 6514'], aliases: ['trifid nebula', 'trifid', 'm20'], category: 'nebula' },
  { canonical: 'lagoon nebula', keywords: ['lagoon nebula', 'm8', 'ngc 6523'], aliases: ['lagoon nebula', 'lagoon', 'm8'], category: 'nebula' },
  { canonical: 'veil nebula', keywords: ['veil nebula', 'ngc 6960'], aliases: ['veil nebula', 'veil', 'cygnus loop'], category: 'nebula' },

  // Famous Galaxies
  { canonical: 'andromeda galaxy', keywords: ['andromeda', 'm31', 'ngc 224'], aliases: ['andromeda galaxy', 'andromeda', 'm31', 'messier 31'], category: 'galaxy' },
  { canonical: 'whirlpool galaxy', keywords: ['whirlpool galaxy', 'm51', 'ngc 5194'], aliases: ['whirlpool galaxy', 'whirlpool', 'm51', 'messier 51'], category: 'galaxy' },
  { canonical: 'sombrero galaxy', keywords: ['sombrero galaxy', 'm104', 'ngc 4594'], aliases: ['sombrero galaxy', 'sombrero', 'm104', 'messier 104'], category: 'galaxy' },
  { canonical: 'cartwheel galaxy', keywords: ['cartwheel galaxy', 'eso 350-40'], aliases: ['cartwheel galaxy', 'cartwheel'], category: 'galaxy' },
  { canonical: 'triangulum galaxy', keywords: ['triangulum galaxy', 'm33', 'ngc 598'], aliases: ['triangulum galaxy', 'triangulum', 'm33'], category: 'galaxy' },
  { canonical: 'pinwheel galaxy', keywords: ['pinwheel galaxy', 'm101', 'ngc 5457'], aliases: ['pinwheel galaxy', 'pinwheel', 'm101'], category: 'galaxy' },
  { canonical: 'milky way', keywords: ['milky way', 'galactic center', 'sagittarius a'], aliases: ['milky way', 'milky way galaxy', 'galactic core'], category: 'galaxy' },
  { canonical: 'black eye galaxy', keywords: ['black eye galaxy', 'm64', 'evil eye'], aliases: ['black eye galaxy', 'black eye', 'm64'], category: 'galaxy' },
  { canonical: 'cigar galaxy', keywords: ['cigar galaxy', 'm82', 'ngc 3034'], aliases: ['cigar galaxy', 'm82'], category: 'galaxy' },
  { canonical: 'stephan\'s quintet', keywords: ['stephan\'s quintet', 'stephans quintet', 'hickson 92'], aliases: ['stephan\'s quintet', 'stephans quintet', 'hickson 92', 'quintet'], category: 'galaxy' },

  // Star Clusters & Deep Space
  { canonical: 'pleiades', keywords: ['pleiades', 'seven sisters', 'm45'], aliases: ['pleiades', 'seven sisters', 'm45', 'subaru'], category: 'deep space' },
  { canonical: 'cosmic cliffs', keywords: ['cosmic cliffs', 'ngc 3324'], aliases: ['cosmic cliffs', 'carina cliffs', 'ngc 3324'], category: 'deep space' },
];

/**
 * Given a raw NASA title or query string, detects if it refers to any known celestial subject.
 */
export function identifySubjectInText(text: string): CelestialSubject | null {
  const lower = text.toLowerCase();
  for (const item of CELESTIAL_SUBJECTS) {
    for (const kw of item.keywords) {
      // Check full word match or sub-phrase
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        return item;
      }
    }
  }
  return null;
}
