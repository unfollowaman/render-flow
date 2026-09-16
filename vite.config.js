import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

function inlineCssPlugin() {
  return {
    name: 'inline-css-plugin',
    enforce: 'post',
    generateBundle(options, bundle) {
      let cssKey = null;

      for (const [key] of Object.entries(bundle)) {
        if (key.startsWith('assets/index-') && key.endsWith('.css')) cssKey = key;
      }

      if (cssKey) {
        const cssFile = bundle[cssKey];
        const cssContent = cssFile.source;
        const cssFileName = cssKey.split('/').pop();
        const escapedFileName = cssFileName.replace('.', '\\.');
        const linkRegex = new RegExp('<link[^>]*href=["\'][^"\']*' + escapedFileName + '["\'][^>]*>', 'g');

        for (const [key, file] of Object.entries(bundle)) {
          if (key.endsWith('.html')) {
            file.source = file.source.replace(
              linkRegex,
              `<style>${cssContent}</style>`
            );
          }
        }

        delete bundle[cssKey];
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), inlineCssPlugin()],
  base: '/render-flow/', // GitHub Pages repo name — adjust if repo name differs
  build: {
    chunkSizeWarningLimit: 3000,
    modulePreload: {
      resolveDependencies(filename, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes('vendor-katex') &&
            !dep.includes('vendor-mermaid') &&
            !dep.includes('vendor-html-to-image')
        );
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('node_modules/mermaid') ||
              id.includes('node_modules/@mermaid-js')
            ) {
              return 'vendor-mermaid';
            }
            if (id.includes('node_modules/katex')) {
              return 'vendor-katex';
            }
            if (id.includes('node_modules/html-to-image')) {
              return 'vendor-html-to-image';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
