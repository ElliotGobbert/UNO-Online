let music = null;
var currentMusic = new Audio("audio/8-ball-music.mp3");
var audio = false;
function toggleAudio() {
	if (audio == false) {
		music = currentMusic;
		audioButtonImage.src = "images/audioSymbol.png"
		music.volume = 0.075;
		music.loop = "loop";
		music.play();
	} else {
		audioButtonImage.src = "images/audioCrossedOutSymbol.png";
		music.volume = 0.0;
	}
	audio = !audio;
}
audioButtonImage.src = "images/audioCrossedOutSymbol.png";
audioButton.addEventListener('click', toggleAudio);


let sides = [];

class Player {

	constructor(userId, username, hand) {
		this.id = userId;
		this.username = username;
		this.side = sides[userId];
		this.hand = this.side.hand;
		this.initializeHand(hand);
	}

	initializeHand(cardStrings) {
		cardStrings.forEach(card => this.draw(card));
		this.draw = cardString => {
			playCardSound();
			const [color, value] = cardString.split(" ")
			addCardTo(this.side, this.side.newCard(color, value));
		}
	}

	draw(cardString) {
		const [color, value] = cardString.split(" ");
		addCardTo(this.side, this.side.newCard(color, value));
	}

	place(cardString) {
		const [color, value] = cardString.split(" ");
		for (let i = 0; i < this.hand.length; i++) {
			if (this.hand[i].color === Color.of(color)
				&& this.hand[i].value === parseInt(value)) {
				addCardToStackFrom(this.side, i);
				break;
			}
		}
	}
}

const players = [];
let prevCard = null;
let currentColor = null;
// how many cards this user has placed
let cardsPlaced = 0;
let turnIncrement = 1;
let isTurn = false;
let idleCount = 0;

//userConnected() method: should update their username, position on the screen, and give them an appropriate amount of cards (flipped cards, the values should be blank obviously), if userId=us, then we don't have to bother with any of this
// function userConnected(userId, username) {
//     console.log("user Connected");
//     players[userId] = new Player(userId,username,null);
// }

//not sure how/if this will work, but general idea is get rid of that player
//IF array size changes, then we would have to reset the id and username values here (and the other arrays)

function noPlayableCards() {
	return !handOfCards.some(card => card.isPlayable());
}

function userDisconnected(disconnectedId) {
	console.log("user Disconnected");
	sideUsernames.get(sides[disconnectedId]).style.visibility = "hidden";
	if (id > disconnectedId) {
		id--;
		if (id === disconnectedId) {
			isTurn = true;
			startTurn();
		}
	}
	if (players.length === 0) {
		return;
	}
	for (const card of players[disconnectedId].hand) {
		card.animateTo(deck.style.top, topDeckCardElement.x(), 500, 0, false);
		setTimeout(() => card.topElement().remove(), 600);
	}
	players.splice(disconnectedId, 1);
	for (let i = 0; i < players.length; i++) {
		if (players[i].id > disconnectedId) {
			players[i].id--;
		}
	}
}

//initialize current client player with their starting deck (also passes in the usernames of everyone)
//starts game - note: it allows the player to start the game
function startGame(usernames, hands, firstCard, startingID) {
	console.log("starting game");
	console.log("players: " + usernames.length);
	sides = usernames.length === 2
		? [Side.TOP]
		: assignMoreThanTwoSides(usernames.length);
	sides.splice(id, 0, Side.BOTTOM);
	for (let i = 0; i < usernames.length; i++) {
		const usernameElement = sideUsernames.get(sides[i]);
		usernameElement.innerHTML = usernames[i];
		usernameElement.style.visibility = "visible";
		players.push(new Player(i, usernames[i], hands[i]));
	}
	music?.pause();

	music = new Audio("audio/darts-music.mp3");
	music.volume = .00;
	music.play();
	if (audio) {//If audio is activated -->
		music.volume = 0.04;
	}

	let [color, value] = firstCard.split(" ");
	value = parseInt(value);
	prevCard = { color: color, value: value };
	currentColor = Color.of(color);
	changePileColor();
	
	const stackCard = new Card(color, value, false);
	pushOntoStack(stackCard);
	stackCard.angle = Math.floor(Math.random() * 40) - 20;
	stackCard.element.style.transform = "rotate(" + stackCard.angle + "deg)";
	stackCard.setLocation(stackLocation.top, stackLocation.left);
	
	const starter = parseInt(startingID);
	makeGlow(sides[starter]);
	createGameUI();
	switch (value) {
		case REVERSE:
			turnIncrement *= -1;
			flipArrows();
			break;
		case SKIP:
			if (Math.abs(turnIncrement) === 1) {
				turnIncrement *= 2;
			};
			break;
	}
	if (id !== starter) {
		return;
	}
	isTurn = true;
	switch (value) {
		case COLOR_CHANGE:
			activateColorButtons();
			break;
		case PLUS_TWO:
			sendDrawRequest(2);
			break;
		default:
			startTurn();
			break;
	}
}

function assignMoreThanTwoSides(numberOfSides) {
	if (numberOfSides === 3) {
		return id === 1 ? [Side.LEFT, Side.RIGHT] : [Side.RIGHT, Side.LEFT];
	}
	switch (id) {
		case 1:
			return [Side.LEFT, Side.RIGHT, Side.TOP];
		case 2:
			return [Side.TOP, Side.LEFT, Side.RIGHT];
		default:
			return [Side.RIGHT, Side.TOP, Side.LEFT];
	}
}

