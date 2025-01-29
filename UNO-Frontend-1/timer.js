const STARTING_TIME = 15;
const TIMER_KEYFRAMES = [ 
	{ strokeDashoffset: "0px" },
	{ strokeDashoffset: "113px" }
];
const DEFAULT_TIMER_OPTIONS = {
	fill: "forwards",
	duration: STARTING_TIME * 1000 - 100,
};

var countdown = STARTING_TIME;
var timerInterval = null;

timerNumber.textContent = countdown;

function startTimer() {
	countdown = STARTING_TIME;
	timerNumber.textContent = countdown;
	timer.style.visibility = "visible";
	createTimerInterval();
	timerCircle.animate(TIMER_KEYFRAMES, DEFAULT_TIMER_OPTIONS);
}

function stopTimer() {	
	timer.style.visibility = "hidden";
	clearInterval(timerInterval);
	timerInterval = null;
	countdown = STARTING_TIME;
	timerNumber.textContent = countdown;
	timerCircle.getAnimations().forEach(animation => animation.cancel());
}

function updateTimer(newCountdown) {
	countdown = newCountdown;
	timerNumber.textContent = countdown;
	const options = { 
		fill: "forwards",
		duration: newCountdown * 1000 - 100
	};
	timerCircle.animate(TIMER_KEYFRAMES, options);
}

function pauseTimer() {
	clearInterval(timerInterval);
	timerInterval = null;
	timerCircle.getAnimations().forEach(animation => animation.pause());
}

function resumeTimer() {
	createTimerInterval();
	timerCircle.getAnimations().forEach(animation => animation.play());
}

function createTimerInterval() {
	if (timerInterval !== null) {
		clearInterval(timerInterval);
	}
	timerInterval = setInterval(() => {
		if (--countdown < 1) {
			if (cardsPlaced === 0) {
				sendDrawRequest(null, "idle");
			}
			finishTurn("timer ended");
		}
		timerNumber.textContent = countdown;
	}, 1000);
}