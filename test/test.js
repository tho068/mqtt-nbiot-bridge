var coap = require('coap')

var req = coap.request({
  hostname: 'localhost',
  method: 'POST',
  pathname: '/00001511',
})

let message = {
  auth: "ba0bdc0e32cf508420af18db374b9b30",
  state: {
    reported: {
      temp: 21,
      hum: 34
    }
  }
}

req.write(JSON.stringify(message))
req.on('response', function (res) {
  res.pipe(process.stdout)
})

req.end()
