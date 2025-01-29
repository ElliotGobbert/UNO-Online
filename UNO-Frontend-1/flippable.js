class Flippable {
	static flipOptions = {
		easing: "ease",
		fill: "forwards",
		duration: 500,
	};
	flipped = false;

	/**
	 * Creates a new flippable card with its back facing outwards initially.
	 * @param {string} color
	 * @param {number} value
	 * @param {Side} side
	 */
	constructor(color, value, side) {
		this.side = side;
		this.color = color instanceof Color ? color : Color.of(color);
		this.value = parseInt(value);
		this.angle = side.angle;
		this.holder = document.createElement("div");
		this.holder.className = "flip-card";

		this.front = document.createElement("div");
		this.front.className = "flip-card-front";
		this.front.appendChild(new Card(color, value, false).element);

		this.back = document.createElement("div");
		this.back.className = "flip-card-back";
		this.back.appendChild(Card.back().element);

		// this.element = document.createElement("div");
		// this.element.className = "flip-card-inner";
		// this.element.appendChild(back);
		// this.element.appendChild(front);

		// this.holder.appendChild(this.element);
		this.holder.appendChild(this.back);
		this.holder.appendChild(this.front);
		// this.holder.style.transform = "rotate(" + this.angle + "deg)";
		this.holder.ondragstart = (event) => {
			// hides the drag preview
			event.dataTransfer.setDragImage(BLANK_IMG, 0, 0);
		};
	}

	topElement() {
		return this.holder;
	}

	/**
	 * Flips this Flippable card onto the stack while rotating it.
	 * @param {number} angle
	 */
	flipAndRotate(angle) {
		const destination = convertToPixels(
			stackLocation.top - 3,
			stackLocation.left + 13
		);
		// const deltaY = destination.top - this.holder.offsetTop + "px";
		// const deltaX = destination.left - this.holder.offsetLeft + "px";
		// const translate = "translate(" + deltaX + ", " + deltaY + ")";
		const rotations = "rotateY(180deg)" + "rotate(" + angle + "deg)";
		const keyframes = [
			{
				top: destination.top + "px", 
				left: destination.left + "px",
				transform: rotations
			}
		];
		this.holder.animate(keyframes, Flippable.flipOptions);
		this.angle = angle;
		setTimeout(() => {
			pushOntoStack(this);
			// document.getElementById("pileBackground").style.backgroundColor =
			// 	this.color.toHex();
		}, Flippable.flipOptions.duration);
		this.flipped = true;
	}

	/**
	 * Animates this card to the specified location over a specified period.
	 * @param {string | number} top - The new distance from the window's top.
	 * @param {string | number} left - The new distance from the window's left.
	 * @param {number} duration
	 * @param {number} angle
	 * @param {boolean} flip
	 */
	animateTo(top, left, duration, angle = this.angle, flip = this.flipped) {
		const options = {
			easing: "ease",
			fill: "forwards",
			duration: duration,
		};
		const destination = convertToPixels(top, left);
		let rotation = "rotate(" + angle + "deg)";
		if (duration === 0) {
			rotation =
				"rotateY(" + (flip ? 180 : 0) + "deg)" + rotation;
		}
		const keyframes = [
			{
				top: destination.top + "px", 
				left: destination.left + "px",
				transform: rotation
			}
		];
		this.holder.animate(keyframes, options);
		this.angle = angle;
	}

	setLocation(top, left) {
		const angle = this.holder.style.transform === ""
			? 0
			: parseInt(this.holder.style.transform.substring(7));
		this.animateTo(
			top, 
			left, 
			0, 
			angle
		);
	}

	toString() {
		return this.color.name + " " + this.value.toString();
	}

	static randomWithSide(side) {
		const value = Math.floor(Math.random() * 15);
		const isBlack = value === PLUS_FOUR || value === COLOR_CHANGE;
		const color = isBlack ? Color.BLACK : Color.random();
		return new Flippable(color, value, side);
	}
}
