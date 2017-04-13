var schema = require('./schema.js');
var logger = require('winston');

logger.add(logger.transports.File, {
    filename: 'all-logs.log',
    handleExceptions: true,
    humanReadableUnhandledException: true
});

var _socket;
var _updateServerError;

this.WriteError = function (stackTrace, e) {
    try {
        var msg = e.message || e;
        var uid = '';
        if (_socket && _socket.handshake && _socket.handshake.query) {
            uid = _socket.handshake.query.uid;
        }
        var errObj = new schema.Error({ stackTrace: stackTrace,
                                        message: msg,
                                        isClient: false,
                                        userId: uid,
                                        timestamp: Date.now()});
        errObj.save().then(function(doc){
                //console.log(doc);
            });
        if (logger) {
            logger.error({ stackTrace: stackTrace, message: msg, isClient: false, userId: uid });
        }
        _updateServerError();
    } catch (e) {
        console.log(e);
    }
};

this.runErrorHandler = function (socket, updateClientError, updateServerError) {
    try {
        _socket = socket;
        _updateServerError = updateServerError;
        socket.on('WriteError', (message, stackTrace) => {
            console.log('message', message);
            console.log('stackTrace', stackTrace);
            var errObj = new schema.Error({ stackTrace: stackTrace,
                                message: message,
                                isClient: true,
                                userId: socket.handshake.query.uid,
                                timestamp: Date.now()});
            errObj.save().then(function(doc){
                //console.log(doc);
            });
            logger.error({ stackTrace: stackTrace, message: message, isClient: true, userId: socket.handshake.query.uid });
            updateClientError();
        });

        socket.on('WriteLog', function (message) {
            logger.log('info', message);
        });

        this.sendMessageToClient = function (msg, type) {
            socket.emit('sendMessageToClient', msg, type);
        };
    } catch (e) {
        this.WriteError('runErrorHandler', e);
    }
};