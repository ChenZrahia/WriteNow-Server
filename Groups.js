var schema = require('./schema.js');
var errorHandler = require('./ErrorHandler.js');

this.runGroup = function(socket, sockets) {
    try {
        socket.on('openNewGroup', function(group, participates, callback) {
            try {
                if (!group.groupName || group.groupName.length == 0 || !participates || participates.length < 1) {
                    errorHandler.WriteError('openNewGroup => validate', {
                        message: 'groupName is undefined or participates.length < 2'
                    });
                    if (callback) {
                        callback(false);
                    }
                }
                else {
                    group.isGroup = true;
                    group.manager = socket.handshake.query.uid;
                    participates.push(socket.handshake.query.uid);
                    var newGroup = new schema.Conversation(group);
                    newGroup.participates = participates;
                    newGroup.saveAll({
                        participates: true
                    }).then((doc) => {
                        if (callback) {
                            callback(doc);
                        }
                    }).error(function(err) {
                        errorHandler.WriteError('openNewGroup => newGroup.saveAll', err);
                        if (callback) {
                            callback(false);
                        }
                    });
                }
            }
            catch (e) {
                errorHandler.WriteError('openNewGroup', e);
            }
        });

        
        socket.on('getConvParticipates', (newUsers, callback) => {
            try {
                schema.User.filter((usr) => {
                    try {
                        return (schema.r.expr(newUsers).contains(usr("id")));
                    } catch (e) {
                        errorHandler.WriteError('getConvParticipates => schema.User.filter', e);
                    }
                }).run().then(function (myFriends) {
                    try {
                        console.log(myFriends);
                        console.log('getConvParticipates');
                        if (callback) {
                            callback(myFriends);
                        }
                    } catch (e) {
                        errorHandler.WriteError('getConvParticipates => schema.User.get', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('getConvParticipates => schema.User.get => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('getConvParticipates', e);
            }
        });
        
        socket.on('getGroupParticipatesId', (convId, callback) => {
            try {
                console.log('getGroupParticipatesId', convId);
                schema.Conversation.getJoin({ participates: true }).filter({id: convId}).pluck({participates: {id: true}})
                .run()
                .then((result) => {
                    console.log(result);
                    console.log(result[0]);
                    console.log(result.length);
                    if (result.length > 0) {
                        var idsArr = result[0].participates.map((x) => {
                            return x.id;
                        });
                        console.log(idsArr);
                        callback(idsArr);
                    }
                });
            } catch (e) {
                errorHandler.WriteError('getConvParticipates', e);
            }
        });
        
        socket.on('updateGroupInfo', function(group, callback) {
            try {
                if (!group.groupName || group.groupName.length == 0 || !group.convId) {
                    errorHandler.WriteError('updateGroupInfo => validate', {
                        message: 'groupName or convId is undefined'
                    });
                    if (callback) {
                        callback(false);
                    }
                }
                else {
                    schema.Conversation.get(group.convId).update({
                        groupName: group.groupName,
                        groupPicture: group.groupPicture
                    }).run().then((data) => {
                        if (callback) {
                            callback(data);
                        }
                    }).error(function(err) {
                        errorHandler.WriteError('updateGroupInfo => schema.Conversation.get(group.convId).update', err);
                        if (callback) {
                            callback(false);
                        }
                    });
                }
            }
            catch (e) {
                errorHandler.WriteError('updateGroupInfo', e);
            }
        });

        socket.on('updateGroupParticipants', function(_convId, _participates, callback) {
            try {
                if (!_participates || _participates.length < 2) {
                    errorHandler.WriteError('updateGroupParticipants => validate', {
                        message: '_participates.length < 2'
                    });
                    if (callback) {
                        callback(false);
                    }
                }
                else {
                    schema.r.table("Conversation_User").filter({Conversation_id: _convId}).pluck('User_id').run().then((participates) => {
                        for (var i = 0; i < _participates.length; i++) {
                            var res = participates.filter(x => {return x.User_id == _participates[i]});
                            if (res.length == 0) {
                                schema.r.table("Conversation_User").insert({
                                    Conversation_id: _convId,
                                    User_id: _participates[i]
                                }).run();
                            }
                        }
                        for (var i = 0; i < participates.length; i++) {
                            if (_participates.indexOf(participates[i].User_id) < 0) {
                                schema.r.table("Conversation_User").filter({Conversation_id: _convId, User_id: participates[i].User_id}).delete().run();
                            }
                        }
                        callback(true);
                    });
                }
            }
            catch (e) {
                errorHandler.WriteError('updateGroupParticipants', e);
            }
        });
    }
    catch (e) {
        errorHandler.WriteError('runGroup', e);
    }
};
