const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1920px;
      height: 1080px;
      background-color: #f0f0f0;
    }
    .container {
      width: 800px;
      height: 600px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
  </div>
</body>
</html>
`;

function extractDimensionsOriginal(html) {
  const bodyWidthMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}width:\s*(\d+)px/i)
  const bodyHeightMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}height:\s*(\d+)px/i)
  const widthMatch = html.match(/width:\s*(\d+)px/i)
  const heightMatch = html.match(/height:\s*(\d+)px/i)

  let width = parseInt(bodyWidthMatch?.[1] ?? widthMatch?.[1] ?? '1200', 10)
  let height = parseInt(bodyHeightMatch?.[1] ?? heightMatch?.[1] ?? '630', 10)

  width = Math.min(Math.max(width, 100), 3840)
  height = Math.min(Math.max(height, 100), 2160)

  return { width, height }
}

const BODY_WIDTH_REGEX = /(?:body|html)[^{]{0,4096}\{[^}]{0,4096}width:\s*(\d+)px/i;
const BODY_HEIGHT_REGEX = /(?:body|html)[^{]{0,4096}\{[^}]{0,4096}height:\s*(\d+)px/i;
const WIDTH_REGEX = /width:\s*(\d+)px/i;
const HEIGHT_REGEX = /height:\s*(\d+)px/i;

function extractDimensionsOptimized(html) {
  const bodyWidthMatch = html.match(BODY_WIDTH_REGEX)
  const bodyHeightMatch = html.match(BODY_HEIGHT_REGEX)
  const widthMatch = html.match(WIDTH_REGEX)
  const heightMatch = html.match(HEIGHT_REGEX)

  let width = parseInt(bodyWidthMatch?.[1] ?? widthMatch?.[1] ?? '1200', 10)
  let height = parseInt(bodyHeightMatch?.[1] ?? heightMatch?.[1] ?? '630', 10)

  width = Math.min(Math.max(width, 100), 3840)
  height = Math.min(Math.max(height, 100), 2160)

  return { width, height }
}

const iterations = 100000;

console.time('Original');
for (let i = 0; i < iterations; i++) {
  extractDimensionsOriginal(html);
}
console.timeEnd('Original');

console.time('Optimized');
for (let i = 0; i < iterations; i++) {
  extractDimensionsOptimized(html);
}
console.timeEnd('Optimized');
