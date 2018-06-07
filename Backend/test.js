var coap = require('coap')

var req = coap.request({
    hostname: 'localhost',
    method: 'POST',
    pathname: '/00000558'
})

let message = {
    temperature: 10,
    humidity: 90
}

req.write(JSON.stringify(message))

req.on('response', function (res) {
    res.pipe(process.stdout)
    res.on('end', function () {
    })
})

req.end()

