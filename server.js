var errorHandler = require('./ErrorHandler.js');
var schema = require('./schema.js');
var users = require('./Users.js');
var chat = require('./Chat.js');
var UserPublic = require('./UserPublic.js');
var cnversation = require('./Conversations.js');
var group = require('./Groups.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var NodeRSA = require('node-rsa');

var secureMode = false;

server.listen(8080);

//app.use('/logs',express.static(__dirname + '/all-logs.log'));

var connections = 0;
var sockets = [];
var monitorsSockets = [];

// try {
// console.log('start on');

// var importedKey = new NodeRSA({b: 512});
// var keyData = `MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJMymCa4d3Tt3wNXSJsEFr3VL3HESxjjXpJsl/pQG8Wy
// qQ+hB3exXCZbyMzLya46sWhKlum+A6/E6R4PaH5/KM8CAwEAAQ==`;
// importedKey.importKey(keyData, 'pkcs8-public');

// var decrypted_uid = importedKey.decryptPublic(`Z4o3IVzvPVpN42jd6GkKmLYBRCW4MwbbPVryrl+Pt3UBN4Aqsvg8QEgJOUmnGK0YKDhnelKodNLQwpjqza+nBQ==`, 'base64', 'utf8');
// console.log(decrypted_uid);
// } catch (e) {
//     console.log(e);
// }

io.on('connection', function (socket) {
    try {
        //אימות
        this.broadCastToMonitor = function (event, value) {
            for (var i = 0; i < monitorsSockets.length; i++) {
                monitorsSockets[i].emit(event, value);
            }
            socket.emit(event, value);
        };
        
        connections++;
        console.log('New connection! ' + connections);
        errorHandler.runErrorHandler(socket);
        UserPublic.runUserPublic(socket);

        if (secureMode === true) {
            if (socket.handshake.query.encryptedUid && socket.handshake.query.publicKey) {
                var uid = decrypteUid(socket.handshake.query.encryptedUid, socket.handshake.query.publicKey);
                socket.handshake.query.uid = uid;
                if (true) {
                    schema.User.filter({ id: uid }).execute().then(function (user_result) {
                        try {
                            if (user_result.length > 0) {
                                console.log('Successfully validated! uid:', user_result[0].id);
                                socket.emit('AuthenticationOk', 'OK');
                                runAll(socket);
                                changeOnlineStatus(user_result[0].id, true);
                                updateToken(user_result[0].id, socket.handshake.query.token);
                            } else {
                                socket.emit('AuthenticationFailed');
                                errorHandler.WriteError('connection => schema.User.filter', {message: 'AuthenticationFailed'});
                                return;
                            }
                        } catch (e) {
                            errorHandler.WriteError('connection => schema.User.filter catch', e);
                        }
                    }).error(function (err){
                        errorHandler.WriteError('connection => schema.User.filter => error', err);
                    });
                }
            }
        } else {
             if (socket.handshake.query.uid) {
                var uid = socket.handshake.query.uid;
                schema.User.filter({ id: uid }).execute().then(function (user_result) {
                    try {
                        if (user_result.length > 0) {
                            console.log('Successfully validated! uid:', user_result[0].id);
                            socket.emit('AuthenticationOk', 'OK');
                            runAll(socket);
                            changeOnlineStatus(user_result[0].id, true);
                            updateToken(user_result[0].id, socket.handshake.query.token);
                        } else {
                            socket.emit('AuthenticationFailed');
                            errorHandler.WriteError('connection => schema.User.filter', {message: 'AuthenticationFailed'});
                            return;
                        }
                    } catch (e) {
                        errorHandler.WriteError('connection => schema.User.filter catch', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('connection => schema.User.filter => error', err);
                });
            }
        }
        
        this.broadCastToMonitor('connectionsChanged', connections);
        this.updateErrors = function(){
            schema.Error.filter({isClient: true}).orderBy(schema.r.desc('timestamp')).run().then((clientErrors) => {
                socket.emit('clientErrors', clientErrors);
            }).error(function (err){
                errorHandler.WriteError('Error => clientErrors', err);
            });
            
            schema.Error.filter({isClient: false}).orderBy(schema.r.desc('timestamp')).run().then((serverErrors) => {
                socket.emit('serverErrors', serverErrors);
            }).error(function (err){
                errorHandler.WriteError('Error => serverErrors', err);
            });
        }
        //להוסיף אבטחה. לאמת מוניטור
        socket.on('monotorOn', () => {
            try {
                socket.emit('connectionsChanged', connections);
                
                schema.r.table('User').count().run().then((count) => {
                    socket.emit('registredUsers', count);
                }).error(function (err){
                    errorHandler.WriteError('monotorOn => User', err);
                });
                
                schema.r.table('Message').count().run().then((count) => {
                    socket.emit('MessagesCount', count);
                }).error(function (err){
                    errorHandler.WriteError('monotorOn => Message', err);
                });
                
                schema.r.table('Conversation').count().run().then((count) => {
                    socket.emit('TotalChats', count);
                }).error(function (err){
                    errorHandler.WriteError('monotorOn => TotalChats', err);
                });
                
                this.updateErrors();
            } catch (e) {
                errorHandler.WriteError('monotorOn', e);
            }
        });
        
        schema.Error.changes().run().then((change) => {
            console.log(0);
            this.updateErrors();
        });
        

        socket.on('disconnect', () => {
            try {
                connections--;
                console.log('disconnected - ' + connections);
                sockets.splice(sockets.indexOf(socket), 1);
                if (monitorsSockets.indexOf(socket) >= 0) {
                    monitorsSockets.splice(monitorsSockets.indexOf(socket), 1);
                }
                this.broadCastToMonitor('connectionsChanged', connections);
            } catch (e) {
                errorHandler.WriteError('disconnect', e);
            }
        });
        
        monitorsSockets.push(socket); //if socket of monitor
        
    } catch (e) {
        errorHandler.WriteError('connection', e);
    }
});

var changeOnlineStatus = function (uid, _isOnline) {
    try {
        schema.User.get(uid).update({ isOnline: _isOnline, lastSeen: Date.now() }).run();
        schema.friendsOnline.filter({ fid: uid }).update({ isOnline: _isOnline, lastSeen: Date.now() }).run();
    } catch (e) {
        errorHandler.WriteError('changeOnlineStatus', e);
    }
};

var updateToken = function (uid, token) {
    try {
        if (!token) {
            token = '';
        }
        if (token.length > 120) {
            schema.User.get(uid).update({ privateInfo: {tokenNotification: token}}).run();
        } else {
           errorHandler.WriteError('updateToken => ', 'Token length is only ' + token.length + ' charcters. Token: ' + token);
        }
    } catch (e) {
        errorHandler.WriteError('updateToken', e);
    }
};

var decrypteUid = function (encryptedUid, publicKey) {
    try {
        var importedKey = new NodeRSA();
        importedKey.importKey(publicKey, 'public');
        var decrypted_uid = importedKey.decryptPublic(encryptedUid, 'utf8');
        return decrypted_uid;
    } catch (e) {
        errorHandler.WriteError('decrypteUid', e);
    }
};

var runAll = function (socket) {
    try {
        if (sockets.indexOf(socket) == -1) {
            sockets.push(socket);
        }
        chat.runChat(socket, sockets, io);
        cnversation.runConversations(socket, sockets);
        users.runUser(socket, sockets);
        group.runGroup(socket, sockets);
        socket.on('disconnect', function () {
            try {
                var uid = socket.handshake.query.uid;
                if (uid) {
                    changeOnlineStatus(uid, false);
                }
            } catch (e) {
                errorHandler.WriteError('disconnect', e);
            }
        });
    } catch (e) {
        errorHandler.WriteError('runAll', e);
    }
};

try {
    app.use(express.static((__dirname + '/monitor')));
} catch (e) {
    errorHandler.WriteError('app.use(express.static...)', e);
}



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


//------
io.on('connection', (socket) => {
  console.log('connection');
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
});


//------

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