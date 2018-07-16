var crypto = require('crypto');
var fs = require('fs');

fs.readFile('certs/00001511/pubkey.pem', function(err, data){
    console.log(data)
    console.log(crypto.createHash('md5').update(data).digest("hex"))
})