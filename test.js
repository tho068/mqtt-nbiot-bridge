var coap = require('coap')

var req = coap.request({
    hostname: 'localhost',
    method: 'POST',
    pathname: '/00001511'
})

let message = {
    temp: 15,
    hum: 90
}

req.write(JSON.stringify(message))

req.on('response', function (res) {
    res.pipe(process.stdout)
    res.on('end', function () {
    })
})

req.end()

