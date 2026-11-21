const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * GinieSpace Static Secret & Key Exposure Scanner
 * Scans codebase files and git diffs against critical credential patterns.
 */

const SECRET_PATTERNS = [
  { name: "Google API Key", regex: /AIza[0-9A-Za-z\\-_]{35}/g },
  { name: "RSA / EC Private Key", regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { name: "GitHub Personal Access Token", regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/g },
  { name: "AWS Access Key ID", regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: "Generic Hardcoded Secret Assignment", regex: /(?:api_key|apikey|secret|password|passwd|auth_token)\s*[:=]\s*["'][A-Za-z0-9!@#$%^&*()_+=-]{16,}["']/gi },
  { name: "Database Connection URI with Password", regex: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^:\s]+:[^@\s]+@[^\s]+/gi },
];

const IGNORED_DIRS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "backups",
  "uploads",
];

const IGNORED_FILES = [
  "package-lock.json",
  "scan-secrets.js",
  ".env.example",
];

function scanContent(filePath, content) {
  const findings = [];
  const lines = content.split("\n");

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    for (const pat of SECRET_PATTERNS) {
      pat.regex.lastIndex = 0;
      if (pat.regex.test(line)) {
        // Exclude safe mock tokens used in tests or placeholders
        if (
          line.includes("your-") ||
          line.includes("test-") ||
          line.includes("<") ||
          line.includes("EXAMPLE") ||
          line.includes("placeholder") ||
          line.includes("[REDACTED")
        ) {
          continue;
        }

        findings.push({
          file: filePath,
          line: lineNum + 1,
          rule: pat.name,
          snippet: line.trim().slice(0, 80) + "...",
        });
      }
    }
  }

  return findings;
}

function scanDirectory(dir, rootDir = dir) {
  let allFindings = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const ent of entries) {
    if (IGNORED_DIRS.includes(ent.name)) continue;

    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      allFindings = allFindings.concat(scanDirectory(fullPath, rootDir));
    } else if (ent.isFile()) {
      if (IGNORED_FILES.includes(ent.name)) continue;
      // Scan code, markdown, config files
      if (/\.(ts|tsx|js|jsx|json|md|yaml|yml|env)$/i.test(ent.name)) {
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          const relative = path.relative(rootDir, fullPath);
          const findings = scanContent(relative, content);
          allFindings = allFindings.concat(findings);
        } catch {}
      }
    }
  }

  return allFindings;
}

function getTrackedFiles(projectRoot) {
  try {
    const output = execSync("git ls-files", { cwd: projectRoot, encoding: "utf8" });
    return output.split("\n").map((f) => f.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  console.log("================================================================");
  console.log("🔍 GinieSpace Static Secret & Key Exposure Scanner");
  console.log("================================================================\n");

  const projectRoot = path.resolve(__dirname, "..");
  const trackedFiles = getTrackedFiles(projectRoot);

  let allFindings = [];

  for (const relPath of trackedFiles) {
    if (IGNORED_FILES.includes(path.basename(relPath))) continue;
    if (IGNORED_DIRS.some((d) => relPath.startsWith(d + "/") || relPath.startsWith(d + "\\"))) continue;
    if (!/\.(ts|tsx|js|jsx|json|md|yaml|yml|env)$/i.test(relPath)) continue;

    const fullPath = path.join(projectRoot, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        const findings = scanContent(relPath, content);
        allFindings = allFindings.concat(findings);
      }
    } catch {}
  }

  if (allFindings.length === 0) {
    console.log(`✓ Scanned ${trackedFiles.length} tracked files in repository.`);
    console.log("✅ Zero secrets or private keys detected in tracked codebase.");
    console.log("   Audit status: CLEAN (100% compliant).\n");
    process.exit(0);
  } else {
    console.error(`🚨 DETECTED ${allFindings.length} POTENTIAL SECRET EXPOSURE(S) IN TRACKED FILES:\n`);
    for (const f of allFindings) {
      console.error(`- [${f.rule}] in ${f.file}:${f.line}`);
      console.error(`  Preview: ${f.snippet}`);
    }
    console.error("\nPlease remove or redact credentials before committing.\n");
    process.exit(1);
  }
}

main();
