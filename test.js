var errorHandler = require('./ErrorHandler.js');
var schema = require('./schema.js');
var users = require('./Users.js');
var chat = require('./Chat.js');
var cnversation = require('./Conversations.js');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var NodeRSA = require('node-rsa');
var secureMode = false;
server.listen(8080);

app.get('/GetContact', function (req, res) {
  res.send({uid:123, name: 'rugbin pro'});
});

var connections = 0;
var sockets = [];

io.on('connection', function (socket) {
  connections++;
  console.log('OK - connect - ' + connections);
  
  errorHandler.runErrorHandler(socket);
  
  
  if (secureMode === true) {
    var importedKey = new NodeRSA();
    importedKey.importKey(socket.handshake.query.publicKey, 'public');
    console.log(importedKey);
    
    var decrypted_uid = importedKey.decryptPublic(socket.handshake.query.encryptedUid, 'utf8');
    console.log(decrypted_uid);     
    
    schema.Users.filter({uid: decrypted_uid}).run().then(function(result) {
      if (result.length === 1) {
        console.log('Successfully validated!');
        sockets.push(socket);
        chat.runChat(socket, sockets);
        cnversation.runConversations(socket, sockets);
        //users.runUser(socket,sockets);
      } else {
        console.log('Authentication Failed!!!');
        return;
      }
    });
  }else{
    chat.runChat(socket, sockets);
    cnversation.runConversations(socket, sockets);
    //users.runUser(socket,sockets);
  }
  
  //----General----//
  socket.on('disconnect', function () {
    connections--;
    console.log('disconnected - ' + connections);
    sockets.splice(sockets.indexOf(socket), 1);
  });
});
