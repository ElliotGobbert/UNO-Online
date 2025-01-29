// const express = require("express");
// const http = require("http");
// const WebSocket = require("ws");
import createApplication from "express";
import http from "http";
import {
    WebSocketServer,
    WebSocket
} from "ws";
import * as gameJS from "./game.js";
import deck, * as deckJS from "./deck.js";

const app = createApplication();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocketServer({
    server
});

const Player = gameJS.Player;
const players = gameJS.players;

wss.on("connection", (client) => {
    if (players.length === 4 || gameJS.started) {
        client.terminate();
        console.log("client tried joining when server full");
        return;
    }
    console.log("CLIENT CONNECTED");
    players.push(new Player(client, players.length));

    client.onmessage = message => newPlayer(client, message);
    // client.send("Hi there, I am a WebSocket server");
});

function newPlayer(client, message) {
    const parsed = JSON.parse(message.data);
    players.at(-1).username = parsed.name;
    gameJS.broadcast({
        type: "userConnection",
        id: players.length - 1,
        username: parsed.name
    });
    console.log(parsed.name + " joined");
    client.onmessage = handleMessage;
    //If this client is players[0], they get admin permissions, i.e they can start the game whenever they want
}

function handleMessage(message) {
    const parsed = JSON.parse(message.data);
    switch (parsed.type) {
        case "startRequest":
            if (players.length > 1 && parsed.id === 0) {
                gameJS.initializeGame();
            } else {
                players[parsed.id].connection.send(JSON.stringify({
                    type: "startFailure"
                }));
            }
            break;
        case "colorChange":
            gameJS.colorChanged(parsed.info);
            break;
        case "placedCard":
            gameJS.playerPlacedCard(parsed.id, parsed.info);
            break;
		case "drawRequest":
			gameJS.playerRequestedDraw(parsed.id, parsed.number, parsed.reason);
			break;
		case "finishedTurn":
			gameJS.playerFinishedTurn();
			break;
		case "unoActivated":
			gameJS.playerActivatedUNO(parsed.id);
			break;
		case "unoActivatedResponse":
			gameJS.playerActivatedUNOResponse(parsed.id);
			break;
		case "message":
            gameJS.broadcast({
                type: "chatMessage", 
				id: parsed.id,
                username: players[parsed.id]?.username,
                msg: parsed.msg 
            });
			break;
		case "typer":
			console.log("typer received");
			gameJS.broadcast({
				type: "typer",
				username: players[parsed.id].username,
				id: parsed.id
			});
			break;
        case "stoppedTyping":
            console.log(players[parsed.id].username + " stopped typing");
            gameJS.broadcast({
                type: "stoppedTyping",
                id: parsed.id,
                username: parsed.username
            });
    }
    console.log("message type: " + parsed.type);
}

//start our server
server.listen(3000, () => {
    console.log(`Server started on port ${server.address().port}`);
});

function checkConnections() {
    //Checks the connections of each of the clients, if a client isn't connected anymore, deletes them and does all the stuff involved w that
    for (let i = 0; i < players.length; i++) {
        if (players[i].connection.readyState == WebSocket.CLOSED) {
            // console.log(client.connection.readyState);
            deletePlayer(players[i].id);
			i--;
        }
    }
}

setInterval(checkConnections, 3000);

function deletePlayer(id) {
    console.log("length: " + players.length);
    console.log("CLIENT DISCONNECTED: " + id);
    for (let i = 0; i < players.length; i++) {
        if (players[i].id === id) {
            const disconnected = players[i]
            players.splice(i, 1);
            if (i <= gameJS.pointer) {
                gameJS.setPointer(gameJS.pointer - 1);
            }
            for (let j = i; j < players.length; j++) {
                players[j].id = j;
            }
            deck.push(...disconnected.hand
                                     .splice(0, disconnected.hand.length));
            gameJS.broadcast({
                type: "userDisconnection",
                id: disconnected.id,
                username: disconnected.username
            });
            if (players.length === 1 && gameJS.started) {
                reset();
                return;
            }
            if (disconnected.isTurn && players.length > 0) {
                players[i + 1 >= players.length ? 0 : i + 1].isTurn = true;
            }
            break;
        }
    }
}

function reset() {
    const player = players[0];
    player.connection.send(JSON.stringify({
        type: "gameDied"
    }));
    gameJS.setStarted(false);
    deck.push(...player.hand.splice(0, player.hand.length));
    deck.push(...gameJS.playedCards.splice(0, gameJS.playedCards.length));
    players.splice(0, 1, new Player(player.connection, player.id));
    players[0].username = player.username;
}