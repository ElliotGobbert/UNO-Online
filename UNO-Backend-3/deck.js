//This class is just gonna be the deck of cards, the goal of this class is to make all 108 uno cards, and put them into an array. (Each cardtype has a specific # of cards it should have, for more info go to: https://www.letsplayuno.com/news/guide/20181213/30092_732567.html#:~:text=A%20UNO%20deck%20consists%20of,cards%20and%208%20Wild%20cards.)
//The methods this class should have are:
//"takeRandomCard()" method: takes a random card and returns it from the deckOfCards[] array. This will be used when we initialize the player's hands, giving them each 7 cards (by taking them from the deck obviously), or whenever a player draws a card
//"addCard(card)" method: adds a card to the deck. Not only will this be used when initializing the deck with all 108 cards, but when a player places a card on the stack, the previous card on the stack should be put on the bottom of the deck(Of course, location of where we add the card shouldn't matter, since whenever we take a card, we take a from a random index in the array)
import { Card, Color } from "./card.js";
import { playedCards } from "./game.js";

const deck = [];
export default deck;

Color.set.forEach(addAllOfColor);

export function getRandomCard() {
	const card = deck.splice(Math.floor((Math.random() * deck.length)), 1)[0];
	if (deck.length === 0) {
		deck.push(...playedCards.splice(0, playedCards.length));
	}
	return card;
}

function addAllOfColor(color) {
	if (color === "black") {
		for (let i = 0; i < 4; i++) {
			deck.push(color + " " + Card.COLOR_CHANGE);
			deck.push(color + " " + Card.PLUS_FOUR);
		}
	} else {
		deck.push(color + " 0");
		for (let val = 1; val < 13; val++) {
			deck.push(color + " " + val);
			deck.push(color + " " + val);
		}
	}
}