// HTML elements

function send_data(data_f) {
  const data = data_f
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonString);
  let binaryRepresentation = "";
  jsonBytes.forEach((byte) => {
    binaryRepresentation += byte.toString(2).padStart(8, "0");
  });
  return binaryRepresentation
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

let clientId = null;

var is_game = false;
let ws = new WebSocket(`wss://test-websocket-ejmc.onrender.com:443`);
//let ws = new WebSocket(`ws://localhost:443`);

//ws.binaryType = "arraybuffer";

//writing events
var game_data = {};
btnJoin.addEventListener("click", (e) => {
  is_game = true;
  btnJoin.style.display = "none";
  const payLoad = {
    method: "join",
    clientId: clientId,
  };
  ws.send(send_data(payLoad));
});

ws.addEventListener("message", (event) => {
  const response = get_data(event.data);

  if (response.method === "connect") {
    clientId = response.clientId;
    console.log("Client id Set successfully: " + clientId);
  }
  if (response.method === "join") {
    console.log("you joined");
    game_data = response.game;
  }
  if (response.method === "update") {
    game_data = response.game_data;
  }
});

//GAME

const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 500;

wc = canvas.width;
hc = canvas.height;

player_h = 50;
player_w = 50;

var player_position_y = 100;
var player_position_x = 100;

canvas.addEventListener("mousemove", playerPosition);

function playerPosition(e) {
  player_position_y = e.clientY - 100;
  player_position_x = e.clientX - 25;
}

function board() {
  c.fillStyle = "#7e7e7e";
  c.fillRect(0, 0, canvas.width, canvas.height);
}

function player() {
  c.fillStyle = "#000000";
  c.fillRect(player_position_x, player_position_y, player_w, player_h);
}

function draw_players() {
  for (const client in game_data.clients) {
    //console.log(game_data.clients[client]);
    p = game_data.clients[client];
    c.fillStyle = "green";
    c.fillRect(p.position.x, p.position.y, 50, 50);
  }
}

function send_position() {
  const payLoad = {
    method: "play",
    clientId: clientId,
    position: { x: player_position_x, y: player_position_y },
  };

  ws.send(send_data(payLoad));
}

function play() {
  board();
  if (is_game) {
    player();
    draw_players();
    send_position();
  }
}

setInterval(play, 1000 / 60);
