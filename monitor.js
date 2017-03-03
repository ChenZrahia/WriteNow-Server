var schema = require('./schema.js');
var errorHandler = require('./ErrorHandler.js');
var server = require('./server.js');

var monitorsSockets = [];
this.monitorsSockets = monitorsSockets;
this.runMonitor = function (socket, sockets) {
    try {
      
      this.broadCastToMonitor = function (event, value) {
            for (var i = 0; i < monitorsSockets.length; i++) {
                monitorsSockets[i].emit(event, value);
            }
            socket.emit(event, value);
        };
        
        this.updateServerErrors = () => {
             schema.Error.filter({isClient: false}).orderBy(schema.r.desc('timestamp')).run().then((serverErrors) => {
                this.broadCastToMonitor('serverErrors', serverErrors);
            }).error(function (err){
                errorHandler.WriteError('Error => serverErrors', err);
            });
        }
        
        this.updateClientErrors = () => {
             schema.Error.filter({isClient: true}).orderBy(schema.r.desc('timestamp')).run().then((clientErrors) => {
                this.broadCastToMonitor('clientErrors', clientErrors);
            }).error(function (err){
                errorHandler.WriteError('Error => clientErrors', err);
            });
        }
        
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
                
                this.updateClientErrors();
                this.updateServerErrors();
            } catch (e) {
                errorHandler.WriteError('monitorOn', e);
            }
        });
        
        socket.on('IsServerUp', (callback) => {
            callback('ServerIsUp');
        });
        
        socket.on('GetAllUsers', (callback) => {
            try {
                schema.r.table('User').run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllUsers', e);
            }
        });
        
        socket.on('GetAllConversations', (callback) => {
            try {
                schema.r.table('Conversation').run().then((data) => {
                    callback(data);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllConversations', e);
            }
        });
        
        socket.on('GetAllMessages', (callback) => {
            try {
                schema.r.table('Message').run().then((data) => {
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
      
    } catch (e) {
        errorHandler.WriteError('runMonitor', e);
    }
};