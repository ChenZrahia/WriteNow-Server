var t = [1,2,0];
var moment = require('moment');

var t = t.sort((a,b) => {
    if (a>b) {
        return -1;
    } else if (a<b) {
        return 1;
    } else {
        0
    }
});


console.log(moment( new Date()).format());