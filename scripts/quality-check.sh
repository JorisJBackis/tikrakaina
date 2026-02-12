#!/bin/bash
# VilRent Quality Check Script
# Run this to verify code quality before commits

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           VilRent Code Quality Check                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/.."

# Frontend checks
echo "🔍 Frontend (Next.js/TypeScript)"
echo "─────────────────────────────────"
cd tikrakaina

echo -n "  ESLint:        "
if npm run lint --silent 2>/dev/null; then
    echo "✅ Passed"
else
    echo "⚠️  Issues found"
fi

echo -n "  TypeScript:    "
if npx tsc --noEmit 2>/dev/null; then
    echo "✅ No errors"
else
    echo "⚠️  Type errors"
fi

echo -n "  Build:         "
if npm run build --silent 2>/dev/null; then
    echo "✅ Successful"
else
    echo "⚠️  Build issues"
fi

cd ..

# Backend checks
echo ""
echo "🔍 Backend (FastAPI/Python)"
echo "─────────────────────────────────"
cd backend

echo -n "  Ruff Lint:     "
if command -v ruff &> /dev/null; then
    if ruff check . --quiet 2>/dev/null; then
        echo "✅ Passed"
    else
        echo "⚠️  Issues found"
    fi
else
    echo "⏭️  Skipped (ruff not installed)"
fi

cd ..

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Quality check complete!                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
