#!/bin/bash

BASE_URL="http://localhost:5000"

# ===== Accounts =====
P1_USER="catcake"
P1_PASS="binkp01709"

P2_USER="guest"
P2_PASS="guest@guest"

# ===== Cookies =====
P1_COOKIE="cookies_catcake.txt"
P2_COOKIE="cookies_guest.txt"

sleep_short() { sleep 0.4; }

login_if_needed () {
  USERNAME=$1
  PASSWORD=$2
  COOKIE=$3
  LABEL=$4

  if [ -s "$COOKIE" ]; then
    return
  fi

  curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -c "$COOKIE" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" > /dev/null
}

# ===== LOGIN =====
login_if_needed "$P1_USER" "$P1_PASS" "$P1_COOKIE" "P1"
login_if_needed "$P2_USER" "$P2_PASS" "$P2_COOKIE" "P2"

# ===== USER IDS =====
P1_ID=$(curl -s "$BASE_URL/api/auth/me" -b "$P1_COOKIE" | sed -n 's/.*"uid":"\([^"]*\)".*/\1/p')
P2_ID=$(curl -s "$BASE_URL/api/auth/me" -b "$P2_COOKIE" | sed -n 's/.*"uid":"\([^"]*\)".*/\1/p')

# ===== CREATE GAME =====
GAME_ID=$(curl -s -X POST "$BASE_URL/game/create" \
  -H "Content-Type: application/json" \
  -b "$P1_COOKIE" \
  -d "{ \"opponentUserId\": \"$P2_ID\" }" \
  | sed -n 's/.*"_id":"\([^"]*\)".*/\1/p')

echo "GAME_ID=$GAME_ID"
echo "== START GAME =="

# ===== MAIN LOOP =====
while true; do
  STATE=$(curl -s "$BASE_URL/game/$GAME_ID" -b "$P1_COOKIE")

  TURN=$(echo "$STATE" | sed -n 's/.*"turn":\([0-9]*\).*/\1/p')
  ACTIVE=$(echo "$STATE" | sed -n 's/.*"activePlayerIndex":\([0-9]*\).*/\1/p')
  GAMEOVER=$(echo "$STATE" | sed -n 's/.*"gameOver":\(true\|false\).*/\1/p')

  # HP (best-effort, not critical)
  HP0=$(echo "$STATE" | sed -n 's/.*"hp":\([0-9]*\).*"hp":.*/\1/p')
  HP1=$(echo "$STATE" | sed -n 's/.*"hp":[0-9]*.*"hp":\([0-9]*\).*/\1/p')

  echo "TURN=$TURN ACTIVE=$ACTIVE HP0=$HP0 HP1=$HP1 GAMEOVER=$GAMEOVER"

  if [ "$GAMEOVER" = "true" ]; then
    echo "== GAME OVER =="
    break
  fi

  if [ "$ACTIVE" = "0" ]; then
    COOKIE="$P1_COOKIE"
    TARGET="$P2_ID"
    LABEL="P1"
    HAND=$(echo "$STATE" | sed -n 's/.*"players":\[{"[^"]*","hp":[0-9]*,"hand":\[\([^]]*\)\].*/\1/p')
  else
    COOKIE="$P2_COOKIE"
    TARGET="$P1_ID"
    LABEL="P2"
    HAND=$(echo "$STATE" | sed -n 's/.*"players":\[.*{"[^"]*","hp":[0-9]*,"hand":\[\([^]]*\)\].*/\1/p')
  fi

  # No cards → skip (test-only)
  if [ -z "$HAND" ]; then
    echo "$LABEL has no cards — skipping turn (test mode)"
    sleep_short
    continue
  fi

  CARD=$(echo "$HAND" | sed -n 's/"\([^"]*\)".*/\1/p')

  RESULT=$(curl -s -X POST "$BASE_URL/game/play" \
    -H "Content-Type: application/json" \
    -b "$COOKIE" \
    -d "{\"gameId\":\"$GAME_ID\",\"cardId\":\"$CARD\",\"targetUserId\":\"$TARGET\"}")

  if echo "$RESULT" | grep -q '"error"'; then
    echo "$LABEL ERROR: $RESULT"
    break
  fi

  sleep_short
done
