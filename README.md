# scoop

A CLI tool to scoop up file contents using glob patterns.

## Installation

```bash
bun install -g github:sam-goodwin/scoop
```

## Usage

Scoop up some files:

```bash
# Basic glob pattern
scoop "src/**/*.ts"

# Multiple patterns
scoop "src/**/*.ts" "lib/**/*.js"

# Exclude patterns with -e flag
scoop "src/**/*" -e "src/**/*.test.ts"

# Multiple excludes
scoop "**/*" -e "node_modules/**/*" -e "dist/**/*"

# Copy to clipboard with -c flag
scoop "src/**/*.ts" -c

# List matching files without contents (--ls or -l)
scoop "src/**/*.ts" --ls
scoop "src/**/*.ts" -l

# Include files that match .gitignore patterns
scoop "**/*" --include-gitignore
```

By default, scoop respects your .gitignore patterns, excluding any files that match. Use the `--include-gitignore` flag to include files that would normally be ignored.

The output includes file paths as comments followed by their contents (unless using --ls/-l):

```ts
// src/utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

// src/main.ts
import { add } from "./utils";
console.log(add(1, 2));
```

All status messages are written to stderr, so you can safely pipe the output:

```bash
# Pipe to a file
scoop "src/**/*.ts" > files.txt

# Pipe to another command
scoop "src/**/*.ts" | grep "function"
```
