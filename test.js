const { createDeck, dealCards, shuffleDeck } = require("./deck.js");
const {
  createGame,
  chooseContract,
  playCardTricks,
  playCardRentz,
  skipTurnRentz,
} = require("./game.js");
const {
  scoreDiamonds,
  scoreRedPope,
  scoreTotals,
  scoreRentz,
} = require("./scoring.js");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

// ─────────────────────────────────────────────
console.log("\n DECK TESTS");
// ─────────────────────────────────────────────

test("5 players → 40 cards", () => {
  let deck = createDeck(5, 8);
  assert(deck.cards.length === 40, `Expected 40, got ${deck.cards.length}`);
});

test("6 players → 48 cards", () => {
  let deck = createDeck(6, 8);
  assert(deck.cards.length === 48, `Expected 48, got ${deck.cards.length}`);
});

test("Deck has no duplicate cards", () => {
  let deck = createDeck(5, 8);
  let seen = new Set();
  for (let card of deck.cards) {
    let key = card.suit + card.rank;
    assert(!seen.has(key), `Duplicate card: ${key}`);
    seen.add(key);
  }
});

test("Invalid player count throws error", () => {
  let threw = false;
  try { createDeck(4, 8); } catch (e) { threw = true; }
  assert(threw, "Should have thrown for 4 players");
});

test("5 players: deck has correct ranks (5 to A)", () => {
  let deck = createDeck(5, 8);
  let ranks = [...new Set(deck.cards.map(c => c.rank))].sort();
  let expected = ['10', '5', '6', '7', '8', '9', 'A', 'J', 'K', 'Q'].sort();
  assert(JSON.stringify(ranks) === JSON.stringify(expected), `Got ranks: ${ranks}`);
});

test("Deal gives each player 8 cards", () => {
  let deck = createDeck(5, 8);
  let hands = dealCards(deck, 5);
  for (let hand of hands) {
    assert(hand.length === 8, `Expected 8, got ${hand.length}`);
  }
});

test("Deal rejects wrong player count", () => {
  let threw = false;
  let deck = createDeck(5, 8);
  try { dealCards(deck, 6); } catch (e) { threw = true; }
  assert(threw, "Should have thrown for mismatched player count");
});

// ─────────────────────────────────────────────
console.log("\n GAME SETUP TESTS");
// ─────────────────────────────────────────────

test("createGame initializes correctly for 5 players", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  assert(game.players.length === 5, "Should have 5 players");
  assert(game.currentPlayerIndex === 0, "Should start at index 0");
  assert(game.currentContract.name === null, "Contract should be null");
  for (let p of game.players) {
    assert(game.scores[p] === 0, `${p} score should be 0`);
    assert(game.contractsAvailable[p].length === 4, `${p} should have 4 contracts`);
  }
});

test("createGame rejects invalid player count", () => {
  let threw = false;
  try { createGame(["A", "B", "C"]); } catch (e) { threw = true; }
  assert(threw, "Should throw for 3 players");
});

test("createGame shuffles player order", () => {
  let original = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
  let results = new Set();
  for (let i = 0; i < 20; i++) {
    let game = createGame([...original]);
    results.add(game.players[0]);
  }
  assert(results.size > 1, "Player order should be randomized");
});

// ─────────────────────────────────────────────
console.log("\n CONTRACT TESTS");
// ─────────────────────────────────────────────

test("chooseContract sets contract correctly", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  assert(game.currentContract.name === "Rentz", "Contract should be Rentz");
  assert(game.currentContract.isBlind === false, "Should not be blind");
});

test("chooseContract removes contract from player's available list", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  let firstPlayer = game.players[0];
  game = chooseContract(game, 0, "Rentz", false);
  assert(
    !game.contractsAvailable[firstPlayer].includes("Rentz"),
    "Rentz should be removed from available contracts"
  );
});

test("chooseContract advances currentPlayerIndex", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  assert(game.currentPlayerIndex === 1, "Should advance to player 1");
});

test("chooseContract rejects wrong player turn", () => {
  let threw = false;
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  try { chooseContract(game, 2, "Rentz", false); } catch (e) { threw = true; }
  assert(threw, "Should throw when wrong player tries to choose");
});

test("chooseContract rejects unavailable contract", () => {
  let threw = false;
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  game = chooseContract(game, 1, "Diamonds", false);
  game = chooseContract(game, 2, "Totals", false);
  game = chooseContract(game, 3, "Red Pope", false);
  game = chooseContract(game, 4, "Rentz", false);
  // Player 0 tries to pick Rentz again
  try { chooseContract(game, 0, "Rentz", false); } catch (e) { threw = true; }
  assert(threw, "Should throw when contract already used");
});

test("chooseContract deals cards to all players", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  for (let p of game.players) {
    assert(game.hands[p].length === 8, `${p} should have 8 cards`);
  }
});

test("chooseContract resets tricksTaken and cardsTaken", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Diamonds", false);
  game = chooseContract(game, 1, "Rentz", false);
  for (let p of game.players) {
    assert(game.tricksTaken[p] === 0, `${p} tricksTaken should reset`);
    assert(game.cardsTaken[p].length === 0, `${p} cardsTaken should reset`);
  }
});

// ─────────────────────────────────────────────
console.log("\n SCORING TESTS");
// ─────────────────────────────────────────────

