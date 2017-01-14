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
  registration_ids: ["ezhzrUWHIWk:APA91bH1PU-AQQQg5oApVE6VUJJsMCL4XkLxx3OqpB7MMuONNHpws_Op40UDZS2qxpRmTy-ytkjxb44dbzLo0MmNxGSxAMyx6Oi4_l8vzhdzuoRpMOgasViZlYDU4Cwqzz0A910zbUZ_"], 
  collapse_key: "writeNow1", 
  time_to_live: 0, // just 30 minutes

  notification: {
    "title": "נוטיפיקישיןןןןןן",
    "body": "אני לא מאמין שזה עובדת!!!",
    sound: "voicecall",
    "number": "10",
    "ticker": "My Notification Ticker",
    "click_action": "fcm.ACTION.HELLO"
  }
};

var msg2 = {
  registration_ids: ["ezhzrUWHIWk:APA91bH1PU-AQQQg5oApVE6VUJJsMCL4XkLxx3OqpB7MMuONNHpws_Op40UDZS2qxpRmTy-ytkjxb44dbzLo0MmNxGSxAMyx6Oi4_l8vzhdzuoRpMOgasViZlYDU4Cwqzz0A910zbUZ_"], 
  collapse_key: "writeNow1", 
  time_to_live: 0, // just 30 minutes

  data: {
    title: "שגיא שגיא",
     body: "שגיא שגיא",
    message: " יא מקצועןןןן?!?! ", // your payload data
    playSound: true,
     sound: "voicecall",
    number: 10,
    "ticker": "My Notification Ticker",
    click_action: "fcm.ACTION.HELLO"
  }
};

gcm.send(msg, function(err, response) {
  console.log(response);
});

gcm.send(msg2, function(err, response) {
  console.log(response);
});