var schema = require('./schema.js');
var request = require('request');
var errorHandler = require('./ErrorHandler.js');
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI5Mzc4MDMyYy1mMGFhLTRmZWYtYmNiNS0yYTc1NzFlNDI5ZmUifQ.khFTEtOOq6_SNBGZwH37zUNiPViQhRGt7-DG9XqeFlw";
var FCM = require('./FCM.js');
var moment = require('moment');

this.liveCalls = {};

this.runLiveConvs = (function(clsObj) { return function(socket, sockets, io){
    try {
        console.log(socket.handshake.query.uid + " Trying To Connect To The Server...");
        
        socket.on('makeCall', function(callback, convId) {
            try {
                //לא למחוק!!
                // var newChat = new schema.LiveChat({
                //     callDateTime: moment().format(),
                //     callerId: socket.handshake.query.uid,
                //     receiverId: receiverId
                //  });
                //  newChat.save((error, doc) => {
                //         if (doc && callback) {
                //             callback(doc);
                //             return;
                //         }
                //         else {
                //             errorHandler.WriteError('runLiveConvs => makeCall.save' , '(doc && callback) = false');
                //             if (callback) {
                //                 callback('error');
                //                 return;
                //             }
                //         }
                //         if (error) {
                //             errorHandler.WriteError('runLiveConvs => makeCall.save', error);
                //         }
                //     }).error(function (err){
                //     errorHandler.WriteError('runLiveConvs => newUser.save => error', err);
                // });
                
                
                //-------
                schema.Conversation.get(convId).getJoin({participates: true}).pluck('participates').execute()
                .then(function(result){
                    try {
                        if (result.participates.length > 0) {            
                            var FromUser = result.participates.filter((user) => { return user.id == socket.handshake.query.uid });
                            if (FromUser.length == 1 && result.participates) {
                                var FromName = FromUser[0].publicInfo.fullName;
                                var FromPicture = FromUser[0].publicInfo.picture;
                                schema.r.expr(result.participates).filter(function(user){
                                    try {
                                        return user("id").ne(socket.handshake.query.uid).and(user.hasFields("privateInfo")).and(user("privateInfo").hasFields("tokenNotification"));
                                    } catch (e) {
                                        errorHandler.WriteError('makeCall => schema.r.expr(result.participates)..filter', e);
                                    }
                                }).pluck('privateInfo').map((obj) => {
                                    try {
                                        return obj("privateInfo")("tokenNotification");
                                    } catch (e) {
                                        errorHandler.WriteError('makeCall => schema.r.expr(result.participates)..map', e);
                                    }
                                }).run().then((_tokens) => {
                                    try {
                                        if (_tokens.length > 0) {
                                            FCM.sendCall({
                                                tokens: _tokens,
                                                from: FromName,
                                                picture: FromPicture,
                                                convId: convId
                                            });
                                        }
                                    } catch (e) {
                                        errorHandler.WriteError('makeCall => schema.r.expr(result.participates).filter', e);
                                    }
                                });
                            }
                        }
                    } catch (e) {
                        errorHandler.WriteError('makeCall => schema.Conversation.get..then', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('makeCall => error (1)', err);
                });
                
                
                
                //----
                
                // schema.User.get(socket.handshake.query.uid).run().then((sender) => {
                //     schema.User.get(receiverId).run().then((receiver) => {
                //         if (receiver && sender && receiver.privateInfo && receiver.privateInfo.tokenNotification && sender.publicInfo) {
                //             console.log(sender.publicInfo.fullName + ' is calling!');
                //             FCM.sendCall({
                //                 tokens: [receiver.privateInfo.tokenNotification],
                //                 from: sender.publicInfo.fullName
                //             });
                //         } else {
                //             console.log(receiver , sender, 'receiver && sender is False');
                //         }
                //     });
                // });
            } catch (e) {
                errorHandler.WriteError('on makeCall', e);
            }
        });
        
    } catch (e) {
        errorHandler.WriteError('runLiveConvs', e);
    }
};
})(this);

