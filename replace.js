const fs = require('fs');
const path = require('path');

const files = [
  'vite.config.js',
  'package.json',
  'package-lock.json',
  'README.md',
  'src/components/Header.jsx',
  'src/styles/Home.module.css',
  'src/App.test.jsx',
  'index.html',
  'src/components/Hero.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/html2png/g, 'render-flow');
  content = content.replace(/HTML2PNG/g, 'Render Flow');
  content = content.replace(/HTML to PNG Converter/g, 'Render Flow');
  content = content.replace(/HTML to PNG/g, 'Render Flow');
  fs.writeFileSync(file, content);
}
console.log('Replaced in files');
