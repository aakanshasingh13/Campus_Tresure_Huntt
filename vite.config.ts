import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      extensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.json',
        '.mjs',
      ],
      alias: [
        {
          find: /^react-native-svg$/,
          replacement: path.resolve(__dirname, 'src/stubs/reactNativeSvgWeb.tsx'),
        },
        {
          find: /.*\/Libraries\/Utilities\/codegenNativeComponent.*/,
          replacement: path.resolve(__dirname, 'src/stubs/codegenNativeComponent.ts'),
        },
        {
          find: /^react-native$/,
          replacement: path.resolve(__dirname, 'src/stubs/reactNativeWrapper.ts'),
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, '.'),
        },
      ],
    },
    define: {
      global: 'window',
      __DEV__: JSON.stringify(true),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
