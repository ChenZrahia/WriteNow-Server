var errorHandler = require('./ErrorHandler.js');
var schema = require('./schema.js');
var users = require('./Users.js');
var chat = require('./Chat.js');
var cnversation = require('./Conversations.js');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var NodeRSA = require('node-rsa');
var secureMode = false;
//server.listen(8686);

var connections = 0;
var sockets = [];
var request = require('request');


var ms = [];
ms['a'] = {a:1};
ms['b'] = {a:2};
ms['c'] = {a:3};

console.log(ms);
try {
    console.log(ms['a']);
} catch (e) {
    console.log(e);
}

schema.User.get('07df1b8a-4aaf-4b41-906f-72db804e10b2').update({isTempUser: true}).run();

schema.User.get('1ad84c2b-2c81-463a-8036-9ec44d95fa70').delete().run();

            // try {
            //     schema.Conversation.getJoin({ participates: true, messages: true }).filter(function (con) {
            //         try {
            //             return con("participates")("id").contains('e2317111-a84a-4c70-b0e9-b54b910833fa');
            //         } catch (e) {
            //             errorHandler.WriteError('on GetUserAllOpenConv => filter', e);
            //         }
            //     }).merge(function (conv) {
                    
            //         try {
            //                 return {
            //                     notifications: conv("messages").filter(function(msg)
            //                     {
            //                         return ((msg.hasFields("seen").not())
            //                                 .or(msg.hasFields("seen").and((msg("seen").contains(function(usr){
            //                                     return usr("uid").ne('e2317111-a84a-4c70-b0e9-b54b910833fa');
            //                                 }))))).and(msg("from").ne('e2317111-a84a-4c70-b0e9-b54b910833fa'))
            //                     }).count()
            //                 };
            //         } catch (e) {
            //             errorHandler.WriteError('on GetUserAllOpenConv => merge', e);
            //         }
            //     }).execute().then(function (result) {
            //         try {
            //             console.log(result);
            //         } catch (e) {
            //             errorHandler.WriteError('on GetUserAllOpenConv => execute', e);
            //         }
            //     }).error(function (err){
            //         errorHandler.WriteError('on GetUserAllOpenConv => execute => error', err);
            //     });
            // } catch (e) {
            //     errorHandler.WriteError('on GetUserAllOpenConv', e);
            // }

// errorHandler.WriteError('on GetUserAllOpenConv => execute', 'werewr');

// schema.User.update({ModifyDate: Date.now()}).then((doc) => {

    
// })

        
                
            
                // schema.Conversation.getJoin({ participates: true, messages: true }).filter(function (con) {
                //     try {
                //         return con("participates")("id").contains('e2317111-a84a-4c70-b0e9-b54b910833fa');
                //     } catch (e) {
                //         errorHandler.WriteError('on GetUserAllOpenConv => filter', e);
                //     }
                // }).merge(function (conv) {
                //     var hasField = true;
                //     try {
                        
                //             return {
                //                 participates: conv("participates").filter(function (user) {
                //                     try {
                //                         return user("id").ne('e2317111-a84a-4c70-b0e9-b54b910833fa');
                //                     } catch (e) {
                //                         errorHandler.WriteError('on GetUserAllOpenConv => merge => filter', e);
                //                     }
                //                 }),
                //                 messages: conv("messages").pluck('content', 'from', 'sendTime').limit(1),
                //                 notifications: hasField
                //             };
                       
                //     } catch (e) {
                //         errorHandler.WriteError('on GetUserAllOpenConv => merge', e);
                //     }
                // }).execute().then(function (result) {
                    
                //         result = result.filter(function (conv) {
                //           return conv.participates.length > 0;
                //         });
                //         console.log(result);
                    
                // }).error(function (err){
                //     errorHandler.WriteError('on GetUserAllOpenConv => execute => error', err);
                // });