function colorChanged(newColor) {
	console.log("color changed to: ", newColor);
	currentColor = Color.of(newColor);
	changePileColor();
	// If the last played card was a color change (not +4) card, then the
	// next player should be able to play any card with the same color
	// (or a black card)
	if (prevCard.value === COLOR_CHANGE) {
		prevCard.value = null;
	}
}

//if another player drew a card
//just add one to their visual deck
function playerDrewCards(idOfDrawer, cardsTheyDrew, reason) {
	//basically just call draw(id)
	// well the id is used to determine the index of the players array
	for (const card of cardsTheyDrew) {
		players[idOfDrawer].draw(card);
	}

	if (idOfDrawer === id && isTurn) {
		if (noPlayableCards()) {
			setTimeout(() => finishTurn("drew no playable cards"), 1000);
		} else {
			doneButton.style.visibility = "visible";
		}
	}

	const maybeModifyPrevCard = cardsTheyDrew.length > 1 && reason !== "UNO";
	if ((maybeModifyPrevCard && idOfDrawer !== id)
		&& (prevCard.value === PLUS_FOUR || prevCard.value === PLUS_TWO)) {
		prevCard.value = null;
	}
	
	console.log(players[idOfDrawer].username + " drew " + cardsTheyDrew.length
		+ " cards");
}

//if another player placed a card
//needs to know the id of the player and what card it is (for animation)
function playerPlacedCard(idOfPlacer, cardTheyPlaced) {
	// i think so
	const [color, value] = cardTheyPlaced.split(" ");
	prevCard = { color: Color.of(color), value: parseInt(value) };
	if (color !== "black") {
		currentColor = Color.of(color);
	}
	changePileColor();
	switch (prevCard.value) {
		case REVERSE:
			turnIncrement *= -1;
			flipArrows();
			console.log("reverse card played");
			break;
		case SKIP:
			if (Math.abs(turnIncrement) === 1) {
				turnIncrement *= 2;
			}
			console.log("skip card played");
			break;
	}
	if (id === idOfPlacer) {
		return;
	}
	players[idOfPlacer].place(cardTheyPlaced);
	console.log("player placed card");
}

var timerInterval;

function startTurn() {
	console.log("starting turn");
	isTurn = true;
	if (noPlayableCards()) {
		console.log("no playable cards, prevCard: ", prevCard);
		sendDrawRequest();
	} else {
		doneButton.style.visibility = "visible";
	}
	startTimer();
}

function finishTurn(trigger) {
	console.log("ending turn");
	stopTimer();
	console.log(trigger);
	isTurn = false;
	cardsPlaced = 0;
	send({ type: "finishedTurn" });
	doneButton.style.visibility = "hidden";
}

doneButton.onclick = () => {
	if (cardsPlaced === 0) {
		sendDrawRequest();
	}
	finishTurn("done button clicked");
}

function newTurn(newIndex) {
	console.log("now " + players[newIndex].username + "\'s turn");
	disableGlow(previousPlayer(newIndex).side);
	makeGlow(players[newIndex].side);
	turnIncrement = Math.sign(turnIncrement);
	isTurn = id === newIndex;
	if (!isTurn) {
		return;
	}
	startTurn();
}

gameOverButton.onclick = () => {
	gameOverButton.style.visibility = "hidden";
	goHome();
	disconnect("game over");
}

function gameOver(winnerId, winnerName) {
	winnerInfo.innerHTML = "Winner: " + winnerName;
	if (winnerId === id) {
		gameOverText.innerHTML = "YOU WON!";
		gameOverButton.classList.remove("loserEffect");
		gameOverButton.classList.add("winnerEffect");
	} else {
		gameOverText.innerHTML = "GAME OVER!";
		gameOverButton.classList.remove("winnerEffect");
		gameOverButton.classList.add("loserEffect");
	}
	gameOverButton.style.visibility = "visible";
	console.log(winnerName + " won!");
}

function unoActivated(idOfActivator) {
	//Shows the uno button on the screen
	unoButton.style.visibility = "visible";
	console.log(players[idOfActivator].username + " activated the uno button");
}
function unoActivatedResponse(UNOerId, success) {
	unoButton.style.visibility = "hidden";
	console.log("player responded to the activation");
	if (UNOerId !== id) {
		return;
	}
	if (!success) {
		sendDrawRequest(2, "UNO");
	} else if (noPlayableCards()) {
		setTimeout(() => finishTurn("UNOed"), 1000);
	} else {
		doneButton.style.visibility = "visible";
	}
}

function changePileColor(color = currentColor ?? Color.BLACK) {
	pileBackground.style.backgroundColor = color.toHex();
}

function sendDrawRequest(number = null, reason) {
	console.log("sending draw request");
	if (reason === "idle") {
		if (++idleCount > 3) {
			disconnect("idled too long");
			goHome();
			return;
		}
	}
	send({
		id: id,
		type: "drawRequest",
		number: number,
		reason: reason
	});
}

function previousPlayer(index = id) {
	let prevIndex = index - turnIncrement;
	if (prevIndex < 0) {
		prevIndex += players.length;
	} else if (prevIndex >= players.length) {
		prevIndex -= players.length;
	}
	return players[prevIndex];
}