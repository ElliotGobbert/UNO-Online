const SERVER_URLS = [
	'wss://2130233e-57e0-47bb-aa63-a639e5366eb1-00-2lra5gpkvegzr.worf.replit.dev/',//1
	'wss://c36d304b-c0c0-44e3-addd-9849d20b3a00-00-d8wcsh346ybw.kirk.replit.dev/',//2
	'wss://178f4f3a-8df2-4e6e-8f65-44363f8a32b9-00-2t0k2xibh6a61.janeway.replit.dev/',//3
	'',//4
	'',//5
	'',//6
	'',//7
	''//8
]


var server = null;
var username = null;
var id = null;
var currentPlayerCount = 0;

startButton.style.visibility = "hidden";
connectButton.disabled = true;
connectButton.onclick = connect;
usernameInput.oninput = isUsernameInputEmpty;

function connect() {
	connectButton.disabled = true;
	username = usernameInput.value;
    //IMPORTANT THAT WE CHECK WHETHER EACH SERVER WORKS
	server = new WebSocket(SERVER_URLS[parseInt(serverChoices.value.at(-1)) - 1]);
	server.onerror = error => {
		console.log(error);
		disconnect("server error");
	};
	server.onclose = () => disconnect("server closed connection");
	server.onopen = () => {
		console.log('server opened on browser');
		server.send(JSON.stringify({ name: username, type: "userConnection" }));
		connectButton.disabled = false;
		connectButton.onclick = () => disconnect("manually disconnected");
		connectButton.innerHTML = "Disconnect";
		usernameInput.value = "";
		usernameInput.disabled = true;
        chatTextInput.onkeypress = sendTextInput;
	};
	server.onmessage = assignID;

}

function disconnect(reason) {
	if (server === null || server.readyState !== WebSocket.OPEN) {
		console.log("server isn't open");
		return;
	}
	server.close();
	console.log("disconnecting because " + reason);
	username = null;
	usernameInput.value = "";
	usernameInput.placeholder = "Enter a username...";
	usernameInput.oninput = isUsernameInputEmpty;
	connectButton.disabled = true;
	connectButton.onclick = connect;
	connectButton.innerHTML = "Connect";
	topFraction.innerHTML = "N";
	bottomFraction.innerHTML = "A";
	startButton.style.visibility = "hidden";
}

function isUsernameInputEmpty() {
	connectButton.disabled = usernameInput.value.trim().length === 0;
}

// document.getElementById("chatTextInput").onkeypress = sendTextInput;

//THINGS TO DO: 
//add interval for 1 second (i.e. remove "X is typing..." if they stop typing for a while or press enter)
//dont display when you are typing
//display multiple users (up to 3) talking  <-- feel like this gonna be annoying
function sendTextInput(keypress) {
	if (keypress.key !== "Enter" || chatTextInput.value === "") {
		document.getElementById("whoIsTyping").innerHTML = username + " is typing...";
		return;
		//add 'x, y, and others are typing...' to include multiple people like discord
		//Get it to update for everyone
	}
	send({ type: "message", id: id, msg: chatTextInput.value });//usernames can be multiple, id is the only safe way to make sure they are ze only vons to have that name, just do player.username little bro
	//Add to chatBox for everyone
	chatTextInput.value = "";
}

//for testing
messageButton.addEventListener('click', function() {
	// console.log("asdfasdfas");
    addToChat("Hi!", "bizcamp");
    console.log(text);
});

function addToChat(msg, name, inputId = -1, server = false) {
	// if (inputId == )
	var scrollCont = document.getElementById('scrollerContent');
    var newChild = document.createElement("div");
    newChild.classList.add("chatItem");
    newChild.innerHTML = name + ": " + msg;
	if (server) {
		newChild.style.color = "red";
	}
	
   
    scrollCont.appendChild(newChild);
}

/** 
 * @param message - the message received from the server
 * Assigns the user's ID and changes server.onmessage to calling
 * handleMessage() instead
 */
function assignID(message) {
	id = parseInt(JSON.parse(message.data).id);
	console.log(id);
	// if (id == null)
	// console.log("rannin1");
	var topFraction = document.getElementById("topFraction");
	currentPlayerCount = id + 1;
	topFraction.innerHTML = currentPlayerCount.toString();
	bottomFraction.innerHTML = (4).toString();
	server.onmessage = handleMessage;
}

//get a message from server and act accordingly
function handleMessage(message) {
	const parsed = JSON.parse(message.data);
	switch (parsed.type) {
		case "userConnection":
			if (parsed.id > 0 && id === 0) {
				startButton.style.visibility = "visible";
			}
			currentPlayerCount++;
			topFraction.innerHTML = currentPlayerCount.toString();
			break;
		case "userDisconnection":
			userDisconnected(parsed.id, parsed.name);
			if (players.length === 1) {
				startButton.style.visibility = "hidden";
			} else if (id === 0) {
				startButton.style.visibility = "visible";
			}
			currentPlayerCount--;
			topFraction.innerHTML = currentPlayerCount.toString();
			break;
		case "start":
			startGame(parsed.usernames, parsed.hands, parsed.firstCard, 
			          parsed.startingID);
			break;
		case "colorChange":
			colorChanged(parsed.info);
			break;
		case "drewCards":
			playerDrewCards(parsed.id, parsed.cardsDrawn, parsed.reason);
			break;
		case "placedCard":
			playerPlacedCard(parsed.id, parsed.info);
			console.log("card placed: " + parsed.info);
			break;
		case "newTurn":
			newTurn(parsed.id);
			break;
		case "gameOver": //maybe add 2nd, 3rd place?
			gameOver(parsed.winnerId, parsed.winnerName);
			players.length = 0;
			break;
		case "gameDied":
			goHome();
			disconnect("game died");
			addToChat("The game died because less than 2 players remain.", 
			          "Server", true);
			break;
		case "unoActivated":
			unoActivated(parsed.userId);
			break;
		case "unoActivatedResponse":
			unoActivatedResponse(parsed.UNOerId, parsed.success);
			break;
		case "chatMessage":
			addToChat(parsed.msg, parsed.username, parsed.id);
			break;
	}
	// console.log("message type: " + parsed.type);
}


function send(json) {
	if (!(server instanceof WebSocket)) {
		return;
	}
	server.send(JSON.stringify(json));
}


// function placeCardTest() {
// 	console.log("sent (Placed Random Card) to server");
// 	send({ id: id, type: "placedCard", info: "green 8" });
// }
// placeCardButton.addEventListener('click', placeCardTest);


// function finishTurnTest() {
// 	console.log("sent (Finished Turn) to server");
// 	send({ id: id, type: "finishedTurn", isTurn: false });
// }
// finishTurnButton.addEventListener('click', finishTurnTest);

// function drawCardTest() {
// 	console.log("sent (Drew Card) to server");
// 	send({ id: id, type: "drawRequest", number: 1 });
// }
// drawCardButton.addEventListener('click', drawCardTest);

// function changeColorTest() {
// 	console.log("sent (Changed Color) to server");
// 	send({ id: id, type: "colorChange", info: "green" });
// }
// changeColorButton.addEventListener('click', changeColorTest);

// function unoActivationTest() {
// 	console.log("sent (UNO activated) to server");
// 	send({ id: id, type: "unoActivated" });
// }
// activateUNOButton.addEventListener('click', unoActivationTest);

// function unoResponseTest() {
// 	console.log("sent (UNO Activation Responded) to server");
// 	send({ id: id, type: "unoActivatedResponse" });
// }
// unoResponseButton.addEventListener('click', unoResponseTest);


