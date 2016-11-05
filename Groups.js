var schema = require('./schema.js');
var errorHandler = require('./ErrorHandler.js');

this.runGroup = function (socket, sockets) {
    try {
        socket.on('openNewGroup', function (group, participates, callback) {
            try {
                if (!group.groupName || group.groupName.length == 0 || !participates || participates.length < 1) {
                    errorHandler.WriteError('openNewGroup => validate', {message: 'groupName is undefined or participates.length < 2'});
                    if (callback) {
                        callback(false);
                    }
                } else {
                    group.isGroup = true;
                    group.manager = socket.handshake.query.uid;
                    participates.push(socket.handshake.query.uid);
                    var newGroup = new schema.Conversation(group);
                    newGroup.participates = participates;
                    newGroup.saveAll({ participates: true }).then((doc) => {
                        if (callback) {
                            callback(true);
                        }
                    }).error(function (err) {
                        errorHandler.WriteError('openNewGroup => newGroup.saveAll', err);
                        if (callback) {
                            callback(false);
                        }
                    });
                }
            } catch (e) {
                errorHandler.WriteError('openNewGroup', e);
            }
        });
    } catch (e) {
        errorHandler.WriteError('runGroup', e);
    }
};  