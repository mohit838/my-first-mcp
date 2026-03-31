import fs from "fs/promises";
import path from "path";
import { BASE_DIR, SKIP_DIRS } from "../config.js";

export function resolveSafePath(inputPath: string) {
  const resolvedPath = path.resolve(BASE_DIR, inputPath);

  if (!resolvedPath.startsWith(BASE_DIR)) {
    throw new Error("Access denied: outside base directory");
  }

  return resolvedPath;
}

export async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const nestedFiles = await getAllFiles(fullPath);
      files.push(...nestedFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}
