// const element = document.getElementById("cardExample");
// element.remove();//Works well, removes the <div> and any of the children in that container, so we only have to call this once per card
const cardWidth = 50;
const handOfCards = [];
const rightOpponent = [];
const leftOpponent = [];
const topOpponent = [];
var stackZIndex = -9999;

//idk if this method should even be here 
function playCardSound() {
    let snd = new Audio("audio/cardsoundeffect.mp3");
    snd.volume = 0.0;
    snd.load();
	if (audio) {//If audio is allowed -->
		snd.volume = 0.5;
	}
    snd.play();
}

class Side {
    static TOP = new Side("top");
    static BOTTOM = new Side("bottom");
    static LEFT = new Side("left");
    static RIGHT = new Side("right");

    constructor(name) {
        this.name = name;
        this.hand = this.#whichHand();
        this.angle = this.#angleValue();
    }

    coordArray(cardNum = this.hand.length) {
        switch (this.name) {
            case "left":
            case "right":
                return yPositions(cardNum);
            default:
                return xPositions(cardNum);
        }
    }

    topAtIndex(index, numberOfCards = this.hand.length) {
        switch (this.name) {
            case "top":
            case "bottom":
                return this.constantCoord();
            default:
                return this.coordArray(numberOfCards)[index];
        }
    }

    leftAtIndex(index, numberOfCards = this.hand.length) {
        switch (this.name) {
            case "top":
            case "bottom":
                return this.coordArray(numberOfCards)[index];
            default:
                return this.constantCoord();
        }
    }

    newCard(color, value) {
        switch (this.name) {
            case "bottom":
                return Card.of(color, value);
            default:
                return new Flippable(color, value, this);
        }
    }

    randomCard() {
        let value = Math.floor(Math.random() * 15);
        const isBlack = value === PLUS_FOUR || value === COLOR_CHANGE;
        const color = isBlack ? Color.BLACK : Color.random();
        return this.newCard(color, value, this);
    }

    static random() {
        const rng = Math.random();
        if (rng > 0.75) {
            return Side.TOP;
        } else if (rng > 0.5) {
            return Side.LEFT;
        } else if (rng > 0.25) {
            return Side.RIGHT;
        } else {
            return Side.BOTTOM;
        }
    }

    constantCoord() {
        switch (this.name) {
            case "top":
                return 30;
            case "left":
                return 50;
            case "right":
                return window.innerWidth - 100;
            default:
                return window.innerHeight - 130;
        }
    }

    #angleValue() {
        switch (this.name) {
            case "top":
                return 180;
            case "left":
                return 90;
            case "right":
                return 270;
            default:
                return 0;
        }
    }

    #whichHand() {
        switch (this.name) {
            case "top":
                return topOpponent;
            case "left":
                return leftOpponent;
            case "right":
                return rightOpponent;
            default:
                return handOfCards;
        }
    }
}

Object.freeze(Side);

const deck = document.createElement("div");
deck.style.zIndex = -999;
const stack = [];

function createGameUI() {//Activates all the UI elements when the start button is clicked, also hides all the main menu elements, and shows the gamePage elements
    startingPage.style.display = "none";
    gamePage.style.display = "block";

    deck.style.position = "absolute";
    deck.style.top = "20%";
    deck.style.left = "20%";
    setDeckCardPositions(Card.back().topElement(), 0);
    setDeckCardPositions(Card.back().topElement(), -5);
    setDeckCardPositions(Card.back().topElement(), -10);

    // testing
    // for (let i = 0; i < 7; i++) {
    //     handOfCards.push(Card.random());
    // }

    // //testing
    // for (let i = 0; i < 7; i++) {
    //     rightOpponent.push(Flippable.randomWithSide(Side.RIGHT));
    // }
    // // repositionCards(rightOpponent, window.innerWidth - 100, false);

    // for (let i = 0; i < 7; i++) {
    //     leftOpponent.push(Flippable.randomWithSide(Side.LEFT));
    // }
    // // repositionCards(leftOpponent, 50, false);

    // for (let i = 0; i < 7; i++) {
    //     topOpponent.push(Flippable.randomWithSide(Side.TOP));
    // }
    // repositionCards(topOpponent, 30, true);

    for (const side of sides) {
        side.hand.forEach(addToPage);
    }
    stack.forEach(addToPage);
    recenterAllHands();
    // window.onresize = () => handleResize();
}

function goHome() {
    gamePage.style.display = "none";
    startingPage.style.display = "block";
    prevCard = null;
    currentColor = null;
    alreadyActivated = false;
    for (const colorButton of colorButtons.values()) {
        colorButton.style.top = "120%";
        colorButton.style.left = "120%";
    }
    alreadyRotated = true;
    flipArrows();
    for (const side of sides) {
        disableGlow(side);
        side.hand.splice(0, side.hand.length)
                 .forEach(card => card.topElement().remove());
        sideUsernames.get(side).style.visibility = "hidden";
    }
    deck.replaceChildren();
    stack.splice(0, stack.length).forEach(card => card.topElement().remove());
    changePileColor(Color.BLACK);
    players.splice(0, players.length);
    music?.pause();
    music = null;
}

startButton.onclick = () => send({ type: "startRequest", id: id });

