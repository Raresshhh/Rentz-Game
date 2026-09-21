const { createDeck, dealCards } = require("./deck.js");
const { scoreDiamonds, scoreRedPope, scoreTotals } = require("./scoring.js");

function createGame(players) {
  if (players.length !== 5 && players.length !== 6) {
    throw Error("The number of players does not match the amount required");
  }
  for (let i = players.length - 1; i > 0; i--) {    // shuffle players
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  let cardsTaken = {};
  let contractsAvailable = {};
  let scores = {};
  let hands = {};
  let currentPlayerIndex = 0;
  let currentTrick = [];
  let leadSuit = null;
  let tricksTaken = {};
  let rentzFinishOrder = [];
  let rentzTable = {
    "Spades":   null,
    "Hearts":   null,
    "Diamonds": null,
    "Clovers":  null
  };
  for (let player of players) {
    contractsAvailable[player] = ["Red Pope", "Diamonds", "Totals", "Rentz"];
    scores[player] = 0;
    hands[player] = [];
    tricksTaken[player] = 0;
    cardsTaken[player] = [];
  }
  let currentContract = {
    name: null,
    isBlind: false,
  };
  return {
    players,
    scores,
    currentPlayerIndex,
    contractsAvailable,
    currentContract,
    hands,
    leadSuit,
    currentTrick,
    tricksTaken,
    cardsTaken,
    rentzFinishOrder,
    rentzTable
  };
}

function chooseContract(game, playerIndex, contractName, isBlind) {
  if (game.currentPlayerIndex !== playerIndex) {
    throw new Error("It is not this player's turn to choose a contract");
  }
  let contractIndex =
    game.contractsAvailable[game.players[playerIndex]].indexOf(contractName);
  if (contractIndex === -1) {
    throw new Error("This contract is not available for this player");
  }
  for (let player of game.players) {
    game.tricksTaken[player] = 0;
    game.cardsTaken[player] = [];
  }
  game.rentzFinishOrder = [];
  game.rentzTable = {
    "Spades":   null,
    "Hearts":   null,
    "Diamonds": null,
    "Clovers":  null
  };
  game.contractsAvailable[game.players[playerIndex]].splice(contractIndex, 1);
  if (game.currentPlayerIndex === game.players.length - 1) {
    game.currentPlayerIndex = 0;
  } else {
    game.currentPlayerIndex++;
  }
  game.currentContract.name = contractName;
  game.currentContract.isBlind = isBlind;

  let deck = createDeck(game.players.length, 8);
  let dealtHands = dealCards(deck, game.players.length);
  for (let i = 0; i < game.players.length; i++) {
    game.hands[game.players[i]] = dealtHands[i];
  }
  return game;
}

function playCardTricks(game, playerIndex, card) {
  if (game.leadSuit !== card.suit && game.leadSuit !== null) {
    for (let i = 0; i < game.hands[game.players[playerIndex]].length; i++) {
      if (game.hands[game.players[playerIndex]][i].suit === game.leadSuit) {
        throw new Error(
          "The player could've picked a card that matched the suit",
        );
      }
    }
  }
  if (game.leadSuit === null) {
    game.leadSuit = card.suit;
  }
  game.currentTrick.push({ playerIndex, card });
  let cardIndex = game.hands[game.players[playerIndex]].findIndex(
    (c) => c.suit === card.suit && c.rank === card.rank,
  );
  game.hands[game.players[playerIndex]].splice(cardIndex, 1);
  if (game.currentTrick.length === game.players.length) {
    let winner = findTrickWinner(game.currentTrick, game.leadSuit);
    for (let trickCard of game.currentTrick) {
      game.cardsTaken[game.players[winner]].push(trickCard.card);
    }
    game.tricksTaken[game.players[winner]]++;
    game.currentPlayerIndex = winner;
    game.currentTrick = [];
    game.leadSuit = null;
    if (game.currentContract.name === "Red Pope") {
      let hasRedPope = game.cardsTaken[game.players[winner]].some(
        (c) => c.suit === "Hearts" && c.rank === "K",
      );
      if (hasRedPope) {
        game = scoreRedPope(game);
      }
    }
      let handsEmpty = game.players.every((p) => game.hands[p].length === 0);
      if (handsEmpty) {
        if (game.currentContract.name === "Diamonds") {
          game = scoreDiamonds(game);
        }
        if (game.currentContract.name === "Totals") {
          game = scoreTotals(game);
        }
      }
    
  } else {
    if (game.currentPlayerIndex === game.players.length - 1) {
      game.currentPlayerIndex = 0;
    } else {
      game.currentPlayerIndex++;
    }
  }
  return game;
}

function findTrickWinner(currentTrick, leadSuit) {
  let trickWinnerIndex = null;
  let winnerRank = null;
  const rankOrder = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  for (let trick of currentTrick) {
    if (trick.card.suit === leadSuit) {
      if (trickWinnerIndex === null) {
        trickWinnerIndex = trick.playerIndex;
        winnerRank = rankOrder.indexOf(trick.card.rank);
      } else {
        if (rankOrder.indexOf(trick.card.rank) > winnerRank) {
          trickWinnerIndex = trick.playerIndex;
          winnerRank = rankOrder.indexOf(trick.card.rank);
        }
      }
    }
  }
  return trickWinnerIndex;
}

function playCardRentz(game, playerIndex, card){
    let gameNotBegun = Object.values(game.rentzTable).every(row => row === null);
    const lowestRank = game.players.length === 5 ? '5' : '3';
    if(gameNotBegun && card.rank !== "10"){
        throw new Error("The game has to start with a 10");
    }
    if (game.rentzTable[card.suit] === null) {
        game.rentzTable[card.suit] = { low: "10", high: "10" };
    }
    else{
        const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        let highIndex = rankOrder.indexOf(game.rentzTable[card.suit].high);
        let lowIndex = rankOrder.indexOf(game.rentzTable[card.suit].low);
        let cardIndex = rankOrder.indexOf(card.rank);
        if (cardIndex === highIndex + 1) {
            game.rentzTable[card.suit].high = card.rank;
        }
        else if (cardIndex === lowIndex - 1) {
            game.rentzTable[card.suit].low = card.rank;
        }
        else {
            throw new Error("This card cannot be played here");
        } 
    }
    let handCardIndex = game.hands[game.players[playerIndex]].findIndex(
        c => c.suit === card.suit && c.rank === card.rank
    );
    game.hands[game.players[playerIndex]].splice(handCardIndex, 1);
    if(game.hands[game.players[playerIndex]].length === 0){
        game.rentzFinishOrder.push(playerIndex);
    }
    if(game.rentzFinishOrder.length === game.players.length){
        game = scoreRentz(game);
    }
    if(card.rank !== "A"){
        if(card.rank === lowestRank){
            if(game.currentPlayerIndex === game.players.length - 1){
                game.currentPlayerIndex = 1;
            }
            else if(game.currentPlayerIndex === game.players.length - 2){
                game.currentPlayerIndex = 0;
            }
            else{
                game.currentPlayerIndex = game.currentPlayerIndex + 2;
            }
        }
        else{
            if(game.currentPlayerIndex === game.players.length - 1){
                game.currentPlayerIndex = 0;
            }
            else{
                game.currentPlayerIndex++;
            }
        }
    }
    return game;
}

function skipTurnRentz(game, playerIndex){
  if(game.currentPlayerIndex !== playerIndex){
    throw new Error("It is not this player's turn to play a card");
  }
  for(let card of game.hands[game.players[playerIndex]]){
    if(canPlayCard(game,card) === true){
      throw new Error("This player can play a card");
    }
  }
  if(game.currentPlayerIndex === game.players.length - 1){
    game.currentPlayerIndex = 0;
  }
  else{
    game.currentPlayerIndex++;
  }
  return game;
}

function canPlayCard(game, card){
    let gameNotBegun = Object.values(game.rentzTable).every(row => row === null);
    if(gameNotBegun){
        return card.rank === "10";
    }
    if(game.rentzTable[card.suit] === null){
        return card.rank === "10";
    }
    const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let highIndex = rankOrder.indexOf(game.rentzTable[card.suit].high);
    let lowIndex = rankOrder.indexOf(game.rentzTable[card.suit].low);
    let cardIndex = rankOrder.indexOf(card.rank);
    return cardIndex === highIndex + 1 || cardIndex === lowIndex - 1;
}

module.exports = { createGame, chooseContract, playCardTricks, playCardRentz, skipTurnRentz };
 