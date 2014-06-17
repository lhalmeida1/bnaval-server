var http = require('http');
var path = require('path');
var encouracado = require('./objetos/encouracado');
var socketio = require('socket.io');
var express = require('express');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'html_tests')));

//objeto game
//{ id :0, player1 : socket, player2 : socket }
var gameId = 1;
var boardSize = 10;
var games = {};
var publicGames = [];

function Create2DArray(rows) {
    var arr = [];

    for (var i=0;i<rows;i++) {
        arr[i] = [];
    }

    return arr;
}


var enc1 = new encouracado(0,0,true);
console.log(enc1);

var space = {
    ship : enc1,
    pos : 0
};
var tabuleiro = Create2DArray(10);
tabuleiro[enc1.positions[space.pos].x][enc1.positions[space.pos].y] = space;
var space1 = {
    ship : enc1,
    pos : 1
};
tabuleiro[enc1.positions[space1.pos].x][enc1.positions[space1.pos].y] = space1;
var space2 = {
    ship : enc1,
    pos : 2
};
tabuleiro[enc1.positions[space2.pos].x][enc1.positions[space2.pos].y] = space2;
if(tabuleiro[0][2])
{
    var space = tabuleiro[0][2];
    space.ship.positions[space.pos].destroyed = true;
}
if(tabuleiro[0][1])
{
    var space = tabuleiro[0][1];
    space.ship.positions[space.pos].destroyed = true;
}
if(tabuleiro[0][0])
{
    var space = tabuleiro[0][0];
    space.ship.positions[space.pos].destroyed = true;
}


console.log(tabuleiro[0][2].ship.destroyed());

//console.log("conectado");

function placeShip(ship, board){

    for(i = 0; i < ship.size; i++)
    {
        var position = {
            ship : ship,
            part : i
        };
        board[ship.positions[i].x][ship.positions[i].y] = position;
    }
    console.log("Navio placeado", board);
    return board;
}


function validaShipSize(ship, board){
    var isValid = false;
    if(ship.vertical && ship.y + ship.size <=  boardSize || !ship.vertical && ship.x + ship.size <=  boardSize){
        isValid = true
    }
    return isValid;
}

function validaShip(ship, board)
{
    var isValid = true;
    for(i = 0; i < ship.size;i++)
    {
        if(board[ship.positions[i].x][ship.positions[i].y])
            isValid = false;
    }
    return isValid;
}


io.on('connection', function(socket){
    console.log('Novo usuário conectado!');

    //emite lista de games publicos para o usuário que acabou de se conectar
    if(publicGames.length > 0)
    {
        socket.emit("list_of_public_games", publicGames);
    }

    socket.on("disconnect", function(){
        console.log("Descounectou-se - Player: " + socket.player);
        if(!socket.gameId) return;
        var newMessage = {
            text : "O jogo foi encerrado, pois seu adversário desconectou!"
        };
        if(socket.player == 1) {
            //emite aviso q o player 2  que o jogo foi encerrado
            games[socket.gameId].player[2].socket.emit("new_message", newMessage);

        }else{
            //avisa o player 2 que o jogo foi encerrado
            games[socket.gameId].player[1].socket.emit("new_message", newMessage);
        }
        delete games[socket.gameId];

    });

    socket.on("message_to_player1", function(message){
        console.log("Message to: ", message);
        var newMessage = {

            text : message.text
        };
        games[socket.gameId].player[1].socket.emit("new_message", newMessage);
    });

    socket.on("message_to_player2", function(message){
        console.log("Message to p2 :", message);
        var newMessage = {
            text : message.text
        };
        games[socket.gameId].player[2].socket.emit("new_message", newMessage);
    });

    socket.on("join_game", function(game, callback){
        if(games[game.id].player[2].socket)
        {
            callback({ error : "Outro jogador pegou seu lugar, escolha outro jogo!" });
            return;
        }
        socket.nickname = game.name;
        socket.gameId = game.id;
        socket.player = 2;
        console.log("tentativa de join", game);
        games[socket.gameId].player[2].socket = socket;
        var joinedGame = {
            id : game.id,
            player1 : games[socket.gameId].player[1].nickname,
            player2 : socket.nickname
        };
        removePublicGame(socket.gameId);
        games[socket.gameId].player[1].socket.emit("player2_joined", joinedGame);
        callback(joinedGame);
    });

    //remove jogo da lista de publicos
    function removePublicGame(id){
        publicGames.splice(publicGames.indexOf(id), 1);
        updatePublicGameList();
    }

    function updatePublicGameList()
    {
        socket.broadcast.emit("list_of_public_games", publicGames);
    }

    //coloca navio do jogador
    //ship { player, type, vertical, x, y }
    socket.on("place_ship", function(shipType, x, y, vertical, callback){
        var message = "ok";
        var playerBoard = games[socket.gameId].player[socket.player].board;
        if(shipType == "encouracado"){
            var newShip = new encouracado(x, y, vertical);
            var isValid = true;
            if(!validaShip(newShip, playerBoard)){
                isValid = false;
                message = "Local ocupado!";
            }else if(!validaShipSize(newShip, playerBoard)){
                isValid = false;
                message = "Navio não cabe no tabuleiro!"
            }
            if(isValid)
            {
                    playerBoard = placeShip(newShip, playerBoard);
                games[socket.gameId].player[socket.player].board = playerBoard;
            }
            callback({ success : isValid, message : message, board : playerBoard });
        }
    });

    socket.on("create_game", function(game, callback){
        socket.gameId = gameId;
        socket.player = 1;
        socket.nickname = game.name;
        games[socket.gameId] = new Object();
        games[socket.gameId].player = [];
        games[socket.gameId].player[1] = new Object();
        games[socket.gameId].player[2] = new Object();
        games[socket.gameId].player[1].socket = socket;
        games[socket.gameId].player[1].board = Create2DArray(boardSize);
        games[socket.gameId].player[2].board = Create2DArray(boardSize);
        if(game.public){
            publicGames.push(socket.gameId);
            updatePublicGameList();
        }
        callback({ gameId : socket.gameId});
        console.log("Novo Jogo Criado", game);
        gameId++;
    });
});

server.listen(process.env.PORT || 3001, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server iniciado na porta: ", addr.address + ":" + addr.port);
});