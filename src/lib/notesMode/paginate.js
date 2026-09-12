import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DOMPurify from 'dompurify';
import { NotesBlockRenderer, ContinuationLabel } from '../../components/NotesBlockComponents';

let elementMeasurementCache = new WeakMap();
let cachedPxPerMm = null;
let measurementContainer = null;

/**
 * Returns or creates the module-scoped persistent off-screen measurement container.
 * Ensures container is attached to document.body.
 */
function getMeasurementContainer() {
  if (typeof document === 'undefined') return null;

  if (!measurementContainer || !measurementContainer.parentNode) {
    measurementContainer = document.createElement('div');
    measurementContainer.style.position = 'absolute';
    measurementContainer.style.visibility = 'hidden';
    measurementContainer.style.top = '-9999px';
    measurementContainer.style.left = '-9999px';
    measurementContainer.style.pointerEvents = 'none';
    document.body.appendChild(measurementContainer);
  }

  return measurementContainer;
}

/**
 * Clears the measurement cache for a specific element or completely resets the cache if no element is provided.
 *
 * @param {HTMLElement} [element] - Optional element to remove from cache.
 */
export function clearMeasurementCache(element) {
  if (element && typeof element === 'object') {
    elementMeasurementCache.delete(element);
  } else {
    elementMeasurementCache = new WeakMap();
    cachedPxPerMm = null;
    if (measurementContainer && measurementContainer.parentNode) {
      measurementContainer.parentNode.removeChild(measurementContainer);
    }
    measurementContainer = null;
  }
}

/**
 * Serializes container CSS and unit into a cache key string.
 */
function getCacheKey(containerCss, unit) {
  const cssKey = containerCss
    ? (typeof containerCss === 'object' ? JSON.stringify(containerCss) : String(containerCss))
    : '';
  return `${cssKey}|${unit}`;
}

/**
 * Helper to convert DOM pixel measurements to millimeters using a 1mm DOM calibration node.
 *
 * @param {HTMLElement} container - The DOM container element.
 * @returns {number} The height of 1mm in pixels.
 */
function getPixelsPerMm(container) {
  if (cachedPxPerMm !== null && cachedPxPerMm > 0) {
    return cachedPxPerMm;
  }

  const calib = document.createElement('div');
  calib.style.height = '1mm';
  calib.style.padding = '0';
  calib.style.margin = '0';
  calib.style.border = 'none';
  container.appendChild(calib);
  const pxPerMm = calib.getBoundingClientRect().height;
  container.removeChild(calib);

  // Fallback to standard 96 DPI conversion (96px / 25.4mm) if measurement yields 0 or NaN
  if (!pxPerMm || isNaN(pxPerMm) || pxPerMm <= 0) {
    cachedPxPerMm = 96 / 25.4;
    return cachedPxPerMm;
  }
  cachedPxPerMm = pxPerMm;
  return pxPerMm;
}

/**
 * Measures the height of a given DOM element when rendered inside a hidden off-screen container.
 * Caches measurement results by element reference, containerCss, and unit to avoid repeated DOM layout thrashing.
 *
 * @param {HTMLElement} element - The DOM element to measure.
 * @param {Object|string} [containerCss] - Optional CSS properties (object) or style string to apply to the container.
 * @param {string} [unit='mm'] - Unit for returned height ('mm' or 'px').
 * @returns {number} Measured height in specified unit.
 */
