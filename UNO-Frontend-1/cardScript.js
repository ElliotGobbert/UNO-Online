var stackLocation = {
	top: (window.innerHeight * .35) + 57,
	left: (window.innerWidth * .43) + 67,
};

Element.prototype.x = function() {
  return this.getBoundingClientRect().left;
}

Element.prototype.y = function() {
  return this.getBoundingClientRect().top;
}

// Will be updated dynamically based on screen resize
class Color {
  static RED = new Color("red");
  static BLUE = new Color("blue");
  static GREEN = new Color("green");
  static YELLOW = new Color("yellow");
  static BLACK = new Color("black");

  constructor(name) {
    this.name = name;
  }

  static of(name) {
    switch (name) {
      case "red":
        return Color.RED;
      case "blue":
        return Color.BLUE;
      case "green":
        return Color.GREEN;
      case "yellow":
        return Color.YELLOW;
      case "black":
        return Color.BLACK;
    }
  }

  /**
   * @returns A random non-black color.
   */
  static random() {
    const rng = Math.random();
    if (rng > 0.75) {
      return Color.RED;
    } else if (rng > 0.5) {
      return Color.BLUE;
    } else if (rng > 0.25) {
      return Color.GREEN;
    } else {
      return Color.YELLOW;
    }
  }

  /**
   * A Comparator<Color>, basically, for those familiar with Java.
   * @param {string} color1
   * @param {string} color2
   * @returns {number} -1 if color1 goes before color2, 0 if they're equal,
   * and 1 if color comes after color2.
   */
  static compare(color1, color2) {
    if (color1 === color2) {
      return 0;
    }
    switch (color1) {
      case Color.RED:
        return -1;
      case Color.GREEN:
        return color2 === Color.RED ? 1 : -1;
      case Color.YELLOW:
        return color2 === Color.RED || color2 === Color.GREEN ? 1 : -1;
      case Color.BLUE:
        return color2 === Color.BLACK ? -1 : 1;
      default:
        return 1;
    }
  }

  /**
   * @returns {Set} The set of all possible card colors.
   */
  static set() {
    return new Set([
      Color.RED,
      Color.BLUE,
      Color.GREEN,
      Color.YELLOW,
      Color.BLACK,
    ]);
  }

  toHex() {
    switch(this) {
      case Color.RED:
        return "#c30a01";
      case Color.YELLOW:
        return "#fcdb01";
      case Color.GREEN:
        return "#0cab0c";
      case Color.BLUE:
        return "#294fda";
      default:
        return "#ffffff";
    }
  }

  // Generally you should just use color.name, but this exists just in case 
  // because toString() is fairly universal
  toString() {
    return this.name;
  }
}
// Declares everything inside Color final, basically
Object.freeze(Color);


const CARD_BACKSIDE = -1;
const PLUS_TWO = 10;
const SKIP = 11; 
const REVERSE = 12; 
const PLUS_FOUR = 13;
const COLOR_CHANGE = 14;

var mouseTop;
var mouseLeft;

function getMousePosition(event) {
  mouseLeft = event.clientX;
  mouseTop = event.clientY;
}

const hover = [{ transform: "translateY(-20px)" }];
const unhover = [{ transform: "translateY(0px)" }];
const hoverOptions = {
  easing: "ease",
  fill: "forwards",
  duration: 150,
};

document.ondragover = getMousePosition;

const BLANK_IMG = new Image(1, 1);
BLANK_IMG.src = "images/blank.png";

