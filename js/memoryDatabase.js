/**
 * =========================================================================
 * POLYMORPHIC MEMORY DATABASE (4,200 ADDRESSABLE STARS)
 * =========================================================================
 * - Maps every single particle in Mary's 3D beating heart to curated,
 *   authentic thoughts, medical reminders, motivation, and literary wisdom.
 * - Organized into 3 strict constellation pools:
 *   1. Words From Me (Devotion, banter, compliments, biology facts, ten kids inside joke)
 *   2. Poems & Wisdom (Arabic romance, classical verse, philosophy of love)
 *   3. Lessons & Knowledge (Somatic health, resilience, biology & stoic clarity)
 *   plus All Stars full galaxy.
 * - Zero em dashes.
 */

import { MARY_SANCTUARY_LEXICON } from './marySanctuaryLexicon.js?v=338';

// Kept empty for backwards compatibility
export const PHOTO_MEMORIES = {};

export const CATEGORY_POOLS = {
  // 1. Words From Me: Exactly 166 entries (65 devotion + 45 banter + 40 compliments + 15 science + 1 ten kids inside joke)
  words_from_me: MARY_SANCTUARY_LEXICON.filter(e => e.id && (
    e.id.startsWith('dev-') || e.id.startsWith('ban-') || e.id.startsWith('comp-') || e.id.startsWith('sci-') || e.id === 'drm-01'
  )).map(e => ({
    id: e.id,
    type: e.type || 'expression',
    category: e.category || 'Words From Me',
    tag: e.tag || '✦ Words From Me',
    title: e.title,
    content: e.content,
    tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Nader'}` : 'A personal thought from my heart to yours.'
  })),

  // 2. Poems & Wisdom: Exactly 180 entries (105 Arabic poetry + 15 literary classics + 60 philosophy of love)
  poems: MARY_SANCTUARY_LEXICON.filter(e => e.id && (
    e.id.startsWith('poe-') || e.id.startsWith('lit-') || e.id.startsWith('phi-')
  )).map(e => ({
    id: e.id,
    type: e.type || 'expression',
    category: e.category || 'Celestial Verse & Poetry',
    tag: e.tag || '✦ Celestial Verse',
    title: e.title,
    content: e.content,
    tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Poetry'}` : 'Words of quiet beauty.'
  })),

  // 3. Lessons & Knowledge: Exactly 74 entries (40 somatic health + 20 resilience/motivation + 14 biology & stoic lessons)
  advice: MARY_SANCTUARY_LEXICON.filter(e => e.id && (
    e.id.startsWith('som-') || e.id.startsWith('mot-') || (e.id.startsWith('drm-') && e.id !== 'drm-01')
  )).map(e => ({
    id: e.id,
    type: 'advice',
    category: e.category || 'Lessons & Knowledge',
    tag: e.tag || '✦ Caring Reminder',
    title: e.title,
    content: e.content,
    tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Nader'}` : 'Knowledge for your body and peace of mind.'
  })),

  // 4. The Ten Kids: Dedicated inside joke single quotation
  ten_kids: MARY_SANCTUARY_LEXICON.filter(e => e.id === 'drm-01').map(e => ({
    id: e.id,
    type: e.type || 'expression',
    category: e.category || 'Words From Me & Devotion',
    tag: e.tag || '✦ Inside Joke • Ten Kids',
    title: e.title,
    content: e.content,
    tease: e.tease ? `"${e.tease}" • ${e.author_or_source || 'Nader'}` : 'Our promise of ten kids.'
  }))
};

// 5. All Stars Pool: Complete collection of all 420 items
CATEGORY_POOLS.all = [
  ...CATEGORY_POOLS.words_from_me,
  ...CATEGORY_POOLS.poems,
  ...CATEGORY_POOLS.advice
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
    const poolIndex = Math.abs((dotId - 1) % pool.length);
    const item = pool[poolIndex];
    return {
      ...item,
      dotId,
      tag: `${item.tag} • Star #${dotId}`
    };
  }

  // Fallback for All Stars (full galaxy)
  const lexiconIndex = Math.abs((dotId - 1) % MARY_SANCTUARY_LEXICON.length);
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
