import fs from "fs";
import path from "path";

const SRC = path.resolve("src");

function walk(dir, list = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, list);
    } else {
      list.push(fullPath);
    }
  }

  return list;
}

function checkImports(file) {
  const content = fs.readFileSync(file, "utf-8");

  const imports = content.match(/from ['"](.*)['"]/g) || [];

  for (const imp of imports) {
    const match = imp.match(/from ['"](.*)['"]/);
    if (!match) continue;

    let importPath = match[1];

    if (
      importPath.startsWith(".") ||
      importPath.startsWith("/")
    ) {
      const resolved = path.resolve(path.dirname(file), importPath);

      const exists =
        fs.existsSync(resolved) ||
        fs.existsSync(resolved + ".js") ||
        fs.existsSync(resolved + ".jsx");

      if (!exists) {
        console.error(`❌ BROKEN IMPORT:
File: ${file}
Missing: ${importPath}\n`);
        process.exit(1);
      }
    }
  }
}

function checkDuplicates(files) {
  const routeFiles = files.filter(f => f.includes("routes"));

  let seen = new Set();

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, "utf-8");

    const routes = content.match(/'\/[a-zA-Z0-9-/]+'/g) || [];

    for (const r of routes) {
      if (seen.has(r)) {
        console.error(`❌ DUPLICATE ROUTE FOUND: ${r}`);
        process.exit(1);
      }
      seen.add(r);
    }
  }
}

function run() {
  console.log("🔍 Running Makenna Pre-Build Checks...\n");

  const files = walk(SRC);

  files.forEach(checkImports);
  checkDuplicates(files);

  console.log("✅ Project SAFE - no critical issues found.");
}

run();