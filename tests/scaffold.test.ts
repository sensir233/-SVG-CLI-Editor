import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AppInfo } from "../src/AppInfo.js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

describe("Phase 1 project scaffold", () => {
  it("provides the required npm entry points", () => {
    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.build).toBe("tsc -p tsconfig.build.json");
    expect(packageJson.scripts?.cli).toBe("tsx src/main.ts");
    expect(packageJson.scripts?.test).toBe("vitest run");
  });

  it("establishes the planned dependency-layer directories", () => {
    const plannedDirectories = [
      "src/domain/shapes",
      "src/application/commands",
      "src/svg",
      "src/cli"
    ];

    for (const directory of plannedDirectories) {
      expect(existsSync(join(projectRoot, directory)), directory).toBe(true);
    }
  });

  it("identifies the application without claiming feature completion", () => {
    const appInfo = new AppInfo();

    expect(appInfo.banner).toBe("svg-editor 0.1");
  });
});
