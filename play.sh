#!/bin/bash

API="http://localhost:5000"
COOKIE="-b cookies_catcake.txt"

echo "=== CREATE GAME ==="
CREATE=$(curl -s -X POST "$API/game/create" \
  -H "Content-Type: application/json" \
  $COOKIE \
  -d '{"opponentUserId":"6970ac81f900736d8df15819"}')

echo "$CREATE"

GAME_ID=$(echo "$CREATE" | sed -n 's/.*"_id":"\([^"]*\)".*/\1/p')
echo "GAME_ID=$GAME_ID"
echo "----------------------------------------"

TURN=0

while true; do
  echo
  echo "=== FETCH STATE (TURN $TURN) ==="
  STATE=$(curl -s "$API/game/$GAME_ID" $COOKIE)
  echo "$STATE"

  # Check gameOver
  echo "$STATE" | grep '"gameOver":true' >/dev/null
  if [ $? -eq 0 ]; then
    echo
    echo "=== GAME OVER ==="
    break
  fi

  # Who is active
  ACTIVE_INDEX=$(echo "$STATE" | sed -n 's/.*"activePlayerIndex":\([0-9]\).*/\1/p')
  echo "ActivePlayerIndex=$ACTIVE_INDEX"

  # Extract active player's first card
  CARD=$(echo "$STATE" \
    | sed -n "s/.*\"players\":\[.*\"hand\":\[\([^]]*\)\].*/\1/p" \
    | sed 's/"//g' \
    | cut -d',' -f1)

  if [ -z "$CARD" ]; then
    echo "No cards in hand, PASS"
  else
    # Target = the other player
    if [ "$ACTIVE_INDEX" = "0" ]; then
      TARGET=$(echo "$STATE" | sed -n 's/.*"players":\[{"userId":"\([^"]*\)".*},{"userId":"\([^"]*\)".*/\2/p')
    else
      TARGET=$(echo "$STATE" | sed -n 's/.*"players":\[{"userId":"\([^"]*\)".*},{"userId":"\([^"]*\)".*/\1/p')
    fi

    echo
    echo "--- PLAY CARD: $CARD → $TARGET ---"
    PLAY=$(curl -s -X POST "$API/game/play" \
      -H "Content-Type: application/json" \
      $COOKIE \
      -d "{
        \"gameId\":\"$GAME_ID\",
        \"cardId\":\"$CARD\",
        \"targetUserId\":\"$TARGET\"
      }")

    echo "$PLAY"

    echo "$PLAY" | grep '"error"' >/dev/null
    if [ $? -eq 0 ]; then
      echo "Play failed, skipping to PASS"
    fi
  fi

  echo
  echo "--- PASS TURN ---"
  PASS=$(curl -s -X POST "$API/game/pass" \
    -H "Content-Type: application/json" \
    $COOKIE \
    -d "{\"gameId\":\"$GAME_ID\"}")

  echo "$PASS"

  TURN=$((TURN+1))
done

echo
echo "=== FINAL STATE ==="
curl -s "$API/game/$GAME_ID" $COOKIE
echo
echo "=== DONE ==="
