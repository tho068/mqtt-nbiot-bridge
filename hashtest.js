const crypto = require('crypto');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

if (typeof argv.path === 'undefined'){
    console.log("Please specify the path to the key file");
    return
}


fs.readFile(argv.path, function(err, data){
    console.log(crypto.createHash('md5').update(data).digest("hex"))
})