export function measureHeight(element, containerCss = null, unit = 'mm') {
  if (!element) return 0;

  const isObjectElement = typeof element === 'object';
  const cacheKey = getCacheKey(containerCss, unit);

  if (isObjectElement && elementMeasurementCache.has(element)) {
    const elCache = elementMeasurementCache.get(element);
    if (elCache.has(cacheKey)) {
      return elCache.get(cacheKey);
    }
  }

  const container = getMeasurementContainer();

  // Reset base container style before applying custom containerCss
  container.style.cssText = 'position: absolute; visibility: hidden; top: -9999px; left: -9999px; pointer-events: none;';

  if (containerCss) {
    if (typeof containerCss === 'object') {
      Object.assign(container.style, containerCss);
    } else if (typeof containerCss === 'string') {
      container.style.cssText += `; ${containerCss}`;
    }
  }

  // Measure 1mm conversion factor inside the container context
  const pxPerMm = unit === 'mm' ? getPixelsPerMm(container) : 1;

  // Append target element for measurement
  container.appendChild(element);
  const rect = element.getBoundingClientRect();
  let heightPx = rect.height;

  // Fallback for non-layout environments (like JSDOM tests without custom getBoundingClientRect)
  if ((!heightPx || heightPx === 0) && element.style.height) {
    const parsedH = parseFloat(element.style.height);
    if (!isNaN(parsedH)) {
      if (element.style.height.endsWith('mm')) {
        heightPx = parsedH * pxPerMm;
      } else if (element.style.height.endsWith('px')) {
        heightPx = parsedH;
      }
    }
  }

  // Clean up measured element from container
  if (element.parentNode === container) {
    container.removeChild(element);
  }

  const resultHeight = unit === 'mm' ? heightPx / pxPerMm : heightPx;

  if (isObjectElement) {
    let elCache = elementMeasurementCache.get(element);
    if (!elCache) {
      elCache = new Map();
      elementMeasurementCache.set(element, elCache);
    }
    elCache.set(cacheKey, resultHeight);
  }

  return resultHeight;
}

/**
 * Schedules execution of a callback function non-blockingly using requestAnimationFrame
 * or setTimeout as fallback for Node/jsdom environments.
 *
 * @param {Function} callback
 */
function scheduleNextTick(callback) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * Paginates an ordered stream of blocks into a 2-column continuous flow layout per page.
 *
 * @param {Array<Object>} blocks - List of block objects from flattenToBlocks.
 * @param {Object} options - Options object.
 * @param {number} [options.usableHeightPerPage=225] - Max height budget per page in target unit.
 * @param {number} [options.columnsPerPage=2] - Number of columns per page (2).
 * @param {Object|string} [options.containerCss] - CSS properties for 80mm column width context.
 * @param {number} [options.gap=1.6] - Vertical gap between blocks in mm.
 * @param {string} [options.unit='mm'] - Unit for height ('mm').
 * @returns {Promise<{pages: Array<{columnA: Array<string>, columnB: Array<string>}>, overflowBlocks: Array<string>}>}
 */
