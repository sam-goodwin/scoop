#!/usr/bin/env bun

import { Glob } from "bun";
import { parseArgs } from "util";

// Get the subcommand (first argument)
const subcommand =
  Bun.argv[2] === "ls" || Bun.argv[2] === "up" ? Bun.argv[2] : "up";
const args = subcommand === Bun.argv[2] ? Bun.argv.slice(3) : Bun.argv.slice(2);

const { values, positionals } = parseArgs({
  args,
  options: {
    clipboard: { type: "boolean", short: "c" },
    exclude: { type: "string", short: "e", multiple: true },
    includeGitignore: {
      type: "boolean",
      description: "Include files that match .gitignore patterns",
    },
  },
  allowPositionals: true,
});

if (positionals.length === 0) {
  console.error("Error: At least one glob pattern is required");
  console.error(
    "Usage: scoop [up|ls] <glob-pattern...> [-e exclude-pattern...] [-c] [--include-gitignore]",
  );
  process.exit(1);
}

try {
  const excludePatterns = values.exclude ?? [];
  const gitignorePatterns = values.includeGitignore
    ? []
    : await readGitignorePatterns();
  const files = await glob(positionals);
  const excludedFiles = excludePatterns.length
    ? await glob(excludePatterns)
    : [];
  const filteredFiles = files.filter(
    (file: string) =>
      !excludedFiles.includes(file) && !isIgnored(file, gitignorePatterns),
  );

  if (filteredFiles.length === 0) {
    console.error("No files found matching the provided patterns");
    process.exit(1);
  }

  if (subcommand === "ls") {
    const output = filteredFiles.join("\n");
    if (values.clipboard) {
      const proc = Bun.spawn(["pbcopy"], {
        stdin: "pipe",
      });
      proc.stdin.write(output);
      await proc.stdin.end();
      await proc.exited;
    } else {
      console.log(output);
    }
    process.exit(0);
  }

  // "up" subcommand (default)
  const result = await Promise.all(
    filteredFiles.map(async (file: string) => {
      const content = await Bun.file(file).text();
      return `// ${file}\n${content}`;
    }),
  );

  const output = result.join("\n\n");

  if (values.clipboard) {
    const proc = Bun.spawn(["pbcopy"], {
      stdin: "pipe",
    });
    proc.stdin.write(output);
    await proc.stdin.end();
    await proc.exited;
  } else {
    console.log(output);
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}

async function glob(patterns: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const pattern of patterns) {
    const globber = new Glob(pattern);
    for await (const file of globber.scan(".")) {
      results.push(file);
    }
  }
  return results;
}

async function readGitignorePatterns(): Promise<string[]> {
  try {
    const content = await Bun.file(".gitignore").text();
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch {
    return [];
  }
}

function isIgnored(file: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Convert glob pattern to regex
    const regex = new RegExp(
      "^" +
        pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".") +
        "$",
    );
    return regex.test(file);
  });
}
