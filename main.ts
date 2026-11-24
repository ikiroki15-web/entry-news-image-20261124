import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Entry for make.fun news-image-20261124: copy the pre-rendered
// infographic (entry.png, in this repository) to the output directory,
// byte for byte. Node 22 standard library only; no network, no cwd.

const OUTPUT_DIR_ENV = "MAKEFUN_OUTPUT_DIR";
const BOT_DIR_ENV = "MAKEFUN_BOT_DIR";
const IMAGE_NAME = "entry.png";
const DEFAULT_OUTPUT_DIR = "/output";

function rootsToSearch(): string[] {
  const roots: string[] = [dirname(fileURLToPath(import.meta.url))];
  const botDir = process.env[BOT_DIR_ENV];
  if (botDir !== undefined && botDir !== "") {
    roots.push(botDir);
  }
  return roots;
}

function locateImage(): string {
  for (const root of rootsToSearch()) {
    const candidate = join(root, IMAGE_NAME);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `${IMAGE_NAME} not found beside main.ts or under $${BOT_DIR_ENV}`,
  );
}

function outputDir(): string {
  const given = process.env[OUTPUT_DIR_ENV];
  if (given !== undefined && given !== "") {
    return given;
  }
  return DEFAULT_OUTPUT_DIR;
}

function run(): void {
  const source = locateImage();
  const dir = outputDir();
  mkdirSync(dir, { recursive: true });
  const target = join(dir, IMAGE_NAME);
  copyFileSync(source, target);
  // Guard against a partial copy: the output must hold exactly the
  // source's bytes, so compare sizes after copying.
  const sourceBytes = statSync(source).size;
  const targetBytes = statSync(target).size;
  if (sourceBytes !== targetBytes) {
    throw new Error(
      `copied ${targetBytes} bytes, expected ${sourceBytes} from ${IMAGE_NAME}`,
    );
  }
}

run();
