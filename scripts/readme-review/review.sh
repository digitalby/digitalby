#!/usr/bin/env bash
set -euo pipefail

# Reads README.md from stdin, calls the Anthropic API for improvement suggestions,
# and writes the improved README to stdout.
# Requires: ANTHROPIC_API_KEY environment variable, curl, jq.

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "Error: ANTHROPIC_API_KEY is not set" >&2
  exit 1
fi

for cmd in curl jq; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is required but not installed" >&2
    exit 1
  fi
done

README_CONTENT=$(cat)

if [[ -z "$README_CONTENT" ]]; then
  echo "Error: empty README content on stdin" >&2
  exit 1
fi

SYSTEM_PROMPT='You are a technical editor reviewing a GitHub profile README for digitalby (Yury), a mobile and tech professional.

Your job: suggest concrete improvements to the README. You may amend wording, remove outdated or redundant content, add missing sections, reorder for clarity, or fix formatting issues.

Rules:
- Preserve the existing voice and tone.
- Do not invent facts. Only work with what is present.
- Do not add emojis beyond what already exists.
- Do not add badges or shields beyond what already exists.
- Keep it concise. Profile READMEs should be scannable.
- If the README is already in good shape, return it unchanged.
- Output ONLY the improved README content, nothing else. No explanations, no markdown fences wrapping the output.'

PAYLOAD=$(jq -n \
  --arg system "$SYSTEM_PROMPT" \
  --arg readme "$README_CONTENT" \
  '{
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: $system,
    messages: [
      {
        role: "user",
        content: ("Here is the current README.md:\n\n" + $readme + "\n\nPlease review and return an improved version.")
      }
    ]
  }')

RESPONSE=$(curl -s -w "\n%{http_code}" \
  https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: ${ANTHROPIC_API_KEY}" \
  -H "anthropic-version: 2023-06-01" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Error: Anthropic API returned HTTP $HTTP_CODE" >&2
  echo "$BODY" >&2
  exit 1
fi

RESULT=$(echo "$BODY" | jq -r '.content[0].text // empty')

if [[ -z "$RESULT" ]]; then
  echo "Error: empty response from Anthropic API" >&2
  echo "$BODY" >&2
  exit 1
fi

echo "$RESULT"
