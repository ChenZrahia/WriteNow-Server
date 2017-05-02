var schema = require('./schema.js');
var errorHandler = require('./ErrorHandler.js');
var FCM = require('./FCM.js');


var messages = [];
this.liveConvs = {};

this.runChat = ((socket, sockets, io) => {
    try {
        schema.friendsOnline.filter({uid: socket.handshake.query.uid}).changes().run().then((cursor) => {
            cursor.each((err, usr) => {
                if (usr && usr.fid != socket.handshake.query.uid) {
                    socket.emit('onlineStatusChanged', usr);
                }
            });
        });
        
        socket.on('enterChat', function(convId) {
            try {
                socket.join(convId);
                updateSeenMessages(convId);
                whosOnlineInConv(convId);
            } catch (e) {
                errorHandler.WriteError('on enterChat', e);
            }
        });
        
        socket.on('exitChat', function(convId) {
            try {
                socket.leave(convId);
                schema.friendsOnline.filter(function (user) {
                      try {
                            return user("uid").eq(socket.handshake.query.uid);
                      } catch (e) {
                            errorHandler.WriteError('runUser=> schema.friendsOnline.filter', e);
                      }}).delete().run();
            } catch (e) {
                errorHandler.WriteError('on exitChat', e);
            }
        });
        
        socket.on('enterChatCall', function(convId) {
            try {
                var roomId = convId + "Call";
                socket.join(roomId);
            } catch (e) {
                errorHandler.WriteError('on enterChatCall', e);
            }
        });
        
        socket.on('exitChatCall', function(convId) {
            try {
                var roomId = convId + "Call";
                socket.leave(roomId);
                io.to(roomId).emit('exitChatCall_server', convId);
            } catch (e) {
                errorHandler.WriteError('on exitChat', e);
            }
        });
        
        socket.on('encryptedMessage' , function(message,publicKey,encrypted2){
            try{
                var CryptoJS = require("crypto-js");
                var SHA256 = require("crypto-js/sha256");
                 var encrypted = 'check 1 2 3';
                 var hash = CryptoJS.SHA256(encrypted);
                 rsa.setPrivateString(publicKey);
                 var decrypted = rsa.decryptWithPrivate(encrypted2); // decrypted == originText
            }
            catch(e)
            {
               errorHandler.WriteError('on encryptrdMessage', e);  
            }
        });
        
        socket.on('deleteMessageServer' , function(messageId,convId){
            try{
                schema.Message.filter({id: messageId, from: socket.handshake.query.uid}).update({ isDeleted: true, content: "", text: "" }).run().then(function(data){
                    if (data.length > 0) {
                        schema.Conversation.get(convId).getJoin({participates: true}).pluck({'participates': {"socketId": true}}).execute().then(function(result){
                            for (var i = 0; i < result.participates.length; i++) {
                                console.log('trying to delete message to: ', result.participates[i].socketId);
                                io.to(result.participates[i].socketId).emit('deleteFriendMessage', messageId);
                            }
                        });
                        //io.to(convId).emit('deleteFriendMessage', messageId);
                    } else {
                        console.log('Unauthorized trying to delete message');
                    }
                });
                // schema.r.table('Message').update({
                // })
            }
            catch(e)
            {
               errorHandler.WriteError('on deleteMessageServer', e);  
            }
            
        });
    
        socket.on('typing', function (message) {
            try {
                message.from = socket.handshake.query.uid;
                if(!messages[message.mid]){
                    message.startTypingTime = Date.now();
                    messages[message.mid] = message;
                }           
                if (!message.content || message.content.length == 0) {
                    delete messages[message.mid];
                }
                io.to(message.convId).emit('typing', message);
            } catch (e) {
                errorHandler.WriteError('on typing', e);
            }
        });
      
        socket.on('saveMessage', function (message) {
            try {
               
                message.from = socket.handshake.query.uid;
                message.sendTime = Date.now();
                if (messages[message.mid]) {
                    message.startTypingTime = messages[message.mid].startTypingTime;
                }
                var Message = new schema.Message(message);
                console.log(message);
                message.lastTypingTime = message.sendTime;
                io.to(message.convId).emit('typing', message);
                Message.save().then(function(doc) {
                    try {
                        delete messages[message.mid];
                    } catch (e) {
                        errorHandler.WriteError('on saveMessage => Message.save => catch', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on saveMessage => Message.save => error', err);
                });
                 
                broadcastToConv('saveMessage', message, message.convId);
                console.error(message.convId);
                schema.Conversation.get(message.convId).getJoin({participates: true}).pluck('participates').execute()
                .then(function(result){
                    try {
                        if (result.participates.length > 0) {            
                            var FromUser = result.participates.filter((user) => { return user.id == message.from });
                            if (FromUser.length == 1 && result.participates) {
                                var FromName = FromUser[0].publicInfo.fullName;
                                schema.r.expr(result.participates).filter(function(user){
                                    try {
                                        return user("id").ne(socket.handshake.query.uid).and(user.hasFields("privateInfo")).and(user("privateInfo").hasFields("tokenNotification"));
                                    } catch (e) {
                                        errorHandler.WriteError('on saveMessage => schema.r.expr(result.participates)..filter', e);
                                    }
                                }).pluck('privateInfo').map((obj) => {
                                    try {
                                        return obj("privateInfo")("tokenNotification");
                                    } catch (e) {
                                        errorHandler.WriteError('on saveMessage => schema.r.expr(result.participates)..map', e);
                                    }
                                }).run().then((_tokens) => {
                                    try {
                                        if (_tokens.length > 0) {
                                            if (message.image && message.content == '') {
                                                message.content = ' 📷 Image';
                                            } else if (message.image && message.content){
                                                message.content = ' 📷 ' + message.content;
                                            }
                                            FCM.sendNotification({
                                                tokens: _tokens,
                                                from: FromName,
                                                content: message.content,
                                                convId: message.convId,
                                                isEncrypted: message.isEncrypted
                                            });
                                        }
                                    } catch (e) {
                                        errorHandler.WriteError('on saveMessage => schema.r.expr(result.participates).filter', e);
                                    }
                                });
                            }
                        }
                    } catch (e) {
                        errorHandler.WriteError('on saveMessage => schema.Conversation.get..then', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on saveMessage => error (1)', err);
                });
            } catch (e) {
                errorHandler.WriteError('on saveMessage', e);
            }
        }); 
        
        function whosOnlineInConv(convId)
        {
            schema.friendsOnline.filter(
              function (user) {
                  try {
                      return user("uid").eq(socket.handshake.query.uid);
                  } catch (e) {
              errorHandler.WriteError('runUser=> schema.friendsOnline.filter', e);
                  }
              }).delete().run();
              
              //insert
              schema.Conversation.getJoin({participates: true}).filter({id: convId}).pluck("participates").map(function (participates) {
                try {
                    
                            return participates("participates").map(function (friend) {
                        try {
                                return {
              uid: socket.handshake.query.uid,
              fid: friend("id"),
              isOnline: friend("isOnline")
                                };
                        } catch (e) {
              errorHandler.WriteError('runUser=> schema.User.filter => map', e);
                        }
                    });
                } catch (e) {
              errorHandler.WriteError('runUser=> schema.User.filter', e);
                }
            }).execute().then(function (result) {
                try {
                    schema.friendsOnline.insert(result[0]).run();
                    
                    
                } catch (e) {
              errorHandler.WriteError('runUser=> schema.User.filter => execute().then', e);
                }
            }).error(function (err){
              errorHandler.WriteError('runUser=> schema.User.filter => error', err);
                    });
                    
            schema.friendsOnline.filter({ uid: socket.handshake.query.uid }).changes().execute().then(function (result) {
                try {
                    result.each((oldValue, newValue) => {
                        socket.emit('friendOnline', newValue);
                    });
                } catch (e) {
                    errorHandler.WriteError('runUser => schema.friendsOnline.filter => execute().then', e);
                }
            }).error(function (err){
                errorHandler.WriteError('runUser => schema.friendsOnline.filter => error', err);
            });
        }
        
        function updateSeenMessages(convId)
        {
            try {
                schema.Conversation.get(convId).getJoin({messages: true})
            .run().then(function(result){
                result.messages = result.messages.filter((msg) => {
                      if (msg.from != socket.handshake.query.uid) {
                        if (!msg.seen) {
                           msg.seen = [];
                           msg.seen.push({uid: socket.handshake.query.uid, when: Date.now()});
                        } else{
                          var count = msg.seen.filter((sn) => {
                            return sn.uid == socket.handshake.query.uid;
                          });
                          if (count.length == 0) {
                            msg.seen.push({uid: socket.handshake.query.uid, when: Date.now()});
                          }
                        }
                      }
                      return true;
                    });
                result.saveAll().then(function(doc){
                });
            }).error(function (err){
                    errorHandler.WriteError('on updateSeenMessages => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('updateSeenMessages', e);
            }
        }
        
        function broadcastToConv(event, data, convId) {
            try {
               
                if (this.liveConvs && this.liveConvs.convId && this.liveConvs.convId.length) {
                    if (this.liveConvs.convId.indexOf(socket) >= 0) {
                        this.liveConvs.convId.forEach(function (liveSocket) {
                            data.displayTime = Date.now();
                            liveSocket.emit(event, data);
                        });
                    }
                    else{
                        errorHandler.WriteError('broadcastToConv', 'Unauthorized!!');
                    }
                }
            } catch (e) {
                errorHandler.WriteError('broadcastToConv', e);
            }
        }
    } catch (e) {
        errorHandler.WriteError('runChat', e);
    }
});

