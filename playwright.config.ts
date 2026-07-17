import { defineConfig, devices } from "@playwright/test";

const port = 4175;
const deploymentBaseUrl = process.env.DEPLOYMENT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
      testIgnore: [/deployment\.spec\.ts/, /visual\.spec\.ts/],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 1000 } },
      testIgnore: [/deployment\.spec\.ts/, /visual\.spec\.ts/],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 1000 } },
      testIgnore: [/deployment\.spec\.ts/, /visual\.spec\.ts/],
    },
    {
      name: "visual",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
      testMatch: /visual\.spec\.ts/,
    },
    ...(deploymentBaseUrl
      ? [
          {
            name: "deployment",
            use: {
              ...devices["Desktop Chrome"],
              baseURL: deploymentBaseUrl,
              viewport: { width: 1440, height: 1000 },
            },
            testMatch: /deployment\.spec\.ts/,
          },
        ]
      : []),
  ],
  ...(deploymentBaseUrl
    ? {}
    : {
        webServer: {
          command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
          url: `http://127.0.0.1:${port}`,
          reuseExistingServer: false,
          timeout: 60_000,
        },
      }),
});
