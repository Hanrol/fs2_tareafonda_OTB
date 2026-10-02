import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    workers: 1,
    timeout: 30000,
    use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
    webServer: [
        {
            command: "mvnw.cmd spring-boot:run -Dspring-boot.run.arguments=--server.port=8081",
            cwd: "../backend",
            url: "http://localhost:8081/api/bebidas",
            timeout: 120000,
            reuseExistingServer: false,
        },
        {
            command: "npm run dev -- --host 127.0.0.1",
            env: { VITE_API_URL: "http://localhost:8081/api" },
            url: "http://localhost:5173",
            timeout: 60000,
            reuseExistingServer: false,
        },
    ],
});
