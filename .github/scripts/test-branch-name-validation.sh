#!/usr/bin/env bash
# Tests for the branch name validation logic in .github/workflows/branch-name.yml
# Run with: bash .github/scripts/test-branch-name-validation.sh

set -euo pipefail

PASS=0
FAIL=0

# Extracted validation logic from branch-name.yml
# Returns 0 for valid, 1 for invalid
validate_branch() {
  local branch_name="$1"
  local base_branch="${2:-develop}"

  # Special case: develop -> main is always allowed
  if [ "$branch_name" = "develop" ] && [ "$base_branch" = "main" ]; then
    return 0
  fi

  # Check allowed prefixes
  case "$branch_name" in
    feature/*|bugfix/*|refactor/*|docs/*|chore/*|design/*|test/*|build/*)
      ;;
    *)
      return 1
      ;;
  esac

  # Validate short-title format
  local short_title="${branch_name#*/}"
  if ! printf '%s' "$short_title" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$'; then
    return 1
  fi

  return 0
}

assert_valid() {
  local branch="$1"
  local base="${2:-develop}"
  local label="${3:-$branch (base=$base)}"
  if validate_branch "$branch" "$base"; then
    echo "PASS: valid   -> $label"
    PASS=$((PASS + 1))
  else
    echo "FAIL: expected valid but got invalid -> $label"
    FAIL=$((FAIL + 1))
  fi
}

assert_invalid() {
  local branch="$1"
  local base="${2:-develop}"
  local label="${3:-$branch (base=$base)}"
  if ! validate_branch "$branch" "$base"; then
    echo "PASS: invalid -> $label"
    PASS=$((PASS + 1))
  else
    echo "FAIL: expected invalid but got valid -> $label"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Branch Name Validation Tests ==="
echo ""

# -------------------------------------------------------
# Special case: develop -> main
# -------------------------------------------------------
echo "--- Special case: develop branch merging into main ---"
assert_valid "develop" "main" "develop -> main (allowed)"
# develop -> develop is NOT a special case, and "develop" has no valid prefix
assert_invalid "develop" "develop" "develop -> develop (not special-cased)"

echo ""

# -------------------------------------------------------
# Valid prefixes with well-formed short-titles
# -------------------------------------------------------
echo "--- Valid prefixes ---"
assert_valid "feature/task-create-api"     "develop" "feature/ prefix"
assert_valid "bugfix/health-check-db-error" "develop" "bugfix/ prefix"
assert_valid "refactor/user-service"        "develop" "refactor/ prefix"
assert_valid "docs/development-rules"       "develop" "docs/ prefix"
assert_valid "chore/update-deps"            "develop" "chore/ prefix"
assert_valid "design/ui-review"             "develop" "design/ prefix"
assert_valid "test/task-service"            "develop" "test/ prefix (new in this PR)"
assert_valid "build/docker-image"           "develop" "build/ prefix (new in this PR)"

echo ""

# -------------------------------------------------------
# Valid short-title formats
# -------------------------------------------------------
echo "--- Valid short-title formats ---"
assert_valid "feature/abc"                  "develop" "single word"
assert_valid "feature/abc123"               "develop" "alphanumeric, no hyphen"
assert_valid "feature/a1b2c3"               "develop" "interleaved alphanumeric"
assert_valid "feature/123abc"               "develop" "starts with digits"
assert_valid "feature/task-create-api"      "develop" "multiple hyphen-separated segments"
assert_valid "feature/a-b-c"                "develop" "many single-char segments"
assert_valid "docs/api-design"              "develop" "docs with hyphenated short-title"
assert_valid "chore/v2"                     "develop" "segment ending with digit"

echo ""

# -------------------------------------------------------
# Invalid: disallowed prefix
# -------------------------------------------------------
echo "--- Invalid: disallowed prefix ---"
assert_invalid "main"                       "develop" "bare 'main' (no prefix)"
assert_invalid "release/v1-0"              "develop" "release/ prefix (not allowed)"
assert_invalid "hotfix/fix-something"       "develop" "hotfix/ prefix (not allowed)"
assert_invalid "feature"                    "develop" "prefix without slash"
assert_invalid "custom/branch-name"         "develop" "custom/ prefix (not allowed)"
assert_invalid "fix/something"              "develop" "fix/ prefix (not allowed)"

echo ""

# -------------------------------------------------------
# Invalid: empty short-title after prefix
# -------------------------------------------------------
echo "--- Invalid: empty short-title after prefix ---"
assert_invalid "feature/"                   "develop" "feature/ with empty short-title"
assert_invalid "bugfix/"                    "develop" "bugfix/ with empty short-title"
assert_invalid "docs/"                      "develop" "docs/ with empty short-title"

echo ""

# -------------------------------------------------------
# Invalid: uppercase letters in short-title
# -------------------------------------------------------
echo "--- Invalid: uppercase in short-title ---"
assert_invalid "feature/Task-Create-Api"    "develop" "mixed case (CamelCase)"
assert_invalid "feature/UPPER"              "develop" "all uppercase"
assert_invalid "feature/taskCreate"         "develop" "camelCase"
assert_invalid "docs/API-design"            "develop" "uppercase mid-word"

echo ""

# -------------------------------------------------------
# Invalid: hyphens in wrong positions in short-title
# -------------------------------------------------------
echo "--- Invalid: hyphen placement ---"
assert_invalid "feature/-starts-with-hyphen"  "develop" "short-title starts with hyphen"
assert_invalid "feature/ends-with-hyphen-"    "develop" "short-title ends with hyphen"
assert_invalid "feature/double--hyphen"       "develop" "double consecutive hyphens"
assert_invalid "feature/a--b"                 "develop" "consecutive hyphens between segments"

echo ""

# -------------------------------------------------------
# Invalid: special characters in short-title
# -------------------------------------------------------
echo "--- Invalid: special characters in short-title ---"
assert_invalid "feature/has_underscore"     "develop" "underscore in short-title"
assert_invalid "feature/has.dot"            "develop" "dot in short-title"
assert_invalid "feature/has/slash"          "develop" "slash in short-title"
assert_invalid "feature/has@symbol"         "develop" "@ symbol in short-title"

echo ""

# -------------------------------------------------------
# Boundary / regression cases
# -------------------------------------------------------
echo "--- Boundary and regression cases ---"
# Single character short-title
assert_valid   "feature/a"                  "develop" "single character short-title"
assert_valid   "feature/1"                  "develop" "single digit short-title"
assert_invalid "feature/-"                  "develop" "hyphen-only short-title"
# New branch naming (no issue number required, per git-workflow.md change)
assert_valid   "feature/task-create-api"    "develop" "new format without issue number"
# Old-style with issue number - still valid since digits are allowed
assert_valid   "feature/12-task-create-api" "develop" "old format with issue number (still passes)"
# Base branch variations (non-main base should still be validated normally)
assert_valid   "feature/some-feature"       "develop" "valid branch targeting develop"
assert_valid   "feature/some-feature"       "main"    "valid branch targeting main"
assert_invalid "hotfix/urgent"              "main"    "invalid prefix targeting main"

echo ""
echo "==================================="
echo "Results: $PASS passed, $FAIL failed"
echo "==================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
