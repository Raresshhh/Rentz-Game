function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function createDeck(numPlayers, cardsEach) {
    let suits = ["Spades", "Clovers", "Diamonds", "Hearts"];
    let deck= [];
    let ranks= [];
    if(numPlayers !== 5 && numPlayers !== 6){
        throw new Error("The game of Rentz can only start with either 5 or 6 players.");
    }
    if(numPlayers === 5){
        if(cardsEach !== 8)
            throw new Error("In the 5-player setting each player has to get exactly 8 cards");
        ranks = ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    }
    if(numPlayers === 6){
         if(cardsEach !== 8){
             throw new Error("In the 6-player setting each player has to get exactly 8 cards");
    }
    ranks=['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    }
    for(let suit of suits){
        for(let rank of ranks){
            deck.push({suit, rank});
        }
    }
    shuffleDeck(deck);
    return {cards: deck, numPlayers: numPlayers};
}

function dealCards(deck, numPlayers){
    if(deck.numPlayers !== numPlayers){
        throw new Error("This deck was not created for this number of players.");
    }
    let hands= [];
    for(let i=0; i<numPlayers; i++){
        hands.push([]);
    }
    for (let i = 0; i < deck.cards.length; i++) {
         let playerIndex = i % numPlayers;
        hands[playerIndex].push(deck.cards[i]);
    }
    return hands
}

module.exports = { createDeck, dealCards, shuffleDeck };