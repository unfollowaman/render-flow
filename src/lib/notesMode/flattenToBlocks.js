/**
 * Transforms parsed chapter JSON (or flattened item array) into a single ordered array of blocks
 * for continuous column-flow pagination.
 *
 * Block Types:
 * - 'question-header': { id, type: 'question-header', questionNumber, content: item.question }
 * - 'solution-first':  { id, type: 'solution-first', questionNumber, element: item.solution[0] }
 * - 'solution-rest':   { id, type: 'solution-rest', questionNumber, element: item.solution[i] }
 *
 * Blocks appear in document order, all blocks for question N before question N+1.
 *
 * OPTIMIZATION: Uses single-pass array traversal with standard for-loops to eliminate
 * intermediate `flatMap`/`map` array allocations and unnecessary object copying when item.id is set.
 *
 * @param {Object|Array} parsedJson - Chapter object with pages[].items[] OR an array of items.
 * @returns {Array<Object>} Single ordered array of blocks.
 */
export function flattenToBlocks(parsedJson) {
  const blocks = [];
  if (!parsedJson) return blocks;

  let isPagesStructure = false;
  let itemsArray = null;

  if (Array.isArray(parsedJson)) {
    itemsArray = parsedJson;
  } else if (Array.isArray(parsedJson.pages)) {
    isPagesStructure = true;
  } else if (Array.isArray(parsedJson.items)) {
    itemsArray = parsedJson.items;
  }

  let itemCounter = 0;
  let globalIdx = 0;

  const processItem = (item) => {
    if (!item) return;

    itemCounter += 1;
    globalIdx += 1;

    const questionNumber = item.number !== undefined ? item.number : globalIdx;
    const qId = item.id || (isPagesStructure ? `item-${itemCounter}` : `q${questionNumber}`);

    // Preserve item reference; avoid object copy unless id was missing in pages structure
    const rawItem = (!item.id && isPagesStructure) ? { ...item, id: qId } : item;

    // 1. Question Header block
    if (item.question) {
      blocks.push({
        id: `${qId}-header`,
        type: 'question-header',
        questionNumber,
        content: item.question,
        rawItem,
      });
    }

    // 2. Solution blocks
    const solution = item.solution;
    if (Array.isArray(solution) && solution.length > 0) {
      for (let sIdx = 0; sIdx < solution.length; sIdx++) {
        blocks.push({
          id: `${qId}-sol-${sIdx}`,
          type: sIdx === 0 ? 'solution-first' : 'solution-rest',
          questionNumber,
          element: solution[sIdx],
          rawItem,
        });
      }
    }
  };

  if (itemsArray) {
    for (let i = 0; i < itemsArray.length; i++) {
      processItem(itemsArray[i]);
    }
  } else if (isPagesStructure) {
    const pages = parsedJson.pages;
    for (let p = 0; p < pages.length; p++) {
      const page = pages[p];
      if (page && Array.isArray(page.items)) {
        const pageItems = page.items;
        for (let i = 0; i < pageItems.length; i++) {
          processItem(pageItems[i]);
        }
      }
    }
  }

  return blocks;
}

export default flattenToBlocks;
