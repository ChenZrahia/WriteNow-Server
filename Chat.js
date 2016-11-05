var schema = require('./schema.js');
var request = require('request');
var errorHandler = require('./ErrorHandler.js');
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI5Mzc4MDMyYy1mMGFhLTRmZWYtYmNiNS0yYTc1NzFlNDI5ZmUifQ.khFTEtOOq6_SNBGZwH37zUNiPViQhRGt7-DG9XqeFlw";

var req_json = {
    "method": "POST",
    "url": "https://api.ionic.io/push/notifications",
    json: true,
    "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    }
};

var messages = [];
this.liveConvs = {};

this.runChat = (function(clsObj) { return function(socket, sockets, io){
    try {
        socket.on('enterChat', function(convId) {
            try {
                socket.join(convId);
                updateSeenMessages(convId);
            } catch (e) {
                errorHandler.WriteError('on enterChat', e);
            }
        });
    
        socket.on('exitChat', function(convId) {
            try {
                socket.leave(convId);
            } catch (e) {
                errorHandler.WriteError('on exitChat', e);
            }
        });
    
        socket.on('typing', function (message) {
            try {
                message.from = socket.handshake.query.uid;
                console.log(message);
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
                                }).pluck('privateInfo').map(function(obj){
                                    try {
                                        return obj("privateInfo")("tokenNotification");
                                    } catch (e) {
                                        errorHandler.WriteError('on saveMessage => schema.r.expr(result.participates)..map', e);
                                    }
                                }).run().then(function(tokens){
                                    try {
                                        if (tokens.length > 0) {
                                            req_json.body= {
                                                "tokens": tokens,
                                                "profile": "pushserver",
                                                "notification": {
                                                    "title": FromName + ": ",
                                                    "message": message.content,
                                                    "android": {
                                                        "title": FromName + ": ",
                                                        "message": message.content,
                                                        "image": "http://previews.123rf.com/images/faysalfarhan/faysalfarhan1501/faysalfarhan150100946/35664985-Chat-icon-purple-glossy-round-button-Stock-Photo.jpg"
                                                      ,"icon": "chat",
                                                        "sound": "Icq_Message_Sound"
                                                    }
                                                }
                                            }
                  
                                            request(req_json, function(err, response, body) {
                                                if (err) {
                                                    errorHandler.WriteError('on saveMessage => request', err);
                                                }
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
                if (clsObj.liveConvs.convId && clsObj.liveConvs.convId.length) {
                    if (clsObj.liveConvs.convId.indexOf(socket) >= 0) {
                        clsObj.liveConvs.convId.forEach(function (liveSocket) {
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
};
})(this);

