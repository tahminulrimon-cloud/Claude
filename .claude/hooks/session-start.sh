#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install dependencies when package.json is present
if [ -f "$CLAUDE_PROJECT_DIR/package.json" ]; then
  echo "Installing Node.js dependencies..."
  cd "$CLAUDE_PROJECT_DIR"
  npm install
fi

# Install Python dependencies when requirements.txt is present
if [ -f "$CLAUDE_PROJECT_DIR/requirements.txt" ]; then
  echo "Installing Python dependencies..."
  pip install -r "$CLAUDE_PROJECT_DIR/requirements.txt"
fi

# Install Python dependencies when pyproject.toml is present
if [ -f "$CLAUDE_PROJECT_DIR/pyproject.toml" ]; then
  echo "Installing Python project dependencies..."
  cd "$CLAUDE_PROJECT_DIR"
  pip install -e ".[dev]" 2>/dev/null || pip install -e .
fi
