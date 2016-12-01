var request = require('request');
var errorHandler = require('./ErrorHandler.js');

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
          console.log('data');
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
            vibrate: true
          }
        };
        this.gcm.send(msg, (err, response) => {
          console.log(response);
        });
    } catch (e) {
        errorHandler.WriteError('sendNotification', e);
    }
});

