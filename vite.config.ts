import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';

// Recursively copy a directory
function copyDirRecursive(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Plugin to copy and patch manifest + icons into dist
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    writeBundle() {
      // Copy and patch manifest.json — fix side_panel path
      const manifest = JSON.parse(
        readFileSync(resolve(__dirname, 'manifest.json'), 'utf-8')
      );
      manifest.side_panel.default_path = 'src/sidepanel/index.html';
      writeFileSync(
        resolve(__dirname, 'dist/manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Copy icons
      const iconsDir = resolve(__dirname, 'public/icons');
      const distIconsDir = resolve(__dirname, 'dist/icons');
      try {
        mkdirSync(distIconsDir, { recursive: true });
        for (const file of readdirSync(iconsDir)) {
          if (file.endsWith('.png')) {
            copyFileSync(resolve(iconsDir, file), resolve(distIconsDir, file));
          }
        }
      } catch {
        // Icons dir may not exist yet
      }

      // Copy _locales directory for i18n
      const localesDir = resolve(__dirname, '_locales');
      try {
        copyDirRecursive(localesDir, resolve(__dirname, 'dist/_locales'));
      } catch {
        // _locales dir may not exist yet
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyExtensionFiles()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@background': resolve(__dirname, 'src/background'),
      '@sidepanel': resolve(__dirname, 'src/sidepanel'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
