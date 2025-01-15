import { spawn } from "bun";
import { describe, expect, test } from "bun:test";

async function runScoop(
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  const proc = spawn(["bun", "index.ts", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: import.meta.dir + "/..",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;

  return { stdout, stderr };
}

describe("scoop", () => {
  describe("up command", () => {
    test("should glob TypeScript files", async () => {
      const { stdout } = await runScoop(["up", "test/fixtures/src/**/*.ts"]);

      expect(stdout).toContain("// test/fixtures/src/main.ts");
      expect(stdout).toContain("export function add");
      expect(stdout).toContain("// test/fixtures/src/utils.ts");
      expect(stdout).toContain("export function capitalize");
    });

    test("should work without explicit up command", async () => {
      const { stdout } = await runScoop(["test/fixtures/src/**/*.ts"]);

      expect(stdout).toContain("// test/fixtures/src/main.ts");
      expect(stdout).toContain("export function add");
      expect(stdout).toContain("// test/fixtures/src/utils.ts");
      expect(stdout).toContain("export function capitalize");
    });

    test("should exclude files", async () => {
      const { stdout } = await runScoop([
        "up",
        "test/fixtures/**/*.*",
        "-e",
        "test/fixtures/docs/**/*",
      ]);

      expect(stdout).toContain("// test/fixtures/src/main.ts");
      expect(stdout).toContain("// test/fixtures/src/utils.ts");
      expect(stdout).toContain("// test/fixtures/lib/helpers.js");
      expect(stdout).not.toContain("# Test Project");
    });

    test("should handle multiple glob patterns", async () => {
      const { stdout } = await runScoop([
        "up",
        "test/fixtures/src/*.ts",
        "test/fixtures/lib/*.js",
      ]);

      expect(stdout).toContain("// test/fixtures/src/main.ts");
      expect(stdout).toContain("// test/fixtures/src/utils.ts");
      expect(stdout).toContain("// test/fixtures/lib/helpers.js");
    });

    test("should handle multiple exclude patterns", async () => {
      const { stdout } = await runScoop([
        "up",
        "test/fixtures/**/*.*",
        "-e",
        "test/fixtures/docs/**/*",
        "-e",
        "test/fixtures/lib/**/*",
      ]);

      expect(stdout).toContain("// test/fixtures/src/main.ts");
      expect(stdout).toContain("// test/fixtures/src/utils.ts");
      expect(stdout).not.toContain("helpers.js");
      expect(stdout).not.toContain("README.md");
    });
  });

  describe("ls command", () => {
    test("should list files without contents", async () => {
      const { stdout } = await runScoop(["ls", "test/fixtures/src/**/*.ts"]);

      expect(stdout.trim()).toBe(
        "test/fixtures/src/main.ts\ntest/fixtures/src/utils.ts",
      );
      expect(stdout).not.toContain("export function");
    });

    test("should list files with multiple patterns", async () => {
      const { stdout } = await runScoop([
        "ls",
        "test/fixtures/src/*.ts",
        "test/fixtures/lib/*.js",
      ]);

      const files = stdout.split("\n");
      expect(files).toContain("test/fixtures/src/main.ts");
      expect(files).toContain("test/fixtures/src/utils.ts");
      expect(files).toContain("test/fixtures/lib/helpers.js");
      expect(stdout).not.toContain("export function");
    });

    test("should respect exclude patterns", async () => {
      const { stdout } = await runScoop([
        "ls",
        "test/fixtures/**/*.*",
        "-e",
        "test/fixtures/docs/**/*",
      ]);

      const files = stdout.split("\n");
      expect(files).toContain("test/fixtures/src/main.ts");
      expect(files).toContain("test/fixtures/src/utils.ts");
      expect(files).toContain("test/fixtures/lib/helpers.js");
      expect(files).not.toContain("test/fixtures/docs/README.md");
    });
  });

  test("should error when no files found", async () => {
    const { stderr } = await runScoop(["test/fixtures/nonexistent/**/*"]);
    expect(stderr).toContain("No files found matching the provided patterns");
  });
});
