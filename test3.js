var schema = require('./schema.js');
var users = require('./Users.js');
var errorHandler = require('./ErrorHandler.js');
var moment = require('moment');


schema.Conversation.getJoin({ participates: true }).filter({ id: '5a375524-f869-47ef-8ef0-efba5659a555' }).run().then((res) => {
    console.log(res[0].participates.length);
});
/*
                schema.Conversation.getJoin({ participates: true, messages: true }).filter({ id: convId }).run().then(function (result) {
                    try {
                        if (lastMessageTime == null) {
                             console.log('lastMessageTime null');
                        } else {
                            lastMessageTime = new Date(lastMessageTime);
                            result[0].messages = result[0].messages.filter((msg) => {
                                //msg.sendTime = new Date(msg.sendTime); 
                                if (msg.from == socket.handshake.query.uid) {
                                    return false;
                                } else if(msg.sendTime > lastMessageTime  && !msg.isDeleted){
                                    return true;
                                } else if (msg.sendTime <= lastMessageTime && msg.isDeleted) {
                                    return true;
                                } else {
                                    return false;
                                }
                            });
                        }
                        
                        result[0].participates = result[0].participates.map((user) => {
                            return {id: user.id,
                                    isOnline: user.isOnline
                                };
                        console.log('result GetConvChangesById:');
                        console.log(result[0]);
                        });
                        if (callback) {
                            callback(result[0]);
                        }
                    } catch (e) {
                        errorHandler.WriteError('on GetConvChangesById => schema.Conversation', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on GetConvChangesById => schema.Conversation => error', err);
                });*/