class Card {
  /**
   * @param {string} color
   * @param {number} value
   * @param {boolean} interactable
   * @returns A new card containing a graphical representation of itself.
   * Said graphical representation may or may not be interactable.
   */
  constructor(color, value, interactable) {
    if (value < CARD_BACKSIDE || value > COLOR_CHANGE) {
      throw "Value must be between " + CARD_BACKSIDE + " and " + COLOR_CHANGE;
    }
    this.color = color instanceof Color ? color : Color.of(color);
    this.value = parseInt(value);
    this.angle = 0;
    this.element = this.#createElement();
    if (!interactable) {
      this.element.ondragstart = (event) => {
        // hides the drag preview
        event.dataTransfer.setDragImage(BLANK_IMG, 0, 0);
      };
      // Returns early, since all of the following code
      // implements interactability
      return;
    }

    this.holder = this.#createHolder();
    this.mouseOffset = { top: 0, left: 0 };
    this.stopDragging = null;
    this.hovering = false;

    this.holder.onmousedown = (event) => getMousePosition(event);
    this.holder.ondragstart = (event) => {
      event.dataTransfer.setDragImage(BLANK_IMG, 0, 0);
      this.mouseOffset.top = mouseTop - this.holder.y();
      this.mouseOffset.left = mouseLeft - this.holder.x();
      this.startDragging();
    };
    this.holder.onmouseenter = () => this.hover();
    this.holder.onmouseleave = () => this.unhover();
    this.holder.ondragend = () => this.stopDragging();
    //set the text or add image representation
  }

  /**
   * @param {string} color
   * @param {number} value
   * @returns {Card} A new interactable card with the specified color/value.
   */
  static of(color, value) {
    return new Card(color, value, true);
  }

  /**
   * @returns {Card} A new non-interactable card backside.
   */
  static back() {
    return new Card(Color.BLACK, CARD_BACKSIDE, false);
  }

  topElement() {
    return this.holder ?? this.element;
  }

