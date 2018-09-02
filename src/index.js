const coap = require('coap'),
      server = coap.createServer(),
      awsIot = require('aws-iot-device-sdk'),
      argv = require('minimist')(process.argv.slice(2)),
      fs = require('fs'),
      utils = require('./utils'),
      downlink = require('./downlink')

// Assert arguments
if (typeof argv.path === 'undefined' ||
    typeof argv.username === 'undefined' ||
    typeof argv.password === 'undefined') {
  console.log('Please specify the required arguments to run the application')
  return
}

const DownLink = new downlink(argv.username, argv.password)

/* Convert streamed data into a buffer type */
const readStream = async (stream, cb) => {
  return new Promise((Resolve, Reject) =>  {
    try {
      let chunks = []
      stream.on('data', (chunk) => {
        chunks.push(chunk)
      })
  
      stream.on('end', () => {
        Resolve(Buffer.concat(chunks))
      })
    } catch (e) {
      Reject(e)
    }
  })
}

/* Send message with MQTT */
const sendMQTTmessage = (thingId, data) => {
  var device = awsIot.device({
    keyPath: `${argv.path}/${thingId}/privkey.pem`,
    certPath: `${argv.path}/${thingId}/cert.pem`,
    caPath: `${argv.path}/ca.txt`,
    clientId: thingId,
    host: 'a3k7odshaiipe8.iot.eu-west-1.amazonaws.com'
  })

  device.on('connect', function () {
    let topic = `$aws/things/${thingId}/shadow/update`

    /* Publish and disconnect */
    device.publish(topic, JSON.stringify(data), (err) => {
      if (err) {
        console.log(err.toString())
      }
      device.end()
    })
  })
}

const getDownlink = (thingId) => {
  try {
    return DownLink.getDownlink(thingId)
  } catch (e) {
    throw e
  }
}

server.on('request', async (req, res) => {
  try {
    let buffer = await readStream(req)
    let data = JSON.parse(buffer.toString())
    let thingId = req.url.substring(1)
    let hash = utils.findAuthOption(data)

    /* Check if certificate exist */
    if (!fs.existsSync(`${argv.path}/${thingId}`)) {
      await utils.getCertificate(argv.username, argv.password, thingId, argv.path)
    }

    let verified = await utils.verifyMessage(hash, thingId)

    if(verified === true) {
      const downlinkData = getDownlink(thingId)

      sendMQTTmessage(thingId, data)

      res.code = 200
      
      res.end(JSON.stringify({
        message: 'Message is being published',
        status: 200,
        data: (downlinkData) ? downlinkData : null
      }))
    } else {
      res.end(JSON.stringify({
        message: 'Not authorized to publish',
        status: 403,
      }))  
    }

  } catch (e) {
    console.log(e)
    res.code = 500
    res.end(JSON.stringify({
      message: e,
      status: 500
    }))
  }
})

server.listen()