let topDeckCardElement = null;
function setDeckCardPositions(card, leftPix) {
    card.style.position = "absolute";
    card.style.top = "0px";
    card.style.left = leftPix + "px";
    deck.appendChild(card);
    if (leftPix === -10) {
        topDeckCardElement = card;
    }
}
document.body.append(deck);


// repositionCards(handOfCards, window.innerHeight - 130, true);

// function addCardToStackAnimated() {
//     // addCardAnimatedAtIndex(leftOpponent, Math.floor(leftOpponent.length / 2), 90, 50, false);
//     // addCardAnimatedAtIndex(rightOpponent, Math.floor(rightOpponent.length / 2), 270, window.innerWidth - 100, false);
//     const randomNum = Math.floor(Math.random() * 3 + 1);
//     if (randomNum === 1) {
//         addCardToStackFrom(Side.LEFT);
//     } else if (randomNum === 2) {
//         addCardToStackFrom(Side.RIGHT);
//     } else if (randomNum === 3) {
//         addCardToStackFrom(Side.TOP);
//     }
//     // addCardToStackFrom(Side.LEFT);
// }
// flipButton.onclick = addCardToStackAnimated;

function addCardToStackFrom(
    side = Side.BOTTOM,
    index = Math.floor(side.hand.length / 2),
) {
    const hand = side.hand;
    if (hand.length === 0) {
        return;
    }
    playCardSound();
    const stackCard = hand[index];
    hand.splice(index, 1);
    stackCard.flipAndRotate(Math.random() * 360);
    recenterHand(side);
}

// function addCardAnimated() {
//     // addCardAnimatedAtIndex(leftOpponent, Math.floor(leftOpponent.length / 2), 90, 50, false);
//     // addCardAnimatedAtIndex(rightOpponent, Math.floor(rightOpponent.length / 2), 270, window.innerWidth - 100, false);
//     const randomNum = Math.floor(Math.random() * (3 - 1 + 1) + 1);
//     if (randomNum === 1) {
//         addCardTo(Side.LEFT);
//     } else if (randomNum === 2) {
//         addCardTo(Side.RIGHT);
//     } else if (randomNum === 3) {
//         addCardTo(Side.TOP);
//     }
//     // addCardAnimatedAtIndex(Side.BOTTOM, Math.floor(handOfCards.length / 2), Card.random());
// }
// addButton.onclick = addCardAnimated;

function addCardTo(
    side = Side.BOTTOM,
    card = null,
    index = Math.floor(side.hand.length / 2),
) {
    const hand = side.hand;
    const newCard = card ?? side.randomCard();
    newCard.setLocation(deck.y(), deck.x());
    addToPage(newCard);
    hand.splice(index, 0, newCard);
    recenterHand(side, 1000, newCard);
}

function recenterHand(side = Side.BOTTOM, duration = 500, newCard) {
    const hand = side.hand;
    let zValue = -1 * hand.length;
    for (let i = 0; i < hand.length; i++) {
        hand[i].topElement().style.zIndex = zValue++;
        if (hand[i] === newCard && hand[i] instanceof Flippable) {
            hand[i].animateTo(
                side.topAtIndex(i),
                side.leftAtIndex(i),
                duration,
                side.angle
            );
        } else {
            hand[i].animateTo(side.topAtIndex(i), side.leftAtIndex(i), duration);
        }
    }
    const hovering = hand.find((card) => card.hovering);
    if (hovering === undefined) {
        return;
    }
    hovering.holder.onmouseenter = null;
    hovering.holder.dispatchEvent(new MouseEvent("mouseleave"));
    setTimeout(
        () => (hovering.holder.onmouseenter = () => hovering.hover()),
        200,
    );
}

function xPositions(numOfCards) {
    const mid = window.innerWidth / 2;
    const left = mid - cardWidth * (numOfCards / 2);
    const xPositions = new Array(numOfCards);
    for (let i = 0; i < numOfCards; i++) {
        xPositions[i] = left + i * cardWidth;
    }
    return xPositions;
}

function sortAndReposition(comparator) {
    for (let i = 0; i < handOfCards.length / 2; i++) {
        setTimeout(playCardSound, 10);
    }
    handOfCards.sort(comparator);
    recenterHand(Side.BOTTOM);
}

sortButton.onclick = () => sortAndReposition(byColorThenValue);

function recenterAllHands(delay = 0) {
    sides.forEach((side) => recenterHand(side, delay));
}

function yPositions(numOfCards) {
    const mid = window.innerHeight / 2;
    const left = mid - cardWidth * (numOfCards / 2);
    const yPositions = new Array(numOfCards);
    for (let i = 0; i < numOfCards; i++) {
        yPositions[i] = left + i * cardWidth;
    }
    return yPositions;
}

function pushOntoStack(card) {
    card.topElement().style.zIndex = stackZIndex++;
    stack.push(card);
    //change color of platform (use color.toHex())
    if (stack.length > 10) {
        stack.shift().topElement().remove();
    }
}

function debounce(callback, delay) {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, delay);
    };
}

function handleResize(delay = 0) {
    // console.log("handling resize")
    stackLocation = {
        top: window.innerHeight * 0.35 + 57,
        left: window.innerWidth * 0.43 + 67,
    };
    for (const card of stack) {
        // console.log("handling resize")
        card.animateTo(stackLocation.top, stackLocation.left, delay);
        // console.log(stackLocation.top + ", " + stackLocation.left);
    }
    recenterAllHands(delay);
}

window.onresize = () => handleResize();