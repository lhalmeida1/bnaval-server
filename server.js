var http = require('http');
var path = require('path');
//var navios = require('./objetos/navios');
var socketio = require('socket.io');
var express = require('express');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'html_tests')));

//objeto game
//{ id :0, player1 : socket, player2 : socket }
var gameId = 1;
var games = {};
var publicGames = [];
console.log("conectado");


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
            games[socket.gameId].player2.emit("new_message", newMessage);

        }else{
            //avisa o player 2 que o jogo foi encerrado
            games[socket.gameId].player1.emit("new_message", newMessage);
        }
        delete games[socket.gameId];

    });

    socket.on("message_to_player1", function(message){
        console.log("Message to: ", message);
        var newMessage = {

            text : message.text
        };
        games[socket.gameId].player1.emit("new_message", newMessage);
    });

    socket.on("message_to_player2", function(message){
        console.log("Message to p2 :", message);
        var newMessage = {
            text : message.text
        };
        games[socket.gameId].player2.emit("new_message", newMessage);
    });

    socket.on("join_game", function(game, callback){
        if(games[game.id].player2)
        {
            callback({ error : "Voce nao pode entrar" });
            return;
        }
        socket.nickname = game.name;
        socket.gameId = game.id;
        socket.player = 2;
        console.log("tentativa de join", game);
        games[socket.gameId].player2 = socket;
        var joinedGame = {
            id : game.id,
            player1 : games[socket.gameId].player1.nickname,
            player2 : socket.nickname
        };
        removePublicGame(socket.gameId);
        games[socket.gameId].player1.emit("player2_joined", joinedGame);
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

    socket.on("create_game", function(game, callback){
        socket.gameId = gameId;
        socket.player = 1;
        socket.nickname = game.name;
        games[socket.gameId] = new Object();
        games[socket.gameId].player1 = socket;
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