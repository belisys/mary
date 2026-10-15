/**
 * =========================================================================
 * POLYMORPHIC MEMORY DATABASE (3,800 ADDRESSABLE STARS)
 * =========================================================================
 * - Maps every single particle in Mary's 3D beating heart to curated,
 *   authentic thoughts, medical reminders, motivation, and literary wisdom.
 * - Organized into 4 strict constellation pools (Travel, Poems, Advice, Words From Me)
 *   plus All Stars full galaxy.
 * - Zero AI-generated em dashes.
 */

import { MARY_SANCTUARY_LEXICON } from './marySanctuaryLexicon.js?v=335';

export const PHOTO_MEMORIES = {
  1: {
    id: 1,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ Ancient Wonders",
    location: "Giza & Cairo, Egypt",
    title: "The Pyramids With You",
    photoUrl: "assets/images/pyramids_giza.jpg",
    content: "I haven't visited the Pyramids of Giza yet. Life has been hard, and money has been tight, but if there is one place on this earth I want to see, I only want to see it with you. Not alone, not with anyone else. Standing there together under the desert sky, discovering the world side by side.",
    tease: "A place I only want to discover with you, not with anyone else."
  },
  2: {
    id: 2,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ My Local Guide",
    location: "Siwa Oasis, Egypt",
    title: "Siwa: Salt Lakes & Desert Stars",
    photoUrl: "assets/images/siwa_oasis.jpg",
    content: "I told you I want to visit Siwa, and you are my official local guide. Floating in the turquoise salt lakes, climbing the golden desert dunes at sunset, and lying side by side under the clearest Milky Way in North Africa.",
    tease: "You are taking me to Siwa, and I won't accept any other tour guide."
  },
  3: {
    id: 3,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ Imperial Romance",
    location: "Vienna, Austria",
    title: "Viennese Cafes & Palaces",
    photoUrl: "assets/images/vienna_austria.jpg",
    content: "Walking through the cobblestone streets of Vienna at dusk, admiring imperial palaces and art galleries, ducking into historic Viennese coffeehouses for warm Sachertorte and coffee, and listening to classical music in the city of dreams.",
    tease: "Palaces, classical art, and warm coffeehouse afternoons."
  },
  4: {
    id: 4,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ Mediterranean Magic",
    location: "Barcelona, Spain",
    title: "Gothic Alleys & Mediterranean Sun",
    photoUrl: "assets/images/barcelona_spain.jpg",
    content: "Getting lost in the narrow stone alleys of the Gothic Quarter, staring up at Gaudi's whimsical architecture at Sagrada Familia, eating tapas in sunlit plazas, and feeling the warm Mediterranean breeze along the sea.",
    tease: "Gothic streets, Gaudi's magic, and sea breeze."
  },
  5: {
    id: 5,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ Alpine Serenity",
    location: "Lauterbrunnen & Zermatt, Switzerland",
    title: "Swiss Chalet & Snow Peaks",
    photoUrl: "assets/images/swiss_alps.jpg",
    content: "Waking up in a warm wooden chalet in the Swiss Alps. Crisp mountain air, snow falling silently on the pine trees, waterfalls cascading down cliffs, and sipping rich hot Swiss chocolate wrapped in one giant blanket together by the fireplace.",
    tease: "Snow outside, fireplace inside, wrapped up together."
  },
  6: {
    id: 6,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ Storybook Trails",
    location: "Bavaria & Black Forest, Germany",
    title: "Fairytale Trails in Germany",
    photoUrl: "assets/images/germany_fairytale.jpg",
    content: "Walking along cobblestone fairytale streets with timbered houses and flower boxes in Germany. Exploring medieval castles that look like they jumped straight out of your fantasy sketchbook, and stopping by cozy bakeries for warm pastries.",
    tease: "Straight out of a fairytale, but real."
  },
  7: {
    id: 7,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ The British Dream",
    location: "London, United Kingdom",
    title: "Rainy Streets & Big Dreams",
    photoUrl: "assets/images/london_uk.jpg",
    content: "One day we will walk through the London drizzle, drink proper Earl Grey tea, browse vintage bookstores along the Thames, and buy you that warm English trench coat you love.",
    tease: "You are not English, but I will buy you the raincoat anyway."
  },
  8: {
    id: 8,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ The Big Apple",
    location: "New York City, USA",
    title: "City Lights & Central Park",
    photoUrl: "assets/images/nyc_skyline.jpg",
    content: "Walking through Central Park in the crisp autumn air with golden leaves falling around us, grabbing hot coffee, and watching the Manhattan skyline illuminate like a sea of diamonds against the night sky.",
    tease: "Big city lights, Central Park walks, and hot coffee."
  },
  9: {
    id: 9,
    type: "photo",
    category: "Travel & Shared Dreams",
    tag: "✦ Delicious Meals Together",
    location: "Our Sanctuary Kitchen",
    title: "Cooking Together & Kitchen Laughs",
    photoUrl: "assets/images/cooking_kitchen.jpg",
    content: "The aroma of spices and fresh garlic filling our home. You cooking delicious meals for us while our favorite music plays softly, me sneaking behind you to steal a bite from the pan, laughing when flour gets on your nose, and eating dinner together with zero rush.",
    tease: "You cook, I do the dishes, and we dance in the kitchen."
  }
};