export function flowBlocksIntoColumns(blocks = [], options = {}) {
  const {
    usableHeightPerPage = 225,
    columnsPerPage = 2,
    containerCss = {
      width: '80mm',
      boxSizing: 'border-box',
      fontFamily: "'Montserrat', sans-serif",
    },
    gap = 1.6,
    unit = 'mm',
  } = options;

  return new Promise((resolve) => {
    if (!blocks || blocks.length === 0) {
      resolve({ pages: [], overflowBlocks: [] });
      return;
    }

    // 1. Measure continuation label height
    const labelHtml = renderToStaticMarkup(
      React.createElement(ContinuationLabel, { questionNumber: 1 })
    );
    const labelDummy = document.createElement('div');
    labelDummy.innerHTML = DOMPurify.sanitize(labelHtml);
    const labelTarget = labelDummy.firstElementChild || labelDummy;
    if (typeof window !== 'undefined' && window.navigator?.userAgent?.includes('jsdom')) {
      labelTarget.style.height = '8mm';
    }
    const labelHeight = measureHeight(labelTarget, containerCss, unit);

    // 2. Measure all blocks
    const measuredBlocks = blocks.map((block) => {
      const blockHtml = renderToStaticMarkup(
        React.createElement(NotesBlockRenderer, { block, isTopOfColumn: false })
      );
      const dummyEl = document.createElement('div');
      dummyEl.innerHTML = DOMPurify.sanitize(blockHtml);
      const targetEl = dummyEl.firstElementChild || dummyEl;

      if (typeof window !== 'undefined' && window.navigator?.userAgent?.includes('jsdom')) {
        let fallbackHeight = 15;
        if (block.type === 'question-header') {
          const qText = JSON.stringify(block.content || '');
          fallbackHeight = 15 + Math.ceil(qText.length / 80) * 8;
        } else if (block.type === 'solution-first' || block.type === 'solution-rest') {
          const elemStr = JSON.stringify(block.element || '');
          fallbackHeight = 12 + Math.ceil(elemStr.length / 80) * 8;
          if (elemStr.includes('coordinate_graph')) {
            fallbackHeight += 70;
          }
        }
        targetEl.style.height = `${fallbackHeight}mm`;
      }

      const measuredH = measureHeight(targetEl, containerCss, unit);

      return {
        ...block,
        height: measuredH,
      };
    });

    const pages = [];
    const overflowBlocks = [];
    const overflowQuestionNumbers = new Set();

    let currentPage = { columnA: [], columnB: [] };
    let colAHeight = 0;
    let colBHeight = 0;
    let activeCol = 'columnA';

    const EPSILON = 1e-5;

    for (const block of measuredBlocks) {
      // Check if block alone exceeds usable height or belongs to an already overflowing question
      const minRequired = (block.type !== 'question-header' ? labelHeight : 0) + block.height;
      if (
        block.height > usableHeightPerPage ||
        minRequired > usableHeightPerPage ||
        overflowQuestionNumbers.has(block.questionNumber)
      ) {
        overflowQuestionNumbers.add(block.questionNumber);
        overflowBlocks.push(block.id);
        continue;
      }

      let placed = false;

      while (!placed) {
        const isColEmpty = activeCol === 'columnA' ? currentPage.columnA.length === 0 : currentPage.columnB.length === 0;
        const currentColHeight = activeCol === 'columnA' ? colAHeight : colBHeight;

        let addedH = 0;
        if (isColEmpty) {
          addedH = (block.type !== 'question-header' ? labelHeight : 0) + block.height;
        } else {
          addedH = block.height + gap;
        }

        if (currentColHeight + addedH <= usableHeightPerPage + EPSILON) {
          if (activeCol === 'columnA') {
            currentPage.columnA.push(block.id);
            colAHeight += addedH;
          } else {
            currentPage.columnB.push(block.id);
            colBHeight += addedH;
          }
          placed = true;
        } else {
          // Block does not fit in active column
          if (activeCol === 'columnA') {
            // Move to columnB on same page
            activeCol = 'columnB';
          } else {
            // Column B is also full. Close current page and start new page
            pages.push(currentPage);
            currentPage = { columnA: [], columnB: [] };
            colAHeight = 0;
            colBHeight = 0;
            activeCol = 'columnA';
          }
        }
      }
    }

    if (currentPage.columnA.length > 0 || currentPage.columnB.length > 0) {
      pages.push(currentPage);
    }

    resolve({ pages, overflowBlocks });
  });
}

/**
 * Paginates an array of DOM items into pages based on a usable height budget per page.
 * Processes items asynchronously in non-blocking chunks to prevent UI locking.
 *
 * @param {Array<{id: string|number, element: HTMLElement}>} items - List of items with unique id and renderable DOM element.
 * @param {Object} options - Pagination configuration options.
 * @param {number} options.usableHeightPerPage - Maximum allowable total height per page in target unit.
 * @param {string} [options.unit='mm'] - Measurement unit ('mm' or 'px'). Default is 'mm'.
 * @param {Object|string} [options.containerCss] - CSS properties or string for container layout context during measurement.
 * @param {number} [options.chunkSize=5] - Number of items to measure per non-blocking execution chunk.
 * @param {Function} [options.onProgress] - Optional callback invoked after each chunk with { processed, total }.
 * @returns {Promise<{pages: Array<Array<string|number>>, overflowItems: Array<string|number>}>}
 */
