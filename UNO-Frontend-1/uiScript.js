const sideUsernames = new Map([
	[Side.BOTTOM, username0],
	[Side.RIGHT, username1],
	[Side.TOP, username2],
	[Side.LEFT, username3]
]);

// function makeRandomPersonGlow() {
// 	let randomNum = Math.floor(Math.random() * 4);
// 	toggleGlow(Side.random());
// }
// glowButton.addEventListener("click", makeRandomPersonGlow);

function makeGlow(side) {
	sideUsernames.get(side).classList.add("glowingEffect");
}

function disableGlow(side) {
	sideUsernames.get(side).classList.remove("glowingEffect");
}

//Flips the arrows the opposite direction, should be used when a reverse is played
var alreadyRotated = false;
const flipArrowOptions = {
	duration: 500,
	iterations: 1,
	fill: "forwards",
};
function flipArrows() {
	if (!alreadyRotated) {
		arrow1.animate(
			[{ transform: "rotate(270deg) scaleX(-1)" }],
			flipArrowOptions,
		);
		arrow2.animate(
			[{ transform: "rotate(90deg) scaleY(-1)" }],
			flipArrowOptions,
		);
		arrow3.animate(
			[{ transform: "rotate(270deg) scaleX(-1)" }],
			flipArrowOptions,
		);
		arrow4.animate(
			[{ transform: "rotate(90deg) scaleY(-1)" }],
			flipArrowOptions,
		);
	} else {
		arrow1.animate(
			[{ transform: "rotate(0deg) scaleX(1)" }],
			flipArrowOptions,
		);
		arrow2.animate(
			[{ transform: "rotate(0deg) scaleY(1)" }],
			flipArrowOptions,
		);
		arrow3.animate(
			[{ transform: "rotate(0deg) scaleX(1)" }],
			flipArrowOptions,
		);
		arrow4.animate(
			[{ transform: "rotate(0deg) scaleY(1)" }],
			flipArrowOptions,
		);
	}
	alreadyRotated = !alreadyRotated;
}
// flipArrowsButton.addEventListener("click", flipArrows);
function activateUnoButton() {
	if (unoButton.style.visibility === "visible") {
		send({
			type: "unoActivatedResponse",
			id: id
		});
		unoButton.style.visibility = "hidden";
	} else {
		send({
			type: "unoActivated",
			id: id
		});
		doneButton.style.visibility = "hidden";
		unoButton.style.visibility = "visible";
	}
}
// unoPopUpButton.addEventListener("click", activateUnoButton);

unoButton.addEventListener("click", activateUnoButton);

const colorButtons = new Map([
	[Color.RED, color1],
	[Color.BLUE, color2],
	[Color.YELLOW, color3],
	[Color.GREEN, color4]
]);

let alreadyActivated = false;
function activateColorButtons(color) {
	if (!alreadyActivated) {
		color1.style.top = "10%";
		color1.style.left = "10%";

		color2.style.top = "10%";
		color2.style.left = "50%";

		color3.style.top = "50%";
		color3.style.left = "10%";

		color4.style.top = "50%";
		color4.style.left = "50%";
	} else {
		currentColor = color;
		send({
			type: "colorChange",
			info: color.name
		});
		for (const colorButton of colorButtons.values()) {
			colorButton.style.top = "120%";
			colorButton.style.left = "120%";
		}
		if (prevCard.value === COLOR_CHANGE) {
			prevCard.value = null;
		}
		if (!isTurn) {
			startTurn();
		} else if (noPlayableCards()) {
			finishTurn("color changed and no playable cards left");
		}
	}
	alreadyActivated = !alreadyActivated;
}
// showColorButtonsButton.addEventListener("click", activateColorButtons);

for (const [color, button] of colorButtons) {
	button.onclick = () => {
		activateColorButtons(color);
		pileBackground.style.backgroundColor = color.toHex();
	};
}

function pollFunc(fn, timeout, interval = 1000) {
	const startTime = Date.now();

	(function p() {
		fn();
		if ((Date.now() - startTime) <= timeout) {
			setTimeout(p, interval);
		}
	})();
}

pollFunc(startingPageAnimations, 40000, Math.floor(Math.random() * 1000) + 500);
function startingPageAnimations() {
	let randomNum = Math.floor(Math.random() * 5);
	const newCard = Card.random().element;
	const slideCardOptions = {
		duration: Math.floor(Math.random() * 5000) + 3000,
		iterations: Infinity,
	};
	newCard.style.position = "absolute";
	newCard.style.left = (Math.floor(Math.random() * 100)) + "%";
	newCard.style.top = "-200px";
	newCard.style.zIndex = "-1000";
	newCard.style.opacity = ".8";
	if (randomNum === 0) {
		newCard.animate(
			[{ transform: "translateY(0px)" },
			{ transform: "translateY(" + (window.innerHeight + 400) + "px) rotate(" + (Math.floor(Math.random() * 720) - 360) + "deg)" }],
			slideCardOptions,
		);
	} else if (randomNum === 1) {
		newCard.style.rotation = "270deg";
		newCard.style.top = (Math.floor(Math.random() * 100)) + "%";
		newCard.style.left = "-200px"; 
		newCard.animate(
			[{ transform: "translateX(0px) rotate(270deg)" },
			{ transform: "translateX(" + (window.innerWidth + 400) + "px) rotate(" + (Math.floor(Math.random() * 720) - 360) + "deg)" }],
			slideCardOptions,
		);
	}else if (randomNum === 3) {
		newCard.style.rotation = "90deg";
		newCard.style.top = (Math.floor(Math.random() * 100)) + "%";
		newCard.style.left = ( window.innerWidth + 200) + "px";
		newCard.animate(
			[{ transform: "translateX(0px) rotate(90deg)" },
			{ transform: "translateX(" + (-1 * (window.innerWidth + 400)) + "px) rotate(" + (Math.floor(Math.random() * 720) - 360) + "deg)" }],
			slideCardOptions,
		);
	} else if (randomNum === 4) {
		newCard.style.left = (Math.floor(Math.random() * 100)) + "%";
		newCard.style.top = ( window.innerHeight + 200) + "px"; 
		newCard.animate(
			[{ transform: "translateY(0px) rotate(0deg)" },
			{ transform: "translateY(" + (-1 * (window.innerHeight + 400)) + "px) rotate(" + (Math.floor(Math.random() * 720) - 360) + "deg)" }],
			slideCardOptions,
		);
	}
	startingPage.appendChild(newCard);
}