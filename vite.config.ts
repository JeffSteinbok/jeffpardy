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