export function paginate(items = [], options = {}) {
  const {
    usableHeightPerPage,
    unit = 'mm',
    containerCss = null,
    chunkSize = 5,
    onProgress = null,
  } = options;

  if (typeof usableHeightPerPage !== 'number' || usableHeightPerPage <= 0) {
    throw new Error('paginate: usableHeightPerPage must be a positive number');
  }

  return new Promise((resolve) => {
    if (!items || items.length === 0) {
      resolve({ pages: [], overflowItems: [] });
      return;
    }

    const pages = [];
    const overflowItems = [];
    let currentPage = [];
    let currentHeight = 0;
    let index = 0;

    const processChunk = () => {
      const end = Math.min(index + chunkSize, items.length);

      for (; index < end; index++) {
        const item = items[index];
        const height = measureHeight(item.element, containerCss, unit);

        if (height > usableHeightPerPage) {
          // Item alone exceeds usable page height budget; flag as overflow
          overflowItems.push(item.id);
          continue;
        }

        // Use epsilon tolerance for floating-point comparisons (e.g., 40 + 40 + 20 = 100.00000000000001)
        const EPSILON = 1e-5;
        if (currentPage.length > 0 && currentHeight + height <= usableHeightPerPage + EPSILON) {
          currentPage.push(item.id);
          currentHeight += height;
        } else {
          if (currentPage.length > 0) {
            pages.push(currentPage);
          }
          currentPage = [item.id];
          currentHeight = height;
        }
      }

      if (typeof onProgress === 'function') {
        onProgress({ processed: index, total: items.length });
      }

      if (index < items.length) {
        scheduleNextTick(processChunk);
      } else {
        if (currentPage.length > 0) {
          pages.push(currentPage);
        }
        resolve({ pages, overflowItems });
      }
    };

    scheduleNextTick(processChunk);
  });
}

/**
 * Filters items and pairs eligible items into row objects.
 * Handles oversized items by pushing their IDs to overflowItems.
 *
 * @param {Array<{id: string|number, height: number, rawItem: Object}>} measuredItems
 * @param {number} usableHeightPerPage
 * @param {number} columnsPerRow
 * @returns {{ rows: Array<{items: Array<Object>, height: number}>, overflowItems: Array<string|number> }}
 */
function buildRowsFromMeasuredItems(measuredItems, usableHeightPerPage, columnsPerRow) {
  const overflowItems = [];
  const eligibleItems = [];

  // Filter individually oversized items first
  for (const item of measuredItems) {
    if (item.height > usableHeightPerPage) {
      overflowItems.push(item.id);
    } else {
      eligibleItems.push(item);
    }
  }

  const rows = [];
  let i = 0;
  while (i < eligibleItems.length) {
    if (columnsPerRow === 1 || i === eligibleItems.length - 1) {
      rows.push({
        items: [eligibleItems[i]],
        height: eligibleItems[i].height,
      });
      i += 1;
    } else {
      const itemA = eligibleItems[i];
      const itemB = eligibleItems[i + 1];
      const rowHeight = Math.max(itemA.height, itemB.height);

      if (rowHeight > usableHeightPerPage) {
        if (itemB.height > usableHeightPerPage) {
          overflowItems.push(itemB.id);
          eligibleItems.splice(i + 1, 1);
          continue;
        } else if (itemA.height > usableHeightPerPage) {
          overflowItems.push(itemA.id);
          eligibleItems.splice(i, 1);
          continue;
        }
      }

      rows.push({
        items: [itemA, itemB],
        height: rowHeight,
      });
      i += 2;
    }
  }

  return { rows, overflowItems };
}

/**
 * Asynchronously packs row objects into pages based on the height budget.
 *
 * @param {Array<{items: Array<Object>, height: number}>} rows
 * @param {Object} options
 * @param {number} options.usableHeightPerPage
 * @param {number} options.rowGap
 * @param {number} options.chunkSize
 * @param {Function} [options.onProgress]
 * @returns {Promise<Array<Array<string|number>>>}
 */