  /**
   * @returns {HTMLDivElement} The element that holds this card's internal
   * card element.
   */
  #createHolder() {
    const holder = document.createElement("div");
    holder.className = "cardHolder";
    holder.appendChild(this.element);
    return holder;
  }

  /**
   * @returns {HTMLDivElement} The internal card element contained by this
   * card's holder.
   */
  #createElement() {
    // console.log("val: " + this.value);
    // console.log("col: " + this.color);
    const card = document.createElement("div");
    card.className = "card";

    const edge = document.createElement("img");
    edge.className = "cardEdge";
    edge.src = "images/cardEdge.png";

    const cardImg = document.createElement("img");
    cardImg.className = "cardImage";
    if (this.value === CARD_BACKSIDE) {
      cardImg.src = "images/backOfCard.png";
      card.appendChild(cardImg);
      card.appendChild(edge);
      return card;
    }

    cardImg.src = "images/" + this.color.name + "Card.png";

    card.appendChild(cardImg);
    card.appendChild(this.#createCorner(true));
    card.appendChild(this.#createCorner(false));
    card.appendChild(this.#createHeader());
    card.appendChild(edge);
    return card;
  }

  /**
   * @returns The header element, based on this card's value.
   */
  #createHeader() {
    if (this.value < 10) {
      const header = document.createElement("h1");
      header.className = "cardText";
      header.innerHTML = this.value.toString();
      return header;
    }
    const header = document.createElement("img");
    header.className = "cardSymbol";
    header.src = this.#getSrc();
    return header;
  }

  /**
   * @param {boolean} isUpperLeft
   * @returns The corner element, based on this card's value.
   */
  #createCorner(isUpperLeft) {
    if (this.value < 11 || this.value === PLUS_FOUR) {
      const output = document.createElement("h1");
      output.className = isUpperLeft
        ? "cardUpperLeftNumber"
        : "cardBottomRightNumber";
      switch (this.value) {
        case PLUS_FOUR:
          output.innerHTML = "+4";
          break;
        case PLUS_TWO:
          output.innerHTML = "+2";
          break;
        default:
          output.innerHTML = this.value.toString();
          break;
      }
      return output;
    }
    const output = document.createElement("img");
    const cardType = this.value === COLOR_CHANGE ? "wildCard" : "card";
    output.className =
      cardType + (isUpperLeft ? "UpperLeft" : "BottomRight") + "Symbol";
    output.src = this.#getSrc();
    return output;
  }

  /**
   * @returns {string} The filename of the image source based on this card's
   * value.
   */
  #getSrc() {
    switch (this.value) {
      case PLUS_FOUR:
        return "images/plusFourSymbol.png";
      case PLUS_TWO:
        return "images/plusTwoSymbol.png";
      case SKIP:
        return "images/skipSymbol.png";
      case REVERSE:
        return "images/reverseSymbol.png";
      case COLOR_CHANGE:
        return "images/colorChangeSymbol.png";
      default:
        return "";
    }
  }

  toString() {
    return this.color.name + " " + this.value.toString();
  }

  /**
   * Repositions the card.
   * @param {string | number} top - The new distance from the window's top.
   * @param {string | number} left - The new distance from the window's left.
   * Defaults to pixels if left out.
   * @example
   * setLocation(30, 30); // top gets set to 30px and left gets set to 30px
   * setLocation(0, 50, "%"); // top gets set to 0% and left to 50%
   * setLocation("20%", "40%"); // top gets set to 20% and left to 40%
   */
  setLocation(top, left) {
    // const target = this.holder ?? this.element;
    // const destination = convertToPixels(top, left);
    // target.style.top = destination.top + "px";
    // target.style.left = destination.left + "px";
    this.animateTo(top, left, 0);
  }

  /**
   * Animates this card to the specified location over a specified period.
   * @param {string | number} top - The new distance from the window's top.
   * @param {string | number} left - The new distance from the window's left.
   * @param {number} duration
   */
  animateTo(top, left, duration, angle = this.angle) {
    const target = this.holder ?? this.element;
    const options = {
      easing: "ease",
      fill: "forwards",
      duration: duration,
    };
    const destination = convertToPixels(top, left);
    const rotation = "rotate(" + angle + "deg)";
    const keyframes = [
      {
        top: destination.top + "px", 
        left: destination.left + "px",
        transform: rotation
      }
    ];
    target.animate(keyframes, options);
    this.angle = angle;
  }

  /**
   * Moves this card according to the cursor's position
   */
  drag() {
    this.animateTo(
      mouseTop - this.mouseOffset.top,
      mouseLeft - this.mouseOffset.left,
      0,
    );
    // this.setLocation(mouseTop - this.mouseOffset.top, mouseLeft - this.mouseOffset.left);
    // console.log(this.mouseOffset.top);
  }

  /**
   * @returns {boolean} whether this card overlaps with the pile
   * maybe works?
   */
  inPile() {
    const rect = pile.getBoundingClientRect();
    const target = (this.holder ?? this.element).getBoundingClientRect();

    const leftInside = target.left < rect.right && target.left > rect.left;
    const rightInside = target.right < rect.right && target.right > rect.left;
    const topInside = target.top < rect.bottom && target.top > rect.top;
    const bottomInside = 
      target.bottom < rect.bottom && target.bottom > rect.top;
    
    return (leftInside || rightInside) && (topInside || bottomInside);
  }

  isPlayable() {
    // const header = this.toString() + " isn't playable because: "
    // You can't place cards if it's not your turn.
    if (!isTurn) {
      return false;
    }
    // If this player has already placed a card or the previous player placed a
    // +2 or +4, they can only "stack" cards with the same value.
    if (cardsPlaced > 0 
        || (prevCard.value === PLUS_TWO || prevCard.value === PLUS_FOUR)) 
    {
      // if (this.value !== prevCard.value) {
      //   console.log(header + this.value + " != " + prevCard.value);
      //   return false;
      // } else {
      //   console.log(this.toString() + " can be played because values match");
      //   return true;
      // }
      return this.value === prevCard.value;
    }
    // Otherwise, they can place any card with the same color or value.
    const colorOK = this.color === currentColor || this.color === Color.BLACK;
    return colorOK || this.value === prevCard.value;
    // if (this.color !== currentColor && this.color !== Color.BLACK) {
    //   if (this.value !== prevCard.value) {
    //     console.log(header + this.color.name + " != " + currentColor.name + " and " + this.value + " != " + (prevCard.value ?? this.value));
    //     return false;
    //   } else {
    //     console.log(this.toString() + " can be played because values/colors match and 0 cards were played");
    //     return true;
    //   }
    // } else {
    //   return true;
    // }
  }
  
  /**
   * Starts a repeating task that repositions the card to the cursor's
   * position every 17 ms. Disallows unhovering.
   * Makes stopDragging actually do something.
   */
  startDragging() {
    // this.holder.parentNode.appendChild(this.holder);
    const otherCards = handOfCards.filter(card => card !== this);
    for (const card of otherCards) {
      if (card.hovering) {
        card.unhover();
      }
      card.holder.onmouseenter = null;
      card.holder.onmouseleave = null;
    }
    const oldZIndex = this.holder.style.zIndex;
    this.holder.style.zIndex = "999";
    this.holder.onmouseleave = null;
    const interval = setInterval(() => this.drag(), 17);
    /**
     * Reallows unhovering and stops the repeating task that repositions
     * the card to the cursor's position.
     * If the card overlaps with the pile, removes this card from the
     * user's hand and moves it to the pile.
     * Otherwise, inserts the card back into the user's hand based on its
     * position when the drag ended.
     * Makes stopDragging to nothing afterwards.
     */
    this.stopDragging = () => {
      this.holder.onmouseleave = () => this.unhover();
      clearInterval(interval);
      for (const card of otherCards) {
        card.holder.onmouseenter = () => card.hover();
        card.holder.onmouseleave = () => card.unhover();
      }
      if (this.inPile() && this.isPlayable()) {
        idleCount = Math.max(0, idleCount - 1);
        send({
            type: "placedCard",
            id: id,
            info: this.toString()
        });
        handOfCards.splice(handOfCards.indexOf(this), 1);
        pushOntoStack(this);
        playCardSound();
        this.angle = Math.floor(Math.random() * 40) - 20;
        this.holder.style.transform = 
            "rotate(" + this.angle + "deg)";
        document.getElementById("pileBackground").style.backgroundColor =
          this.color.toHex();
        this.disableInteraction();
        this.animateTo(stackLocation.top, stackLocation.left, 300);
        recenterHand(Side.BOTTOM);
        cardsPlaced++;
        prevCard = { color: this.color.name, value: this.value };
        if (handOfCards.length === 1) {
            pauseTimer();
            activateUnoButton();
        } else if (this.value === PLUS_FOUR || this.value == COLOR_CHANGE) {
            updateTimer(countdown + 5);
            activateColorButtons();
        } else if (noPlayableCards()) {
            finishTurn("no playable cards in stopDragging");
        } else {
            updateTimer(countdown + 5);
        }
      } else {
        this.holder.style.zIndex = oldZIndex;
        sortAndReposition(byPosition);
      }
      this.stopDragging = null;
    };
  }

  /**
   * Raises the card up by 20 pixels (hovering)
   */
  hover() {
    if (this.hovering) {
      return;
    }
    this.hovering = true;
    this.element.animate(hover, hoverOptions);
  }

  /**
   * Drops the card back down to its usual position
   */
  unhover() {
    if (!this.hovering) {
      return;
    }
    this.element.animate(unhover, hoverOptions);
    this.hovering = false;
  }

  /**
   * Removes all mouse-related event listeners from this card's holder.
   */
  disableInteraction() {
    this.holder.onmouseenter = null;
    this.holder.onmouseleave = null;
    this.holder.onmousedown = null;
    this.holder.ondragstart = (event) => {
      // hides the drag preview
      event.dataTransfer.setDragImage(BLANK_IMG, 0, 0);
    };
    this.holder.ondragend = null;
  }

  static random() {
    const value = Math.floor(Math.random() * 15);
    const isBlack = value === PLUS_FOUR || value === COLOR_CHANGE;
    return new Card(isBlack ? Color.BLACK : Color.random(), value, false);
  }
}

function byPosition(card1, card2) {
  const x1 = (card1.holder ?? card1.element).x();
  const x2 = (card2.holder ?? card2.element).x();
  if (x1 === x2) {
    return 0;
  } else {
    return x1 > x2 ? 1 : -1;
  }
}

function addToPage(card) {
  document.body.append(card.topElement());
}

function byColorThenValue(card1, card2) {
  const colorResult = Color.compare(card1.color, card2.color);
  if (colorResult != 0) {
    return colorResult;
  }
  if (card1.value === card2.value) {
    return 0;
  }
  return card1.value < card2.value ? -1 : 1;
}

function convertToPixels(top, left) {
  return {
    top: top.includes?.("%") 
      ? Math.floor((parseInt(top) / 100) * window.innerHeight)
      : parseInt(top),
    left: left.includes?.("%") 
      ? Math.floor((parseInt(left) / 100) * window.innerHeight)
      : parseInt(left)
  };
}