// --- BUILD DEDICATED CONSTELLATION CATEGORY POOLS ---
const travelDrmEntries = MARY_SANCTUARY_LEXICON.filter(e => e.id && e.id.startsWith('drm-')).map(e => ({
  id: e.id,
  type: e.type || 'expression',
  category: 'Travel & Shared Dreams',
  tag: e.tag || '✦ Travel & Shared Dreams',
  location: e.location || (
    e.id === 'drm-01' ? 'Siwa Oasis, Egypt' :
    e.id === 'drm-02' ? 'Giza & Cairo, Egypt' :
    e.id === 'drm-03' ? 'Swiss Alps, Switzerland' :
    e.id === 'drm-04' ? 'Bavaria, Germany' :
    e.id === 'drm-05' ? 'London, United Kingdom' :
    e.id === 'drm-06' ? 'Our Sanctuary Kitchen' :
    e.id === 'drm-07' ? 'Our Sanctuary Kitchen' :
    e.id === 'drm-08' ? 'Mary\'s Art Sanctuary' :
    e.id === 'drm-13' ? 'White Desert & Siwa Dunes' : 'Shared Future'
  ),
  title: e.title,
  content: e.content,
  tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Nader'}` : 'A shared milestone together.'
}));

const photoList = Object.values(PHOTO_MEMORIES);

export const CATEGORY_POOLS = {
  // 1. Travel & Shared Dreams: Exactly 24 entries (9 photos + 15 dream visions)
  travel: [...photoList, ...travelDrmEntries],

  // 2. Poems & Wisdom: Poetic verse, Arabic romance, literary classics & philosophy
  poems: MARY_SANCTUARY_LEXICON.filter(e => e.id && (e.id.startsWith('poe-') || e.id.startsWith('lit-') || e.id.startsWith('phi-'))).map(e => ({
    id: e.id,
    type: e.type || 'expression',
    category: e.category || 'Celestial Verse & Poetry',
    tag: e.tag || '✦ Celestial Verse',
    title: e.title,
    content: e.content,
    tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Poetry'}` : 'Words of quiet beauty.'
  })),

  // 3. Advice & Strength: Exactly 60 entries (40 somatic health + 20 resilience/motivation)
  advice: MARY_SANCTUARY_LEXICON.filter(e => e.id && (e.id.startsWith('som-') || e.id.startsWith('mot-'))).map(e => ({
    id: e.id,
    type: 'advice',
    category: e.category || 'Advice & Strength',
    tag: e.tag || '✦ Caring Reminder',
    title: e.title,
    content: e.content,
    tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Nader'}` : 'Care for your body and peace of mind.'
  })),

  // 4. Words From Me: Exactly 165 entries (65 devotion + 45 banter + 40 compliments + 15 science)
  words_from_me: MARY_SANCTUARY_LEXICON.filter(e => e.id && (
    e.id.startsWith('dev-') || e.id.startsWith('ban-') || e.id.startsWith('comp-') || e.id.startsWith('sci-')
  )).map(e => ({
    id: e.id,
    type: e.type || 'expression',
    category: e.category || 'Words From Me',
    tag: e.tag || '✦ Words From Me',
    title: e.title,
    content: e.content,
    tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Nader'}` : 'A personal thought from my heart to yours.'
  }))
};

// 5. All Stars Pool: Complete collection of all 309 items
CATEGORY_POOLS.all = [
  ...CATEGORY_POOLS.travel,
  ...CATEGORY_POOLS.poems,
  ...CATEGORY_POOLS.advice,
  ...CATEGORY_POOLS.words_from_me
];

/**
 * Returns the array of entries for a given filter ID.
 */
export function getCategoryPool(filterId = 'all') {
  return CATEGORY_POOLS[filterId] || CATEGORY_POOLS.all;
}

/**
 * Universal Memory Resolver:
 * Ensures that if an activeFilter is specified, the returned memory card
 * is 100% strictly guaranteed to belong to that category.
 */
export function getMemoryByDotId(dotId, activeFilter = 'all') {
  if (activeFilter && activeFilter !== 'all' && CATEGORY_POOLS[activeFilter]) {
    const pool = CATEGORY_POOLS[activeFilter];
    // If dotId happens to directly match a photo entry in travel
    if (activeFilter === 'travel' && PHOTO_MEMORIES[dotId]) {
      return { ...PHOTO_MEMORIES[dotId], dotId };
    }
    const poolIndex = Math.abs((dotId - 1) % pool.length);
    const item = pool[poolIndex];
    return {
      ...item,
      dotId,
      tag: `${item.tag} • Star #${dotId}`
    };
  }

  // Fallback for All Stars (full galaxy)
  if (PHOTO_MEMORIES[dotId]) {
    return { ...PHOTO_MEMORIES[dotId], dotId };
  }

  const lexiconIndex = Math.abs((dotId - 10) % MARY_SANCTUARY_LEXICON.length);
  const entry = MARY_SANCTUARY_LEXICON[lexiconIndex];

  return {
    id: entry.id,
    dotId,
    type: entry.type || "expression",
    category: entry.category,
    tag: `${entry.tag} • Star #${dotId}`,
    title: entry.title,
    content: entry.content,
    tease: entry.tease ? `"${entry.tease}" • ${entry.author_or_source || 'Nader'}` : `Star #${dotId} unlocked.`
  };
}
