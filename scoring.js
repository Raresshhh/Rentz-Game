function scoreDiamonds(game){
    for(let player of game.players){
        let pointsLost = 0;
        for(let trickCard of game.cardsTaken[player]){
            if(trickCard.suit === "Diamonds"){
                pointsLost = pointsLost - 20 ;
            }
        }
        if(game.currentContract.isBlind === true){
            pointsLost = pointsLost * 2;
        }
        game.scores[player] += pointsLost;
    }
    return game;
}

function scoreRedPope(game){
    for(let player of game.players){
        let pointsLost = 0;
        for(let trickCard of game.cardsTaken[player]){
            if(trickCard.suit === "Hearts" && trickCard.rank === "K"){
                pointsLost = pointsLost - 150;
            }
        }
        if(game.currentContract.isBlind === true){
            pointsLost = pointsLost * 2;
        }
        game.scores[player] += pointsLost;
    }
    return game;
}

function scoreTotals(game){
    for(let player of game.players){
        let pointsLost = 0;
        for(let trickCard of game.cardsTaken[player]){
            if(trickCard.suit === "Hearts" && trickCard.rank === "K"){
                pointsLost = pointsLost - 150;
            }
            if(trickCard.rank === "Q"){
                pointsLost = pointsLost - 40;
            }
            if(trickCard.suit === "Diamonds"){
                pointsLost = pointsLost - 20;
            }
        }
        pointsLost = pointsLost - 10 * game.tricksTaken[player];
        if(game.currentContract.isBlind === true){
            pointsLost = pointsLost * 2;
        }
        game.scores[player] += pointsLost;
    }
    return game;
}

function scoreRentz(game){
    let startPoints;
    let tax;
    if(game.currentContract.isBlind === false){
        startPoints = 300;
        tax = 50;
    }
    else{
        startPoints = 600;
        tax = 100;
    }
    for(let i = 0 ; i < game.rentzFinishOrder.length ; i++){
        game.scores[game.players[game.rentzFinishOrder[i]]] += startPoints;
        startPoints = startPoints - tax;
    }
    return game;
}

module.exports = { scoreRedPope, scoreDiamonds, scoreTotals, scoreRentz };
