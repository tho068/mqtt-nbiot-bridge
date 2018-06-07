let coap = require('coap')
let server = coap.createServer()
let awsIot = require('aws-iot-device-sdk')
let fs = require('fs')
var config = require('./config')
let mongoose = require('mongoose')
let Thing = require('./models/thing')
mongoose.connect(config.database);

/* Flatten object of any depth into single depth obj */
function flatten(ob) {
  var toReturn = {};

  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue;

    if ((typeof ob[i]) == 'object') {
      var flatObject = flattenObject(ob[i]);
      for (var x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}

/* Convert streamed data into a buffer type */
function readStream(stream, cb) {
  return new Promise((resolv, reject) => {
    let chunks = []
    try {
      stream.on('data', (chunk) => {
        chunks.push(chunk)
      })

      stream.on('end', () => {
        resolv(Buffer.concat(chunks))
      })
    } catch (error) {
      reject(error)
    }
  })
}

/* Send message with MQTT */
function sendMQTTmessage(thingId, data) {
  var device = awsIot.device({
    keyPath: `../Backend/certs/${thingId}/privkey.pem`,
    certPath: `../Backend/certs/${thingId}/cert.pem`,
    caPath: '../Backend/certs/ca.txt',
    clientId: thingId,
    host: 'a3k7odshaiipe8.iot.eu-west-1.amazonaws.com'
  });

  device.on('connect', function () {
    let topic = `$aws/things/${thingId}/shadow/update`
    let message = {
      state: {
        reported: {
          ...data
        }
      }
    }

    /* Publish and disconnect */
    device.publish(topic, JSON.stringify(message), (err) => {
      if (err) {
        console.log(err.toString())
      }
      device.end()
    });
  });
}

/* Increment num messages for thing */
function incrementCounter(thingId) {
  Thing.findOne({ thingId: thingId }, function (err, thing) {
    thing.numMessages = thing.numMessages + 1
    thing.save(function (err) {
      if (err) console.log(err)
    })
  })
}

server.on('request', function (req, res) {
  readStream(req)
    .then(buffer => {
      /* Get data and thingId from URL and stream */
      let data = flatten(JSON.parse(buffer.toString()))
      let thingId = req.url.substring(1)

      /* Check if certificate exist */
      if (!fs.existsSync(`../Backend/certs/${thingId}`)) {
        res.code = 500

        res.end(JSON.stringify({
          message: "Certificate does not exist",
          status: 500
        }))

        return
      }

      sendMQTTmessage(thingId, data)
      incrementCounter(thingId)

      res.code = 200

      res.end(JSON.stringify({
        message: "Message is being published",
        status: 200
      }))
    })
    .catch(error => {
      res.code = 500
      res.end(JSON.stringify({
        message: error.toString(),
        status: 500
      }))
    })
})

server.listen()