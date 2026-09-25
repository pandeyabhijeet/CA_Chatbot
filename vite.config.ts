import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/CA_Chatbot/',
  plugins: [react()],
  test: {
    clearMocks: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
