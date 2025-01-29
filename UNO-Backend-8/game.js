//This class runs the actual game, with turns, and checks if anyone has ever won
//This class is started when the admin (clients[0]) presses their startGame button, starting this whole class up and running
//The methods this class should have are:
//"initializeGame()" method: initializes the game. gives 7 cards out to each player, also initiliazes each of the players screens by updating them with information about how many players are playing (we may not be playing with a full 4 players always), the usernames of each of the other players, and then organize each of the players screens by turn order --> i.e if player2 goes after player1, then, on player 1's screen, player 2 should be the player on the right side of the screen, vice versa for the person going before them, also sets the first card in the stack to be a random card from the deck
//"deletePlayer()" method: deals with what happens when a player leaves/disconnects. adds all the cards they had back to the deck, removes them from the clients[] list, updates the screens of each of the players to accurately show who's before and after them; for the record, yes, we do need to have an array of each of the player's cards in their hand
//"playerDrewCard()" method: deals with what happens when a player draws a card from the deck. remember that the client side will always have info on what random card they would be taking if they were to draw a card, making it quicker to render for the client (the player doesn't know, the client-side does, big difference btw) when the client sends the message to the server saying they've drawn that card fromt the deck, first: let the others players know that the player has taken a card from the deck, second: gets a new random card from the deck and sends that to the player as the card they would recieve if they were to draw another card
//"playerPlacedCard()" method: deals with what happens when a player places a card on the stack. when the player sends the message to the server saying that they've placed a certain card on the stack, the server should send a message to all players (except the player who originally placed the card), telling them that the player has placed a certain card on the stack. should also add the previous card on the stack to the deck
//"playerFinishedTurn()" method: deals with what happens when a player has finished their turn. when a player finishes their turn, the server must know what the next player HAS TO DO, i.e if player1 put down a +2, player2 MUST draw 2, or place another +2 and make it +4 for the next person, i recommend that we keep track of what the next player has to do and update it everytime playerPlacedCard() is activated in this class, then send that out to player2 when this method is called
//"findWinner()" method: checks if the game is over. if any of the arraysOfPlayerHands[].size == 0, then gameOver = true, broadcast a message to all players saying who won; should be triggered whenever a player places a card on the stack
import { Card } from "./card.js";
import deck, * as deckJS from "./deck.js";
export var turnIncrement = 1; // increment becomes -1 if reverse, +2/-2 if skipping, etc
// export var nextPlayerDraw = 0;
export var nextPlayerColor;
export var lastPlacedCard;
export const playedCards = [];

export const players = [];
export var pointer = 0;
export const initialCardNumber = 7;
export var cardsToDraw = 0;

export var started = false;

export class Player {
    hand = [];
    connection;
    id;
    username;
    isTurn = false;

    constructor(connection, id) {
        this.connection = connection;
        this.id = id;
        this.isTurn = false;
        for (let i = 0; i < initialCardNumber; i++) {
            this.draw(deckJS.getRandomCard());
        }
    }

    draw(card) {
        this.hand.push(card);
    }

    play(color, valueString) {
        for (let i = 0; i < this.hand.length; i++) {
            const [cardColor, cardValueString] = this.hand[i].split(" ");
            if (cardColor === color 
                && cardValueString === valueString) 
            {
                playedCards.push(this.hand.splice(i, 1)[0]);
                break;
            }
        }
    }

    toString() {
        return this.username + ": " + this.hand.length.toString() + " cards";
    }
}

export function initializeGame() {
    started = true;
    pointer = 0;
    turnIncrement = 1;
    deck.push(...playedCards.splice(0, playedCards.length));
    let firstCard = deckJS.getRandomCard();
    while (firstCard.value === Card.PLUS_FOUR) {
        deck.push(firstCard);
        firstCard = deckJS.getRandomCard();
    }
    playedCards.push(firstCard);
    const firstCardValue = parseInt(firstCard.value);
    if (firstCardValue === Card.SKIP) {
        pointer++;
        console.log("pointer incremented by 1");
    } else if (firstCardValue === Card.REVERSE) {
        turnIncrement *= -1;
    }
    players[pointer].isTurn = true;
    broadcast({
        type: "start",
        usernames: players.map((player) => player.username),
        hands: players.map((player) => player.hand),
        firstCard: firstCard,
        startingID: pointer
    });
}

export function colorChanged(newColor) {
    nextPlayerColor = newColor;
    broadcast({
        type: "colorChange",
        info: nextPlayerColor,
    });
}

export function findWinner() {
    for (const player of players) {
        if (player.hand.length === 0) {
            return player;
        }
    }
    return null;
}

export function broadcast(message) {
    //Sends a message to all players
    console.log("broadcasting: ", message);
    var information = JSON.stringify(message);
    for (const client of players) {
        client.connection.send(information);
    }
}

export function playerRequestedDraw(id, number, reason) {
    if (number === null) {
        number = cardsToDraw;
    }
    if (number === 0) {
        number = 1;
    }
    const cardsDrawn = new Array(number);
    for (let i = 0; i < number; i++) {
        const cardDrawn = deckJS.getRandomCard();
        cardsDrawn[i] = cardDrawn;
        players[id].draw(cardDrawn);
    }
    cardsToDraw = 0;
    console.log(players[id].username + " drew " + cardsDrawn.length + " cards");
    broadcast({
        type: "drewCards",
        id: id,
        cardsDrawn: cardsDrawn,
        reason: reason
    });
}        

/**
 *
 */
export function playerPlacedCard(id, card) {
    const [color, valueString] = card.split(" ");
    players[id].play(color, valueString);
    if (color !== "black") {
        nextPlayerColor = color;
    }
    switch (parseInt(valueString)) {
        case Card.REVERSE:
            turnIncrement *= -1;
            console.log("reverse card played");
            break;
        case Card.SKIP:
            turnIncrement += Math.sign(turnIncrement);
            console.log("skip card played");
            break;
        case Card.PLUS_FOUR:
            cardsToDraw += 4;
            console.log("+4 played");
            break;
        case Card.PLUS_TWO:
            cardsToDraw += 2;
            console.log("+2 played");
            break;
    }
    lastPlacedCard = card;
    broadcast({
        type: "placedCard",
        id: id,
        info: lastPlacedCard,
    });
}

export function playerFinishedTurn() {
    const winner = findWinner();
    if (winner !== null) {
        started = false;
        broadcast({
            type: "gameOver",
            winnerName: winner.username,
            winnerId: winner.id,
        });
        return;
    }

    makePointerInBounds();
    
    players[pointer].isTurn = false;
    pointer += turnIncrement;
    makePointerInBounds();
    players[pointer].isTurn = true;
    turnIncrement = Math.sign(turnIncrement);
    broadcast({
        type: "newTurn",
        id: pointer,
    });
}

var idOfUNOer = null;
export function playerActivatedUNO(id) {
    idOfUNOer = id;
    broadcast({
        type: "unoActivated",
        userId: id,
    });
}

export function playerActivatedUNOResponse(id) {
    broadcast({
        type: "unoActivatedResponse",
        UNOerId: idOfUNOer,
        success: id === idOfUNOer,
    });
}

export function makePointerInBounds() {
    if (pointer < 0) {
        pointer += players.length;
    } else if (pointer >= players.length) {
        pointer -= players.length;
    }
}

export function setPointer(newPointer) {
    pointer = newPointer;
    makePointerInBounds();
}

export function setStarted(gameStarted) {
    started = gameStarted;
}