var request = require('request');

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

var gcm = new GCM("AIzaSyBmWNAm2l1BZBaZAqdPZJsgc20praN7UJk");

var msg = {
  registration_ids: ["di_5VZC45o8:APA91bEUI_ivJcVpkfNyEGYqyihJMSO5CZBCEEA2zucL6vJsXL_JyxDPJcaEvAYoYI7nMPRSWz1pnPUsfZHp_ePqiT2nwEMSJgD-kAedzSj4Rt8aPe5alj1PGSKJvqD71KWXrM0F_ZoY"], 
  collapse_key: "writeNow1", 
  time_to_live: 180, // just 30 minutes
 
  notification: {
    "title": "נוטיפיקישיןןןןןן",
    "body": "אני לא מאמין שזה עובדת!!!",
    "sound": "default",
    badge: 10,
    number: 10
  },
  data: {
    title: "שגיא שגיא",
    message: " יא מקצועןןןן?!?! ", // your payload data
    playSound: true,
    vibrate: true
  }
};

gcm.send(msg, function(err, response) {
  console.log(response);
});