//   schema.Conversation.getJoin({ participates: true, messages: true }).filter(function (con) {
//                     try {
//                         return con("participates")("id").contains("e2317111-a84a-4c70-b0e9-b54b910833fa");
//                     } catch (e) {
//                         errorHandler.WriteError('on GetUserAllOpenConv => filter', e);
//                     }
//                 }).merge(function (conv) {
//                     try {
//                         return {
//                             participates: conv("participates").filter(function (user) {
//                                 try {
//                                     return user("id").ne("e2317111-a84a-4c70-b0e9-b54b910833fa");
//                                 } catch (e) {
//                                     errorHandler.WriteError('on GetUserAllOpenConv => merge => filter', e);
//                                 }
//                             }),
//                             messages: conv("messages").pluck('content', 'from', 'sendTime').limit(1)
//                         };
//                     } catch (e) {
//                         errorHandler.WriteError('on GetUserAllOpenConv => merge', e);
//                     }
//                 }).execute().then(function (result) {
//                     try {
//                         for (var i = 0; i < result.length; i++) {
//                             var nameOfSenderName;
//                             var nameOfSender_Array;
//                             if (!result[i].participates.filter) {
//                                 nameOfSenderName = '';
//                             } else {
//                                 nameOfSender_Array = result[i].participates.filter((usr) => {
//                                     if (result[i].messages.length > 0 && usr.id == result[i].messages[0].from) {
//                                         return true;
//                                     } 
//                                     return false;
//                                 });
//                                 if (nameOfSender_Array.length > 0 && nameOfSender_Array[0].publicInfo) {
//                                     nameOfSenderName = nameOfSender_Array[0].publicInfo.fullName;
//                                 } else {
//                                     nameOfSenderName = '';
//                                 }
//                                 if (result[i].messages && result[i].messages.length > 0) {
//                                     result[i].messages[0].lastMsgSender = nameOfSenderName;
//                                 } 
//                             }
//                         }
//                         //if (callback) {
//                          //   callback(result);
//                       // }
//                     } catch (e) {
//                         errorHandler.WriteError('on GetUserAllOpenConv => execute', e);
//                     }
//                 });

// var alert = imports["dialog.alert"].show;
// alert("Success!");

// var plugin = new Dialog("Your Name", main.consumes, {
//     name: "my-plugin-name",
//     allowClose: true,
//     title: "Some Title"
// });

// plugin.show();


// var confirm = imports["dialog.confirm"].show;

// confirm("Save changes?",
//     "Do you want to save these changes?",
//     "The file 'stuff.js' has changed. Click OK to save the changes?",
//     function(){
//         console.log("The user confirmed");
//     },
//     function(){
//         console.log("The user cancelled");
//     });

// var newUser = {
//               pkey: '1234',
//               lastSeen: Date.now(),
//               isOnline: true,
//               publicInfo: {
//                   fullName: 'test no img',
//                   mail: '123fsdf@sdf.com',
//                   gender: 'male'
//               }
//             };
        
// var x = new schema.User(newUser);
// x.save().then(function(doc){
//   console.log(doc);
// });





// var logger = require('winston');

// logger.add(logger.transports.File, { filename: './Errors/logFile.log' });
// logger.error({stackTrace: "functionName", message: "error desc"});




// var token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI5Mzc4MDMyYy1mMGFhLTRmZWYtYmNiNS0yYTc1NzFlNDI5ZmUifQ.khFTEtOOq6_SNBGZwH37zUNiPViQhRGt7-DG9XqeFlw";
// var req_json = {
//   "method": "POST",
//   "url": "https://api.ionic.io/push/notifications",
//   json: true,
//   "headers": {
//     "Content-Type": "application/json",
//     "Authorization": "Bearer " + token
//   }
// };
// //'cN644KzV8n8:APA91bEsei3_OpcYtxbkEZaUWoCVMJg1iYsdUbjdQqKz6RtNtCy_ibhUdq2davkiwQT6jfmZFWJqQaDoPiNeYNoKDfUwGr0E6OdU4ymSEM5cr9DcUdB4NMPSAOeK5-H5vN9FU35gGtEN',
//                       req_json.body= {
//                       "tokens": ['finD-_7GSl8:APA91bFvGXVaSSA2m8e8A6h8r-M0O1cauzofpJszuLM6seVLwSz3fwxTNRNexNv81PBn3hFzveUwmFjQXlpss2uDsgjoljkZJ33Gp2_pOH5TCYk3j-5To09LMdoazV18JQv75spWoKpB'],
//                       "profile": "pushserver",
//                       "notification": {
//                         "title": "system test: ",
//                         "message": "bla bla",
//                         "android": {
//                           "title": "Rugbin: ",
//                           "message": "נוטיפיקיישן עם סאונד!!!",
//                           "image": "http://www.sightcall.com/wp-content/uploads/2015/01/messages-icon.png"
//                           ,"icon": "ic_action_remove"
//                           ,"sound": "icq"
//                         }
//                       }
//                     }
                  
//                   request(req_json, function(err, response, body) {
//                     if (err) throw new Error(err);
//                     console.log(body);
//                   });