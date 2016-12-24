var schema = require('./schema.js');
var request = require('request');
var errorHandler = require('./ErrorHandler.js');
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI5Mzc4MDMyYy1mMGFhLTRmZWYtYmNiNS0yYTc1NzFlNDI5ZmUifQ.khFTEtOOq6_SNBGZwH37zUNiPViQhRGt7-DG9XqeFlw";
var FCM = require('./FCM.js');


this.liveCalls = {};

this.runLiveConvs = (function(clsObj) { return function(socket, sockets, io){
    try {
        socket.on('makeCall', function(convId) {
            try {
                
            } catch (e) {
                errorHandler.WriteError('on makeCall', e);
            }
        });
    } catch (e) {
        errorHandler.WriteError('runLiveConvs', e);
    }
};
})(this);

