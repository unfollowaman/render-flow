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
 * @param {Object|Array} parsedJson - Chapter object with pages[].items[] OR an array of items.
 * @returns {Array<Object>} Single ordered array of blocks.
 */
export function flattenToBlocks(parsedJson) {
  let items = [];

  if (Array.isArray(parsedJson)) {
    items = parsedJson;
  } else if (parsedJson && Array.isArray(parsedJson.pages)) {
    let itemCounter = 0;
    items = parsedJson.pages.flatMap((page) => {
      if (!page || !Array.isArray(page.items)) return [];
      return page.items.map((item) => {
        itemCounter += 1;
        return {
          ...item,
          id: item.id || `item-${itemCounter}`,
        };
      });
    });
  } else if (parsedJson && Array.isArray(parsedJson.items)) {
    items = parsedJson.items;
  }

  const blocks = [];

  items.forEach((item, idx) => {
    const questionNumber = item.number !== undefined ? item.number : idx + 1;
    const qId = item.id || `q${questionNumber}`;

    // 1. Question Header block
    if (item.question) {
      blocks.push({
        id: `${qId}-header`,
        type: 'question-header',
        questionNumber,
        content: item.question,
        rawItem: item,
      });
    }

    // 2. Solution blocks
    if (Array.isArray(item.solution) && item.solution.length > 0) {
      item.solution.forEach((elem, sIdx) => {
        if (sIdx === 0) {
          blocks.push({
            id: `${qId}-sol-0`,
            type: 'solution-first',
            questionNumber,
            element: elem,
            rawItem: item,
          });
        } else {
          blocks.push({
            id: `${qId}-sol-${sIdx}`,
            type: 'solution-rest',
            questionNumber,
            element: elem,
            rawItem: item,
          });
        }
      });
    }
  });

  return blocks;
}

export default flattenToBlocks;
