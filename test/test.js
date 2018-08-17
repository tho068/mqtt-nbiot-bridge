var coap = require('coap')

const toBinary = (text) => {
  return Buffer.from(text)
}

const toString = (data) => {
  return data.toString()
}

coap.registerOption('403', toBinary, toString)

var req = coap.request({
  hostname: 'localhost',
  method: 'POST',
  pathname: '/00001511',
})

req.setOption('403', 'ba0bdc0e32cf508420af18db374b9b30')

let message = {
  temp: 15,
  hum: 90
}

req.write(JSON.stringify(message))
req.on('response', function (res) {
  res.pipe(process.stdout)
})

req.end()
