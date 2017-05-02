var schema = require('./schema.js');
var errorHandler = require('./ErrorHandler.js');
var server = require('./server.js');

var monitorsSockets = [];
this.monitorsSockets = monitorsSockets;
this.runMonitor = (socket, sockets) => {
    try {
      this.broadCastToMonitor = function (event, value) {
            for (var i = 0; i < monitorsSockets.length; i++) {
                monitorsSockets[i].emit(event, value);
            }
            socket.emit(event, value);
        };
        
        //להוסיף אבטחה. לאמת מוניטור
        socket.on('monitorOn', () => {
            try {
                socket.emit('connectionsChanged', server.connections);
                
                schema.r.table('User').count().run().then((count) => {
                    socket.emit('registredUsers', count);
                }).error(function (err){
                    errorHandler.WriteError('monitorOn => User', err);
                });
                
                schema.r.table('Message').count().run().then((count) => {
                    socket.emit('MessagesCount', count);
                }).error(function (err){
                    errorHandler.WriteError('monitorOn => Message', err);
                });
                
                schema.r.table('Conversation').count().run().then((count) => {
                    socket.emit('TotalChats', count);
                }).error(function (err){
                    errorHandler.WriteError('monitorOn => TotalChats', err);
                });
                
                server.updateClientErrors();
                server.updateServerErrors();
            } catch (e) {
                errorHandler.WriteError('monitorOn', e);
            }
        });
        
        socket.on('IsServerUp', (callback) => {
            callback('ServerIsUp');
        });
        
        socket.on('GetAllUsers', (callback) => {
            try {
                schema.r.table('User').pluck(
                    {
                    id: true,
                    ModifyDate: true,
                    ModifyPicDate: true, 
                    isOnline: true,
                    isTempUser: true,
                    phoneNumber: true,
                    lastSeen: true,
                    pkey: true,
                    publicInfo: {
                        fullName: true,
                        gender: true,
                        mail: true
                    },
                    privateInfo:{
                        password: true,
                        tokenNotification: true
                    },
                    socketId: true
                    }).run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllUsers', e);
            }
        });
        
        socket.on('GetAllConversations', (callback) => {
            try {
                schema.r.table('Conversation').pluck(
                    {
                       id: true,
                       isEncrypted: true,
                       isGroup: true,
                       manager: true,
                       groupName: true
                    }).run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllConversations', e);
            }
        });
        
        socket.on('GetAllMessages', (callback) => {
            try {
                schema.r.table('Message').pluck(
                    {
                     _id: true,
                     content: true,
                     convId: true,
                     createdAt: true,
                     from: true,
                     id: true,
                     isEncrypted: true,
                     lastTypingTime: true,
                     sendTime: true,
                     text: true,
                     seen: true,
                     isDeleted: true,
                     user:{
                         _id: true,
                         ModifyDate: true,
                         avatar: true,
                         id: true,
                         name: true,
                         phoneNumber: true,
                         publicInfo:{
                             fullName: true
                         }
                     },
                     imgPath: true,
                     mid: true}).run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllMessages', e);
            }
        });
        
        socket.on('GetAllfriendsOnline', (callback) => {
            try {
                schema.r.table('friendsOnline').run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllfriendsOnline', e);
            }
        });
        
        socket.on('GetAllLiveChat', (callback) => {
            try {
                schema.r.table('LiveChat').run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllLiveChat', e);
            }
        });
        
        socket.on('GetAllErrors', (callback) => {
            try {
                schema.r.table('Error').run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllErrors', e);
            }
        });
        
        socket.on('GetAllClientErrors', (callback) => {
            try {
                schema.r.table('Error').filter({isClient: true}).orderBy(schema.r.desc('timestamp')).run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllErrors', e);
            }
        });
        socket.on('GetAllServerErrors', (callback) => {
            try {
                schema.r.table('Error').filter({isClient: false}).orderBy(schema.r.desc('timestamp')).run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllErrors', e);
            }
        });
        
        
      
    } catch (e) {
        errorHandler.WriteError('runMonitor', e);
    }
};