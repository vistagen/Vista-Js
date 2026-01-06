const fs = require('fs');
const path = require('path');

const appDir = './test-app/app';

function analyzeClientDirective(source) {
  const trimmed = source.trim();
  const isClient = trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
  return { isClient, directiveLine: isClient ? 1 : 0 };
}

function scanDir(dir, baseDir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      results.push(...scanDir(fullPath, baseDir));
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      const source = fs.readFileSync(fullPath, 'utf-8');
      const analysis = analyzeClientDirective(source);
      results.push({
        file: path.relative(baseDir, fullPath),
        isClient: analysis.isClient,
        firstLine: source.split('\n')[0].trim(),
      });
    }
  }
  return results;
}

const files = scanDir(appDir, appDir);
console.log('Scanned files:');
files.forEach((f) => {
  console.log(`  ${f.file}: isClient=${f.isClient}, firstLine="${f.firstLine}"`);
});

const clientFiles = files.filter((f) => f.isClient);
console.log(`\nClient components: ${clientFiles.length}`);
clientFiles.forEach((f) => console.log(`  - ${f.file}`));

import os
import time
import sqlite3
import subprocess
import pickle


# ======================================================
# Configuration & Secrets (Security Auditor)
# ======================================================

# ❌ Hardcoded API secret (should use environment variables)
CI_API_TOKEN = "ci_live_token_1234567890abcdef"

# ❌ Hardcoded password
DEFAULT_ADMIN_PASSWORD = "admin@123"


# ======================================================
# Database & Auth Logic (Security + Ghostwriter)
# ======================================================

def authenticate_user(username, password):
    """
    Authenticate a user using local database credentials.
    """
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    # ❌ SQL injection risk
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)

    return cursor.fetchone()


# ======================================================
# CI Utilities (Security + Runtime)
# ======================================================

def run_ci_command(cmd):
    """
    Run a CI command on the host machine.
    """
    # ❌ Command injection risk
    full_cmd = f"sh {cmd}"
    return subprocess.check_output(full_cmd, shell=True)


def load_ci_payload(data):
    """
    Load serialized CI payload.
    """
    # ❌ Unsafe deserialization
    return pickle.loads(data)


# ======================================================
# Runtime Logic Issues (Runtime Validator)
# ======================================================

def calculate_ratio(a, b):
    """
    Calculate deployment ratio.
    """
    return a / b   # ❌ Possible ZeroDivisionError


def log_ci_result():
    """
    Log CI execution result.
    """
    print(result)  # ❌ Undefined variable


# ======================================================
# Background Worker (Runtime + Ghostwriter)
# ======================================================

def start_background_worker():
    """
    Background worker for periodic CI tasks.
    """
    while True:         # ❌ Infinite loop
        time.sleep(5)


# ======================================================
# Error Handling Anti-Pattern (Security + Runtime)
# ======================================================

def cleanup_runner():
    try:
        cleanup_temp_files()
    except:
        pass            # ❌ Bare except hides failures


def cleanup_temp_files():
    remove_artifacts()  # ❌ Undefined function

