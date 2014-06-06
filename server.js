var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var express = require('express');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];
console.log("conectado");


io.on('connection', function(socket){
    console.log('Novo usuário conectado!');

    socket.on("disconnect", function(){
        sockets.splice(sockets.indexOf(socket), 1);
    });

    socket.on("create_game", function(user, callback){
        console.log("Novo Jogo Criado", users);
    });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Panel Server Listen at", addr.address + ":" + addr.port);
});