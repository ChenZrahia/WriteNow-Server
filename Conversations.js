var schema = require('./schema.js');
var users = require('./Users.js');
var errorHandler = require('./ErrorHandler.js');
var moment = require('moment');

this.runConversations = function (socket, sockets, logger) {
    try {
        var GetConvByContact = function (phoneNumber, fullName) {
            try {
                console.log(' GetConvByContact 2 ' + phoneNumber + fullName);
                schema.Conversation.getJoin({ participates: true, messages: true }).filter(function (conv) {
                    try {
                        return conv("isGroup").eq(false).and(conv("participates").count().eq(2)).and(
                               conv("participates")("id").contains(socket.handshake.query.uid).and(conv("participates")("phoneNumber").contains(phoneNumber)));
                    } catch (e) {
                        errorHandler.WriteError('GetConvByContact => filter', e);
                    }
                }).execute().then(function (result) {
                    try {
                        if (result && result.length > 0) {
                            result[0].participates = result[0].participates.map((user) => {
                                return {id: user.id};
                            });
                            var res = result[0];
                            socket.emit('returnConv', res);
                        }
                        else {
                            var newConv = new schema.Conversation({
                                isEncrypted: false,
                                manager: socket.handshake.query.uid,
                                isGroup: false
                            });
                            function saveNewConv(newConv){
                                newConv.saveAll({ participates: true }).then(function (result) {
                                    result.participates = result.participates.map((conv) => {
                                        return {id: conv.id};
                                    });
                                    socket.emit('returnConv', result);
                                }).error(function (err) {
                                    errorHandler.WriteError('GetConvByContact => newConv.saveAll', err);
                                });
                            }
                            schema.User.filter({phoneNumber: phoneNumber}).run().then((friendUsr) => {
                                if (friendUsr && friendUsr.length > 0) {
                                    newConv.participates = [socket.handshake.query.uid, friendUsr[0].id];
                                    saveNewConv(newConv);
                                } else {
                                    var now = moment().format(); //now
                                    var newUsr = new schema.User({
                                        isOnline: false,
                                        phoneNumber: phoneNumber,
                                        ModifyDate: now,
                                        ModifyPicDate: now,
                                        isTempUser: true,
                                        publicInfo: {
                                            fullName: fullName
                                        }
                                    });
                                    newUsr.saveAll().then((usr) => {
                                        newConv.participates = [socket.handshake.query.uid, usr.id];
                                        saveNewConv(newConv);
                                    });
                                }
                            });

                        }
                    } catch (e) {
                        errorHandler.WriteError('GetConvByContact => schema.Conversation..execute', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('GetConvByContact => schema.Conversation..execute => error', err);
                });

            } catch (e) {
                errorHandler.WriteError('GetConvByContact', e);
            }
        };

        socket.on('GetConvById', function (convId) {
            try {
                schema.Conversation.getJoin({ messages: true }).filter({ id: convId }).run().then(function (result) {
                    try {
                        socket.emit('returnConv', result[0]);
                    } catch (e) {
                        errorHandler.WriteError('on GetConvById => schema.Conversation', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on GetConvById => schema.Conversation => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('on GetConvById', e);
            }
        });
        
        socket.on('GetConvChangesById', function (convId, lastMessageTime, callback) {
            try {
                schema.Conversation.getJoin({ participates: true, messages: true }).filter({ id: convId }).run().then(function (result) {
                    try {
                        if (lastMessageTime == null) {
                             console.log('lastMessageTime null');
                        } else {
                            lastMessageTime = new Date(lastMessageTime);
                            result[0].messages = result[0].messages.filter((msg) => {
                                console.log(msg.sendTime, lastMessageTime);
                                 if(msg.sendTime > lastMessageTime  && !msg.isDeleted){
                                    return true;
                                } else if (msg.sendTime <= lastMessageTime && msg.isDeleted) {
                                    return true;
                                } else {
                                    return false;
                                }
                            });
                        }
                        
                        result[0].participates = result[0].participates.map((user) => {
                            return {id: user.id};
                        });
                        if (callback) {
                            callback(result[0]);
                        }
                    } catch (e) {
                        errorHandler.WriteError('on GetConvChangesById => schema.Conversation', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on GetConvChangesById => schema.Conversation => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('on GetConvChangesById', e);
            }
        });
        

        socket.on('GetConvByContact', function (phoneNumber, fullName) {
            try {
                console.log(' GetConvByContact 1');
                GetConvByContact(phoneNumber, fullName);
            } catch (e) {
                errorHandler.WriteError('on GetConvByContact => isUserExist', 'user not exist');
            }
        });

        socket.on('GetUserAllOpenConv', function (callback) {
            try {
                schema.Conversation.getJoin({ participates: true, messages: true }).filter(function (con) {
                    try {
                        return con("participates")("id").contains(socket.handshake.query.uid);
                    } catch (e) {
                        errorHandler.WriteError('on GetUserAllOpenConv => filter', e);
                    }
                }).merge(function (conv) {
                    
                    try {
                            return {
                                participates: conv("participates").filter(function (user) {
                                    try {
                                        return user("id").ne(socket.handshake.query.uid);
                                    } catch (e) {
                                        errorHandler.WriteError('on GetUserAllOpenConv => merge => filter', e);
                                    }
                                }),
                                messages: conv("messages").orderBy(schema.r.desc('sendTime')).pluck('content', 'from', 'sendTime').limit(1),
                                notifications: conv("messages").filter(function(msg)
                                {
                                    return ((msg.hasFields("seen").not())
                                            .or(msg.hasFields("seen").and((msg("seen").contains(function(usr){
                                                return usr("uid").ne(socket.handshake.query.uid);
                                            }))))).and(msg("from").ne(socket.handshake.query.uid))
                                }).count()
                            };
                    } catch (e) {
                        errorHandler.WriteError('on GetUserAllOpenConv => merge', e);
                    }
                }).execute().then(function (result) {
                    try {
                        result = result.filter(function (conv) {
                            
                           return conv.participates.length > 0;
                        });

                        for (var i = 0; i < result.length; i++) {
                            var nameOfSenderName;
                            var nameOfSender_Array;
                            
                            if (!result[i].participates.filter) {
                                nameOfSenderName = '';
                            } else {
                                nameOfSender_Array = result[i].participates.filter((usr) => {
                                    if (result[i].messages && result[i].messages.length > 0 && usr.id == result[i].messages[0].from) {
                                        return true;
                                    } 
                                    return false;
                                });
                                if (nameOfSender_Array.length > 0 && nameOfSender_Array[0].publicInfo) {
                                    nameOfSenderName = nameOfSender_Array[0].publicInfo.fullName;
                                } else {
                                    nameOfSenderName = '';
                                }
                                if (result[i].messages && result[i].messages.length > 0) {
                                    result[i].messages[0].lastMsgSender = nameOfSenderName;
                                }
                            }
                        }
                        if (callback) {
                            callback(result);
                        }
                    } catch (e) {
                        errorHandler.WriteError('on GetUserAllOpenConv => execute', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on GetUserAllOpenConv => execute => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('on GetUserAllOpenConv', e);
            }
        });
        
        function GetAllUserConvChanges(convIdArray, callback) {
            try {
                console.log('start GetAllUserConvChanges');
                schema.Conversation.getJoin({ participates: true, messages: true }).filter(function (con) {
                    try {
                        return con("participates")("id").contains(socket.handshake.query.uid);
                    } catch (e) {
                        errorHandler.WriteError('on GetUserAllOpenConv => filter', e);
                    }
                }).merge(function (conv) {
                    try {
                            return {
                                participates: conv("participates").filter(function (user) {
                                    try {
                                        return user("id").ne(socket.handshake.query.uid);
                                    } catch (e) {
                                        errorHandler.WriteError('on GetUserAllOpenConv => merge => filter', e);
                                    }
                                }),
                                messages: conv("messages").orderBy(schema.r.desc('sendTime')).pluck('content', 'from', 'sendTime').limit(1),
                                notifications: conv("messages").filter(function(msg)
                                {
                                    return ((msg.hasFields("seen").not())
                                            .or(msg.hasFields("seen").and((msg("seen").contains(function(usr){
                                                return usr("uid").ne(socket.handshake.query.uid);
                                            }))))).and(msg("from").ne(socket.handshake.query.uid))
                                }).count()
                            };
                    } catch (e) {
                        errorHandler.WriteError('on GetUserAllOpenConv => merge', e);
                    }
                }).execute().then(function (result) {
                    try {
                        if (!convIdArray) {
                            convIdArray = [];
                        }
                        result = result.filter((conv) => {
                            var indexOfConv = convIdArray.indexOf(conv.id);
                            if(conv.participates.length > 0 || indexOfConv >= 0) {
                                if(!conv.isGroup){
                                    conv.groupName = conv.participates[0].publicInfo.fullName;
                                    conv.groupPicture = conv.participates[0].publicInfo.picture;
                                }
                                if(conv.messages.length > 0){
                                    conv.lastMessage = conv.messages[0].content;
                                    conv.lastMessageTime = conv.messages[0].sendTime;
                                }
                                if (indexOfConv >= 0) {
                                    convIdArray.splice(indexOfConv,1);
                                    conv.isExist = true;
                                    delete conv.isGroup;
                                    delete conv.groupPicture;
                                }
                                delete conv.participates;
                                delete conv.messages;
                                return true;
                            }
                            return false;
                        });
                        console.log('check if');
                        if (callback) {
                            convIdArray.map((convToDelete) => {
                                result.push({id: convToDelete, deletedConv: true});
                            });
                            console.log('GetAllUserConvChanges result: ');
                            console.log(result);
                            callback(result);
                        }
                        else{
                            console.log('check else');
                        }
                    } catch (e) {
                        errorHandler.WriteError('on GetUserAllOpenConv => execute', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on GetUserAllOpenConv => execute => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('on GetUserAllOpenConv', e);
            }
        }
    
        socket.on('GetAllUserConvChanges', GetAllUserConvChanges);
        
        socket.on('GetNotificationsForConv', function(fid) {
            
        });
       
        socket.on('GetAllConvOfUser', function (callback) {
            try {
                schema.Conversation.filter(function (conv) {
                    try {
                        return conv("participates").contains(socket.handshake.query.uid);
                    } catch (e) {
                        errorHandler.WriteError('on GetAllConvOfUser => schema.Conversation.filter', e);
                    }
                }).pluck("participates").run().then(function (result) {
                    try {
                        if (callback) {
                            callback(result);
                        }
                    } catch (e) {
                        errorHandler.WriteError('on GetAllConvOfUser => schema.Conversation..then', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on GetAllConvOfUser => schema.Conversation..then => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('on GetAllConvOfUser', e);
            }
        });

        socket.on('GetAllConvs', function () {
            try {
                schema.Conversation.filter(function (conv) {
                    try {
                        return (conv.participates.indexOf(socket.handshake.query.uid) >= 0);
                    } catch (e) {
                        errorHandler.WriteError('on GetAllConvs => schema.Conversation.filter', e);
                    }
                }).then(function (convs) {
                    try {
                        if (convs) {
                            socket.emit('GetAllConvs', convs);
                        }
                        else {
                            errorHandler.WriteError('on GetAllConvs => convs', 'convs is null or undefined');
                        }
                    } catch (e) {
                        errorHandler.WriteError('on GetAllConvs => convs catch', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on GetAllConvs => convs => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('on GetAllConvs', e);
            }
        });

    } catch (e) {
        errorHandler.WriteError('runConversations', e);
    }
};