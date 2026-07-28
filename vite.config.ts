import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/web/test-setup.ts'],
    },
    build: {
        outDir: 'wwwroot/js/dist',
        emptyOutDir: true,
        sourcemap: true,
        cssCodeSplit: false,
        // host.js is ~255KB gzipped and only loaded by the game host (once per
        // session), so the default 500KB warning is noise. See issue #82.
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'src/web/pages/startPage/StartPage.tsx'),
                host: path.resolve(__dirname, 'src/web/pages/hostPage/HostPage.tsx'),
                hostSecondary: path.resolve(__dirname, 'src/web/pages/hostSecondaryPage/HostSecondaryPage.tsx'),
                player: path.resolve(__dirname, 'src/web/pages/playerPage/PlayerPage.tsx'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        },
    },
});
