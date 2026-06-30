import React, { useState, Profiler } from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App.jsx';

let headerRenderCount = 0;
let appRenderCount = 0;

// Mock the CSS module
const styles = new Proxy({}, { get: (target, prop) => prop });

function measureRenders() {
  // We can just spy on the components by patching them?
}

// Actually we can just run the app and click "Convert",
// and then count how many times App re-renders.
