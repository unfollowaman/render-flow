/**
 * Validates a Notes Mode JSON object against the Phase 1 schema specification.
 *
 * Extensible design allows future component types to be added to `KNOWN_ITEM_TYPES`
 * and validator registries without refactoring core traversal logic.
 *
 * @param {any} data - Parsed JSON object to validate.
 * @returns {{ valid: boolean, errors: Array<{ path: string, message: string }> }}
 */
export function validateNotesJson(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ path: '', message: 'Root document must be a JSON object' }]
    };
  }

  // 1. Validate chapter object
  if (!data.chapter || typeof data.chapter !== 'object' || Array.isArray(data.chapter)) {
    errors.push({ path: 'chapter', message: 'Field "chapter" must be an object' });
  } else {
    if (typeof data.chapter.title !== 'string') {
      errors.push({ path: 'chapter.title', message: 'Field "chapter.title" is required and must be a string' });
    }
    if (typeof data.chapter.subtitle !== 'string') {
      errors.push({ path: 'chapter.subtitle', message: 'Field "chapter.subtitle" is required and must be a string' });
    }
  }

  // 2. Validate pages array
  if (!Array.isArray(data.pages)) {
    errors.push({ path: 'pages', message: 'Field "pages" is required and must be an array' });
  } else {
    // Empty array (data.pages = []) is accepted as structurally valid per specification
    data.pages.forEach((page, pageIndex) => {
      const pagePath = `pages[${pageIndex}]`;
      if (!page || typeof page !== 'object' || Array.isArray(page)) {
        errors.push({ path: pagePath, message: `Page at index ${pageIndex} must be an object` });
        return;
      }

      const itemsPath = `${pagePath}.items`;
      if (!Array.isArray(page.items)) {
        errors.push({ path: itemsPath, message: `Field "${itemsPath}" must be an array` });
        return;
      }

      page.items.forEach((item, itemIndex) => {
        const itemPath = `${itemsPath}[${itemIndex}]`;
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          errors.push({ path: itemPath, message: `Item at index ${itemIndex} must be an object` });
          return;
        }

        validateItem(item, itemPath, errors);
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Performance Optimization: Module-scoped constant Sets prevent re-allocating Set objects
// on every item and content element during JSON validation.
const KNOWN_ITEM_TYPES = new Set(['question']);
const ALLOWED_TYPES = new Set(['text', 'equation', 'coordinate_graph']);

/**
 * Validates an individual item on a page.
 * Extended in future phases for equation, graph, summary, etc.
 */
function validateItem(item, itemPath, errors) {
  if (typeof item.type !== 'string' || !item.type) {
    errors.push({ path: `${itemPath}.type`, message: 'Field "type" is required and must be a string' });
    return;
  }

  if (!KNOWN_ITEM_TYPES.has(item.type)) {
    errors.push({
      path: `${itemPath}.type`,
      message: `Unrecognized item type: "${item.type}". Implemented Phase 1 types: question.`
    });
    return;
  }

  if (item.type === 'question') {
    validateQuestionItem(item, itemPath, errors);
  }
}

/**
 * Validates a "question" item (Phase 1).
 */
function validateQuestionItem(item, itemPath, errors) {
  if (item.number === undefined || item.number === null || (typeof item.number !== 'number' && typeof item.number !== 'string')) {
    errors.push({ path: `${itemPath}.number`, message: 'Field "number" is required and must be a number or string' });
  }

  // Question content array
  const questionPath = `${itemPath}.question`;
  if (!Array.isArray(item.question)) {
    errors.push({ path: questionPath, message: `Field "${questionPath}" is required and must be an array` });
  } else {
    item.question.forEach((elem, idx) => {
      validateContentElement(elem, `${questionPath}[${idx}]`, errors);
    });
  }

  // Solution content array
  const solutionPath = `${itemPath}.solution`;
  if (!Array.isArray(item.solution)) {
    errors.push({ path: solutionPath, message: `Field "${solutionPath}" is required and must be an array` });
  } else {
    item.solution.forEach((elem, idx) => {
      validateContentElement(elem, `${solutionPath}[${idx}]`, errors);
    });
  }
}

/**
 * Validates inline content elements ("text", "equation", "coordinate_graph").
 */
function validateContentElement(elem, elemPath, errors) {
  if (!elem || typeof elem !== 'object' || Array.isArray(elem)) {
    errors.push({ path: elemPath, message: 'Content element must be an object' });
    return;
  }

  if (typeof elem.type !== 'string' || !ALLOWED_TYPES.has(elem.type)) {
    errors.push({ path: `${elemPath}.type`, message: `Unrecognized content element type: "${elem.type}".` });
    return;
  }

  if (elem.type === 'text') {
    if (typeof elem.content !== 'string') {
      errors.push({ path: `${elemPath}.content`, message: 'Field "content" is required and must be a string' });
    }
  } else if (elem.type === 'equation') {
    if (typeof elem.latex !== 'string') {
      errors.push({ path: `${elemPath}.latex`, message: 'Field "latex" is required and must be a string' });
    }
  } else if (elem.type === 'coordinate_graph') {
    if (elem.points !== undefined) {
      if (!Array.isArray(elem.points)) {
        errors.push({ path: `${elemPath}.points`, message: 'Field "points" must be an array' });
      } else {
        elem.points.forEach((pt, pIdx) => {
          const ptPath = `${elemPath}.points[${pIdx}]`;
          if (!pt || typeof pt !== 'object' || Array.isArray(pt)) {
            errors.push({ path: ptPath, message: 'Point must be an object' });
            return;
          }
          if (typeof pt.x !== 'number') {
            errors.push({ path: `${ptPath}.x`, message: 'Field "x" is required and must be a number' });
          }
          if (typeof pt.y !== 'number') {
            errors.push({ path: `${ptPath}.y`, message: 'Field "y" is required and must be a number' });
          }
          if (pt.label !== undefined && typeof pt.label !== 'string') {
            errors.push({ path: `${ptPath}.label`, message: 'Field "label" must be a string' });
          }
        });
      }
    }

    if (elem.xRange !== undefined) {
      if (!Array.isArray(elem.xRange) || elem.xRange.length !== 2 || typeof elem.xRange[0] !== 'number' || typeof elem.xRange[1] !== 'number') {
        errors.push({ path: `${elemPath}.xRange`, message: 'Field "xRange" must be a 2-element numeric array' });
      }
    }

    if (elem.yRange !== undefined) {
      if (!Array.isArray(elem.yRange) || elem.yRange.length !== 2 || typeof elem.yRange[0] !== 'number' || typeof elem.yRange[1] !== 'number') {
        errors.push({ path: `${elemPath}.yRange`, message: 'Field "yRange" must be a 2-element numeric array' });
      }
    }
  }
}
