var errorHandler = require('./ErrorHandler.js');
var schema = require('./schema.js');
var users = require('./Users.js');
var chat = require('./Chat.js');
var monitor = require('./monitor.js');
var UserPublic = require('./UserPublic.js');
var cnversation = require('./Conversations.js');
var group = require('./Groups.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var RSAKey = require('react-native-rsa');

var secureMode = true;

server.listen(8080);

//app.use('/logs',express.static(__dirname + '/all-logs.log'));

this.connections = 0;
var sockets = [];

io.on('connection', (socket) => {
    try {
        
        //io.sockets.connected['/#XsFzuXFNTocNE4ToAAAF'].emit('typing', {content: 'sdfsd', text: 'sdf'});
        this.updateServerErrors = () => {
             schema.Error.filter({isClient: false}).orderBy(schema.r.desc('timestamp')).run().then((serverErrors) => {
                monitor.broadCastToMonitor('serverErrors', serverErrors);
            }).error(function (err){
                errorHandler.WriteError('Error => serverErrors', err);
            });
        }
        
        this.updateClientErrors = () => {
             schema.Error.filter({isClient: true}).orderBy(schema.r.desc('timestamp')).run().then((clientErrors) => {
                monitor.broadCastToMonitor('clientErrors', clientErrors);
            }).error(function (err){
                errorHandler.WriteError('Error => clientErrors', err);
            });
        }
        
        errorHandler.runErrorHandler(socket, this.updateClientErrors, this.updateServerErrors);
        
        this.connections++;
        console.log('New connection! ' + this.connections); 
        
        //אימות
        monitor.runMonitor(socket, sockets); //אימות למוניטור
        
      
        UserPublic.runUserPublic(socket);

        if (socket.handshake.query.encryptedUid && socket.handshake.query.publicKey) {
            var uid = decrypteUid(socket.handshake.query.encryptedUid, socket.handshake.query.publicKey);
            socket.handshake.query.uid = uid;
            if (uid) {
                schema.User.filter({ id: uid, pkey: socket.handshake.query.publicKey}).execute().then(function (user_result) {
                    try {
                        if (user_result.length > 0) {
                            console.log('Successfully validated! uid:', user_result[0].id);
                            socket.emit('AuthenticationOk', 'OK');
                            runAll(socket);
                            changeOnlineStatus(user_result[0].id, true, socket.id);
                            updateToken(user_result[0].id, socket.handshake.query.token);
                        } else {
                            console.log(socket.handshake.query.encryptedUid, socket.handshake.query.publicKey);
                            socket.emit('AuthenticationFailed');
                            errorHandler.WriteError('connection => schema.User.filter', {message: 'AuthenticationFailed. uid: ' + socket.handshake.query.encryptedUid});
                            return;
                        }
                    } catch (e) {
                        errorHandler.WriteError('connection => schema.User.filter catch', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('connection => schema.User.filter => error', err);
                });
            } else {
                socket.emit('AuthenticationFailed');
                errorHandler.WriteError('connection => schema.User.filter => else', {message: 'AuthenticationFailed'});
                return;
            }
        }

        monitor.broadCastToMonitor('connectionsChanged', this.connections);
        
        socket.on('disconnect', () => {
            try {
                this.connections--;
                console.log('disconnected - ' + this.connections);
                sockets.splice(sockets.indexOf(socket), 1);
                if (monitor.monitorsSockets.indexOf(socket) >= 0) {
                    monitor.monitorsSockets.splice(monitor.monitorsSockets.indexOf(socket), 1);
                }
                monitor.broadCastToMonitor('connectionsChanged', this.connections);
            } catch (e) {
                errorHandler.WriteError('disconnect', e);
            }
        });
        
        monitor.monitorsSockets.push(socket); //if socket of monitor
        
    } catch (e) {
        errorHandler.WriteError('connection', e);
    }
});

var changeOnlineStatus = function (uid, _isOnline, _socketId) {
    try {
        schema.User.get(uid).update({ isOnline: _isOnline, lastSeen: Date.now(), socketId:_socketId, isTempUser: false }).run();
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
        }
    } catch (e) {
        errorHandler.WriteError('updateToken', e);
    }
};

var decrypteUid = function (encryptedUid, publicKey) {
    try {
        
        var rsa = new RSAKey();
        rsa.setPublicString(publicKey);
        var decrypted_uid = rsa.decryptWithPublic(encryptedUid); 
        console.log("decrypted:" +decrypted_uid);
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
        
        socket.on('changeOnlineStatus', (status) => {
            changeOnlineStatus(socket.handshake.query.uid, status, socket.id);
        });
        
        chat.runChat(socket, sockets, io);
        cnversation.runConversations(socket, sockets);
        users.runUser(socket, sockets);
        group.runGroup(socket, sockets);
        socket.on('disconnect', function () {
            try {
                var uid = socket.handshake.query.uid;
                if (uid) {
                    changeOnlineStatus(uid, false, socket.id);
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
    var FCM = require('./FCM.js');
    FCM.sendNotification({
        tokens: ['exRahragLso:APA91bFKbzv4w173YoxiKze7eBr8GSoAC8QF3AiY0s1tAJUeIV3AndaXt4kqcypY4hdVQLi9107zUPYmooPI62aGE8i7ftUP1-cdhhobxHW3IHx89LM4-3d3l-JP9BKqSsoHg5K0qTc5'],
        from: 'Server',
        content: 'Server Is DOWN!',
        convId: '',
        isEncrypted: false
    });
    errorHandler.WriteError('exitHandler', 'app is closing');
    if (err) {
         errorHandler.WriteError('exitHandler', err);
    }
    //if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));