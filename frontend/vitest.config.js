import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./src/tests/setup.js"],
        include: ["src/tests/**/*.test.{js,jsx}"],
        exclude: [
            "**/playwright.config.js",
            "**/vite.config.js",
            "**/vitest.config.js",
            "**/dist/**",
        ],
        clearMocks: true,
        coverage: {
            include: ["src/**/*.{js,jsx}"],
            thresholds: { functions: 85 },
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                "**/playwright.config.js",
                "**/vite.config.js",
                "**/vitest.config.js",
                "**/dist/**",
                "**/e2e/**",
            ],
        },
    },
});
