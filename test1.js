var RSAKey = require('react-native-rsa');
const bits = 1024;
const exponent = '10001'; // must be a string. This is hex string. decimal = 65537
var rsa = new RSAKey();
rsa.generate(bits, exponent);
var publicKey = rsa.getPublicString(); // return json encoded string
var privateKey = rsa.getPrivateString(); // return json encoded string

console.log(publicKey);
console.log(privateKey);

rsa = new RSAKey();
rsa.setPrivateString(privateKey);
console.log('1');
var originText = 'sample String Value';
var encrypted = rsa.encrypt(originText);
console.log('2');
console.log(encrypted);


rsa = new RSAKey();
console.log('3');
rsa.setPublicString(publicKey);
console.log('4');
var decrypted = rsa.decrypt(encrypted); // decrypted == originText

console.log(decrypted);