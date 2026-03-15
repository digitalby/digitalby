#!/usr/bin/env bash
# scripts/setup-branch-protection.sh
#
# Applies branch protection rules to the main branch via the GitHub CLI.
# Requires: gh CLI authenticated with a token that has admin:repo scope.
#
# Usage:
#   chmod +x scripts/setup-branch-protection.sh
#   ./scripts/setup-branch-protection.sh
#
# To override the target branch:
#   BRANCH=develop ./scripts/setup-branch-protection.sh

set -euo pipefail

BRANCH="${BRANCH:-main}"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

echo "→ Applying branch protection to ${REPO}@${BRANCH} ..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint",
      "Test",
      "Build",
      "Generate & Analyse"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON

echo ""
echo "✓ Branch protection applied successfully."
echo ""
echo "Rules set on ${REPO}@${BRANCH}:"
echo "  • Pull request required (1 approving review)"
echo "  • Stale reviews dismissed on new commits"
echo "  • Required status checks: Lint, Test, Build, Generate & Analyse"
echo "  • Branch must be up to date before merging"
echo "  • Conversation resolution required"
echo "  • Force-pushes blocked"
echo "  • Branch deletion blocked"
echo "  • Rules enforced for admins too"
echo ""
echo "To verify: gh api /repos/${REPO}/branches/${BRANCH}/protection | jq"
