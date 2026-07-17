import { expect, test as base } from "@playwright/test";

export const test = base.extend<{ browserErrorGuard: undefined }>({
  browserErrorGuard: [
    async ({ page }, use) => {
      const browserErrors: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

      await use(undefined);

      expect(browserErrors, "browser console and page errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
export type { Page } from "@playwright/test";