test("scoreDiamonds: -20 per diamond taken", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Diamonds", false);
  game.cardsTaken[game.players[0]] = [
    { suit: "Diamonds", rank: "A" },
    { suit: "Diamonds", rank: "K" },
    { suit: "Hearts", rank: "A" },
  ];
  game = scoreDiamonds(game);
  assert(game.scores[game.players[0]] === -40, `Expected -40, got ${game.scores[game.players[0]]}`);
});

test("scoreDiamonds: doubled when blind", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Diamonds", true);
  game.cardsTaken[game.players[0]] = [
    { suit: "Diamonds", rank: "A" },
  ];
  game = scoreDiamonds(game);
  assert(game.scores[game.players[0]] === -40, `Expected -40, got ${game.scores[game.players[0]]}`);
});

test("scoreRedPope: -150 for King of Hearts", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Red Pope", false);
  game.cardsTaken[game.players[0]] = [
    { suit: "Hearts", rank: "K" },
  ];
  game = scoreRedPope(game);
  assert(game.scores[game.players[0]] === -150, `Expected -150, got ${game.scores[game.players[0]]}`);
});

test("scoreRedPope: -300 when blind", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Red Pope", true);
  game.cardsTaken[game.players[0]] = [
    { suit: "Hearts", rank: "K" },
  ];
  game = scoreRedPope(game);
  assert(game.scores[game.players[0]] === -300, `Expected -300, got ${game.scores[game.players[0]]}`);
});

test("scoreTotals: -10 per trick, -150 for red pope, -20 per diamond, -40 per queen", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Totals", false);
  let p = game.players[0];
  game.tricksTaken[p] = 2;
  game.cardsTaken[p] = [
    { suit: "Hearts", rank: "K" },   // -150
    { suit: "Diamonds", rank: "A" }, // -20
    { suit: "Spades", rank: "Q" },   // -40
    { suit: "Diamonds", rank: "Q" }, // -40 -20 = -60
  ];
  game = scoreTotals(game);
  // -20 (tricks) -150 -20 -40 -60 = -290
  assert(game.scores[p] === -290, `Expected -290, got ${game.scores[p]}`);
});

test("scoreRentz: correct points for finish order", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  game.rentzFinishOrder = [2, 0, 4, 1, 3];
  game = scoreRentz(game);
  assert(game.scores[game.players[2]] === 300, `1st should get 300`);
  assert(game.scores[game.players[0]] === 250, `2nd should get 250`);
  assert(game.scores[game.players[4]] === 200, `3rd should get 200`);
  assert(game.scores[game.players[1]] === 150, `4th should get 150`);
  assert(game.scores[game.players[3]] === 100, `5th should get 100`);
});

test("scoreRentz: doubled when blind", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", true);
  game.rentzFinishOrder = [0, 1, 2, 3, 4];
  game = scoreRentz(game);
  assert(game.scores[game.players[0]] === 600, `1st should get 600 when blind`);
  assert(game.scores[game.players[1]] === 500, `2nd should get 500 when blind`);
});

// ─────────────────────────────────────────────
console.log("\n RENTZ GAMEPLAY TESTS");
// ─────────────────────────────────────────────

test("playCardRentz: must start with a 10", () => {
  let threw = false;
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  game.hands[game.players[0]] = [{ suit: "Spades", rank: "A" }];
  try { playCardRentz(game, 0, { suit: "Spades", rank: "A" }); } catch (e) { threw = true; }
  assert(threw, "Should throw if first card is not a 10");
});

test("playCardRentz: valid 10 starts a row", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  game.hands[game.players[0]] = [{ suit: "Spades", rank: "10" }];
  game = playCardRentz(game, 0, { suit: "Spades", rank: "10" });
  assert(game.rentzTable["Spades"] !== null, "Spades row should be started");
  assert(game.rentzTable["Spades"].low === "10", "Low should be 10");
  assert(game.rentzTable["Spades"].high === "10", "High should be 10");
});

test("playCardRentz: cannot play card that doesn't extend a row", () => {
  let threw = false;
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  game.rentzTable["Spades"] = { low: "10", high: "10" };
  game.hands[game.players[0]] = [{ suit: "Spades", rank: "8" }];
  try { playCardRentz(game, 0, { suit: "Spades", rank: "8" }); } catch (e) { threw = true; }
  assert(threw, "Should throw for invalid card placement");
});

test("skipTurnRentz: cannot skip if valid card exists", () => {
  let threw = false;
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  game.rentzTable["Spades"] = { low: "10", high: "10" };
  game.hands[game.players[0]] = [{ suit: "Spades", rank: "J" }];
  try { skipTurnRentz(game, 0); } catch (e) { threw = true; }
  assert(threw, "Should throw if player has a valid card to play");
});

test("skipTurnRentz: can skip if no valid card", () => {
  let game = createGame(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  game = chooseContract(game, 0, "Rentz", false);
  game.currentPlayerIndex = 0;
  game.rentzTable["Spades"] = { low: "10", high: "A" };
  game.rentzTable["Hearts"] = { low: "10", high: "A" };
  game.rentzTable["Diamonds"] = { low: "10", high: "A" };
  game.rentzTable["Clovers"] = { low: "10", high: "A" };
  game.hands[game.players[0]] = [{ suit: "Spades", rank: "5" }];
  game = skipTurnRentz(game, 0);
  assert(game.currentPlayerIndex === 1, "Should advance to next player");
});

// ─────────────────────────────────────────────
console.log("\n─────────────────────────────────");
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("─────────────────────────────────\n");
