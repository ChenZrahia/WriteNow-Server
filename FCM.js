var request = require('request');
var errorHandler = require('./ErrorHandler.js');
var moment = require('moment');

var GCM = function(api_key) {
  this._api_key = api_key;
}

GCM.prototype.send = function(msg, callback) {
  request.post({
    uri: 'https://fcm.googleapis.com/fcm/send',
    json: msg,
    headers: {
      Authorization: 'key=' + this._api_key,
      contentType: 'application/json'
    }
  }, function(err, response, body) {
    callback(err, body);
  })
}

this.gcm = new GCM("AIzaSyBmWNAm2l1BZBaZAqdPZJsgc20praN7UJk");

this.sendNotification = ((data) => {
    try {
      console.log(data);
        var msg = {
          registration_ids: data.tokens, 
          collapse_key: "writeNow", 
          time_to_live: 180, // just 30 minutes
          notification: {
            "title": data.from,
            "body": data.content,
            "sound": "default"
          },
          data: {
            title: data.from,
            message: data.content,
            playSound: true,
            vibrate: true,
            "convId": data.convId,
            message_time: moment().format(),
            isEncrypted: data.isEncrypted
          }
        };
        this.gcm.send(msg, (err, response) => {
          console.log(response);
        });
    } catch (e) {
        errorHandler.WriteError('sendNotification', e);
    }
});

this.sendCall = ((data) => {
    try {
        var msg = {
          registration_ids: data.tokens, 
          collapse_key: "writeNow", 
          time_to_live: 180, // just 30 minutes
          data: {
            title: data.from + " is calling..",
            message: "Voice Call",
            playSound: true,
            vibrate: true,
            sound: "voicecall",
            "number": "10",
            "ticker": "My Notification Ticker",
            "click_action": "fcm.ACTION.HELLO",
            "userName": data.from,
            "convId": data.convId
          }
        };
        
        if (data.callType == "voice") {
          msg.data.isVoiceCall = true;
          console.log('isVoiceCall');
        } else if (data.callType == "video") {
           console.log('isVideoCall');
          msg.data.isVideoCall = true;
        } else {
           console.log('isPttCall');
          msg.data.isPttCall = true;
        }
        console.log(msg.data, data.callType);
        
        var msg2 = {
          registration_ids: data.tokens, 
          collapse_key: "writeNow1", 
          time_to_live: 180, // just 30 minutes
          notification: {
            "title": data.from + " is calling...",
            "body": "Voice Call",
            sound: "voicecall",
            "number": "10",
            "ticker": "My Notification Ticker",
            "click_action": "fcm.ACTION.HELLO",
            "convId": data.convId,
            "isVoiceCall": true
          }
        };
        
        // this.gcm.send(msg2, (err, response) => { //notification Show
        //   console.log(response);
        // });
        
        this.gcm.send(msg, (err, response) => {
          console.log(response);
        });
        
    } catch (e) {
        errorHandler.WriteError('sendCall', e);
    }
});

