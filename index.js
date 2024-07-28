function send_data(data_f) {
  const data = data_f;
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonString);
  let binaryRepresentation = "";
  jsonBytes.forEach((byte) => {
    binaryRepresentation += byte.toString(2).padStart(8, "0");
  });
  return binaryRepresentation;
}
function get_data(data) {
  const binaryRepresentation = data;

  const byteArray = [];
  for (let i = 0; i < binaryRepresentation.length; i += 8) {
    byteArray.push(parseInt(binaryRepresentation.substr(i, 8), 2));
  }
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(new Uint8Array(byteArray));
  const got_data = JSON.parse(jsonString);
  return got_data;
}
const express = require("express");
const path = require("path");
const http = require("http");
const WebSocketServer = require("websocket").server;

const app = express();
//const compression = require('compression');
//app.use(compression());
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
    const result = get_data(message.utf8Data);

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
      clients[clientId].connection.send(send_data(payLoad));
      updateGameState();
    }
    if (result.method === "play") {
      const clientId = result.clientId;
      if (game_data.clients[clientId]) {
        game_data.clients[clientId].position = result.position;
      }
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
  connection.send(send_data(payLoad));
});

function updateGameState() {
  const payLoad = {
    method: "update",
    game_data: game_data,
  };
  for (const client in clients) {
    clients[client].connection.send(send_data(payLoad));
  }

  setTimeout(updateGameState, 1);
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring();
}

const guid = () => S4() + S4() + "-" + S4() + "-4" + S4().substring();