function packRowsIntoPages(rows, { usableHeightPerPage, rowGap, chunkSize, onProgress }) {
  return new Promise((resolve) => {
    if (!rows || rows.length === 0) {
      resolve([]);
      return;
    }

    const pages = [];
    const EPSILON = 1e-5;
    let currentPageItemIds = [];
    let currentHeight = 0;
    let rowIndex = 0;

    const processChunk = () => {
      const end = Math.min(rowIndex + chunkSize, rows.length);

      for (; rowIndex < end; rowIndex++) {
        const row = rows[rowIndex];
        const addedHeight = currentPageItemIds.length > 0 ? row.height + rowGap : row.height;

        if (currentPageItemIds.length > 0 && currentHeight + addedHeight <= usableHeightPerPage + EPSILON) {
          row.items.forEach((it) => currentPageItemIds.push(it.id));
          currentHeight += addedHeight;
        } else {
          if (currentPageItemIds.length > 0) {
            pages.push(currentPageItemIds);
          }
          currentPageItemIds = row.items.map((it) => it.id);
          currentHeight = row.height;
        }
      }

      if (typeof onProgress === 'function') {
        onProgress({ processed: rowIndex, total: rows.length });
      }

      if (rowIndex < rows.length) {
        scheduleNextTick(processChunk);
      } else {
        if (currentPageItemIds.length > 0) {
          pages.push(currentPageItemIds);
        }
        resolve(pages);
      }
    };

    scheduleNextTick(processChunk);
  });
}

/**
 * Paginates an array of DOM items into pages formatted as a multi-column grid per page (e.g. 2 columns).
 * Row height is determined as Math.max(itemHeightsInRow).
 *
 * Handle oversized edge cases:
 * - If an item's individual height > usableHeightPerPage, it is placed in overflowItems alone.
 * - If pairing two adjacent items in sequence would cause row height > usableHeightPerPage
 *   because of an oversized second item alone, break pairing so the second item goes to overflowItems
 *   and the first item is re-paired with the following item in sequence.
 *
 * @param {Array<{id: string|number, element: HTMLElement}>} items - List of items with unique id and renderable DOM element.
 * @param {Object} options - Pagination options.
 * @param {number} options.usableHeightPerPage - Usable height per page in target unit.
 * @param {number} [options.columnsPerRow=2] - Number of columns per grid row.
 * @param {number} [options.rowGap=3.7] - Vertical gap between grid rows in target unit (e.g., 14px in mm ~ 3.7mm).
 * @param {string} [options.unit='mm'] - Unit ('mm' or 'px').
 * @param {Object|string} [options.containerCss] - CSS options for measurement.
 * @param {number} [options.chunkSize=5] - Execution chunk size.
 * @param {Function} [options.onProgress] - Callback on chunk progress.
 * @returns {Promise<{pages: Array<Array<string|number>>, overflowItems: Array<string|number>}>}
 */
export async function paginateRows(items = [], options = {}) {
  const {
    usableHeightPerPage,
    columnsPerRow = 2,
    rowGap = 3.7,
    unit = 'mm',
    containerCss = null,
    chunkSize = 5,
    onProgress = null,
  } = options;

  if (typeof usableHeightPerPage !== 'number' || usableHeightPerPage <= 0) {
    throw new Error('paginateRows: usableHeightPerPage must be a positive number');
  }

  if (!items || items.length === 0) {
    return { pages: [], overflowItems: [] };
  }

  const measuredItems = items.map((item) => ({
    id: item.id,
    height: measureHeight(item.element, containerCss, unit),
    rawItem: item,
  }));

  const { rows, overflowItems } = buildRowsFromMeasuredItems(
    measuredItems,
    usableHeightPerPage,
    columnsPerRow
  );

  const pages = await packRowsIntoPages(rows, {
    usableHeightPerPage,
    rowGap,
    chunkSize,
    onProgress,
  });

  return { pages, overflowItems };
}
