var schema = require('./schema.js');
var users = require('./Users.js');
var errorHandler = require('./ErrorHandler.js');
var moment = require('moment');

this.runConversations = function (socket, sockets, logger) {
    try {
        var GetConvByContact = function (phoneNumber, fullName) {
            try {
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
                                return {
                                    id: user.id,
                                    phoneNumber: user.phoneNumber,
                                    publicKey: user.pkey
                                };
                            });
                            var res = result[0];
                            res.newUsr = result[0].participates;
                            socket.emit('returnConv', res);
                        }
                        else {
                            var newConv = new schema.Conversation({
                                isEncrypted: false,
                                manager: socket.handshake.query.uid,
                                isGroup: false
                            });
                            function saveNewConv(newConv, newUsr){
                                newConv.saveAll({ participates: true }).then(function (result) {
                                    result.participates = result.participates.map((usr) => {
                                        return {id: usr};
                                    });
                                    if (newUsr) {
                                        result.newUsr = {
                                            id: newUsr.id,
                                            phoneNumber: newUsr.phoneNumber
                                        };
                                    }
                                    socket.emit('returnConv', result);
                                }).error(function (err) {
                                    errorHandler.WriteError('GetConvByContact => newConv.saveAll', err);
                                });
                            }
                            schema.User.filter({phoneNumber: phoneNumber}).run().then((friendUsr) => {
                                if (friendUsr && friendUsr.length > 0) {
                                    newConv.participates = [socket.handshake.query.uid, friendUsr[0].id];
                                    saveNewConv(newConv, {
                                        id: friendUsr[0].id,
                                        phoneNumber: friendUsr[0].phoneNumber
                                    });
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
                                        saveNewConv(newConv, newUsr);
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

        socket.on('GetConvById', function (convId) { //to delete ????
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
                schema.Conversation.getJoin({ participates: true, messages: true }).pluck({
                    id: true,
                    isEncrypted: true, 
                    isGroup: true,
                    manager: true,
                    messages: true,
                    participates: {
                        id: true,
                        isOnline: true,
                        pkey: true
                    }
                }).filter({ id: convId }).run().then(function (result) {
                    try {
                        if (lastMessageTime == null) {
                             console.log('lastMessageTime null');
                        } else {
                            lastMessageTime = new Date(lastMessageTime);
                            result[0].messages = result[0].messages.filter((msg) => {
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
                        
                        //pluck 13.4.17
                        // result[0].participates = result[0].participates.map((user) => {
                        //     return {id: user.id,
                        //             isOnline: user.isOnline,
                        //             pkey: user.pkey
                        //         };
                        //});
                        console.log(result[0]);
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
                if (phoneNumber && fullName) {
                    GetConvByContact(phoneNumber, fullName);
                } else {
                    errorHandler.WriteError('on GetConvByContact => isUserExist', 'phoneNumber or/and fullName is NULL. phoneNumber: ' + phoneNumber + ' fullName: ' + fullName);
                }
                
            } catch (e) {
                errorHandler.WriteError('on GetConvByContact => isUserExist', e);
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
                                if (nameOfSender_Array.length > 0 && nameOfSender_Array[0] && nameOfSender_Array[0].publicInfo) {
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
        
        var findNewFriends = function(uidArr, callback) {
            try {
                 schema.r.db("WriteNow").table('Conversation_User').filter(function(conv_user) {
                    return conv_user("User_id").eq(socket.handshake.query.uid);
                }).then((convs) => {
                    try {
                        if (convs) {
                            convs = convs.map((conv) => {
                                return conv.Conversation_id;
                            });
                            schema.r.db("WriteNow").table('Conversation_User').filter((conv_user) => {
                                return schema.r.expr(convs).contains(conv_user("Conversation_id")).and(schema.r.expr(uidArr).contains(conv_user("User_id")).not());
                            }).then(function(users){
                                users = users.map(x => x.User_id);
                                schema.User.filter((usr) => {
                                    return schema.r.expr(users).contains(usr("id"));
                                }).run().then((result) => {
                                    callback(result, 'findNewFriends');
                                });
                            });
                        }
                        else {
                            errorHandler.WriteError('this.findNewFriends => convs', 'convs is null or undefined');
                        }
                    } catch (e) {
                        errorHandler.WriteError('this.findNewFriends => convs catch', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('this.findNewFriends => convs => error', err);
                });
            } catch (e) {
                 errorHandler.WriteError('this.findNewFriends', e);
            }
        }
        
        function GetAllUserConvChanges(uidArr, convIdArray, callback) {
            try {
                var countOfResults = 0;
                var finalResult = {};
                var InernalCallback = (data, funcName) => {
                    countOfResults++;
                    if (funcName == 'findNewFriends') {
                        finalResult.NewFriends = data;
                    } else {
                        finalResult.ConvChanges = data;
                    }
                    if (countOfResults >= 2) {
                        callback(finalResult);
                    }
                };
                
                findNewFriends(uidArr, InernalCallback);
                
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
                                messages: conv("messages").filter((msg) => { return msg("content").ne(''); }).orderBy(schema.r.desc('sendTime')).pluck('content', 'from', 'sendTime', 'isEncrypted').limit(1),
                                notifications: conv("messages").filter(function(msg)
                                {
                                    return ((msg.hasFields("seen").not())
                                            .or(msg.hasFields("seen").and((msg("seen").contains(socket.handshake.query.uid))))).and(msg("from").ne(socket.handshake.query.uid)).and(msg("content").ne(''))
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
                                if(!conv.isGroup && conv.participates && conv.participates[0] && conv.participates[0].publicInfo){
                                    conv.groupName = conv.participates[0].publicInfo.fullName;
                                    conv.groupPicture = conv.participates[0].publicInfo.picture;
                                }
                                if(conv.messages.length > 0){
                                    conv.lastMessage = conv.messages[0].content;
                                    conv.lastMessageTime = conv.messages[0].sendTime;
                                    conv.lastMessageEncrypted = conv.messages[0].isEncrypted;
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
                        if (InernalCallback) {
                            convIdArray.map((convToDelete) => {
                                result.push({id: convToDelete, deletedConv: true});
                            });
                            InernalCallback(result, 'changes');
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
        socket.on('GetLiveChats', (callback) => {
            try {
                if (!callback) {
                    return;
                }
                
                schema.LiveChat.getJoin({"Conversation": {"participates": true}})
                        .pluck({"Conversation":{"participates": {"id": true, "publicInfo": {"fullName": true}}, "groupName": true}, "receiverId": true, "id": true, "callerId": true, "callType": true, "callDateTime": true, "duration": true})
                        .filter(function(chat){
                            return chat("Conversation")("participates").contains(function(user){
                                return user("id").eq(socket.handshake.query.uid);
                            }); 
                        })
                        .map(function(chat){
                            if (chat("Conversation").hasFields("groupName").not()) {
                                return chat.merge({"Conversation": {"groupName": chat("Conversation")("participates").filter(function(user){
                                    return user("id").ne(socket.handshake.query.uid);
                                })(0)("publicInfo")("fullName")}});
                            } else {
                                return chat;
                            }
                        })
                        .orderBy(schema.r.desc('callDateTime'))
                        .run().then((data) => {
                            callback(data);
                        });
            } catch (e) {
                 errorHandler.WriteError('getAllCalls', e);
            }
        });
    } catch (e) {
        errorHandler.WriteError('runConversations', e);
    }
};