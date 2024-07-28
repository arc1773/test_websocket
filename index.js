const express = require("express");
const path = require("path");
const http = require("http");
const WebSocketServer = require("websocket").server;

const app = express();
//const port = process.env.PORT || 8080;
const port = 443;

// Serwowanie statycznych plików z katalogu "public"
app.use(express.static(path.join(__dirname, "public")));

// Utworzenie serwera HTTP
const httpServer = http.createServer(app);

// Nasłuchiwanie na określonym porcie
httpServer.listen(port, () => {
  console.log(`App listening on port: ${port}`);
});

// Utworzenie serwera WebSocket
const wsServer = new WebSocketServer({
  httpServer: httpServer,
});

const clients = {};
const game_data = {
  clients: {},
};

wsServer.on("request", (request) => {
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("Opened!!!"));
  connection.on("close", () => console.log("CLOSED!!!"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);

    if (result.method === "join") {
      const clientId = result.clientId;

      game_data.clients[clientId] = {
        position: { x: 100, y: 100 },
      };
      const game = game_data;
      const payLoad = {
        method: "join",
        game: game,
      };
      clients[clientId].connection.send(JSON.stringify(payLoad));
      updateGameState();

      //game.clients.forEach(c => {
      //    clients[c.clientId].connection.send(JSON.stringify(payLoad))
      //});
    }
    if (result.method === "play") {
      const clientId = result.clientId;

      game_data.clients[clientId].position = result.position;
    }
  });

  const clientId = guid();
  clients[clientId] = {
    connection: connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  //send back the client connect
  connection.send(JSON.stringify(payLoad));
});

function updateGameState() {
  const payLoad = {
    method: "update",
    game_data: game_data,
  };
  for (const client in clients) {
    clients[client].connection.send(JSON.stringify(payLoad));
  }

  setTimeout(updateGameState, 20);
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring();
}

const guid = () => S4() + S4() + "-" + S4() + "-4" + S4().substring();
