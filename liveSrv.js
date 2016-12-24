var errorHandler = require('./ErrorHandler.js');
var schema = require('./schema.js');
var users = require('./Users.js');
var voiceCall = require('./voiceCall.js');
var cnversation = require('./Conversations.js');
var group = require('./Groups.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);



var connections = 0;
var sockets = [];
var monitorsSockets = [];

io.on('connection', (socket) => {
    try {
        connections++;
        console.log('New Live Chat! ' + connections);
        sockets.push(socket);
        voiceCall.runLiveConvs(socket, sockets, io);
          socket.on('disconnect', () => {
            console.log('disconnect');
            if (socket.room) {
              var room = socket.room;
              io.to(room).emit('leave', socket.id);
              socket.leave(room);
            }
          });
        
          socket.on('join', (name, callback) => {
            var socketIds = socketIdsInRoom(name);
            callback(socketIds);
            socket.join(name);
            socket.room = name;
          });
        
          socket.on('exchange', (data) => {
            data.from = socket.id;
            var to = io.sockets.connected[data.to];
            to.emit('exchange', data);
          });
  
        socket.on('disconnect', () => {
            try {
                connections--;
                console.log('disconnected - Live Chat -' + connections);
            } catch (e) {
                errorHandler.WriteError('Live Chat => disconnect', e);
            }
        });
        
    } catch (e) {
        errorHandler.WriteError('Live Chat => connection', e);
    }
});

// app.get('/', function(req, res){
//   console.log('get /');
//   res.sendFile(__dirname + '/monitor');
// });


function socketIdsInRoom(name) {
  var socketIds = io.nsps['/'].adapter.rooms[name];
  if (socketIds) {

    var collection = [];
    for (var key in socketIds.sockets) {
      collection.push(key);
    }
    return collection;
  } else {
    return [];
  }
}

server.listen(8081);



process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    errorHandler.WriteError('exitHandler', 'app is closing');
    if (err) {
         errorHandler.WriteError('exitHandler', err);
    }
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));