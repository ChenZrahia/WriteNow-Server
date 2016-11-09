
var request = require('request');

var GCM = function(api_key) {
  this._api_key = api_key;
}

GCM.prototype.send = function(msg, callback) {
  request.post({
    uri: 'https://android.googleapis.com/gcm/send',
    json: msg,
    headers: {
      Authorization: 'key=' + this._api_key
    }
  }, function(err, response, body) {
    callback(err, body);
  })
}

// module.exports = GCM;

var gcm = new GCM("AIzaSyDHFLRO9Fqby6RBhwSop-crXSvBf0wiudE");


var msg = {
  registration_ids: ["d5fapxFFOlM:APA91bEI6GTxvpqOmQFHT4AuwG3MNHOCYofSEgdqd-850U9kTHniDWJla9iPfGOrKB8acAJ14_H3yuBfPUJyTPu5lvtOAtN3SOy46NDS_F-t05kjAFFhcan7MMEyoogZYjGPjyuTa2SW"], // this is the device token (phone)
  collapse_key: "writeNow1", // http://developer.android.com/guide/google/gcm/gcm.html#send-msg
  time_to_live: 180, // just 30 minutes
  data: {
    title: "רוגבין, רוגבין",
    message: "שומע עבור?", // your payload data
    playSound: true,
    vibrate: true
    
  }
};

// send the message and see what happened
gcm.send(msg, function(err, response) {
  // that error is from the http request, not gcm callback
  console.log(response); // http://developer.android.com/guide/google/gcm/gcm.html#response
});