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

req.setOption('403', '76c76d05f8b89f114011a6588b5e0911')

let message = {
  temp: 15,
  hum: 90
}

req.write(JSON.stringify(message))
req.on('response', function (res) {
  res.pipe(process.stdout)
})

req.end()
