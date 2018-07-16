const coap = require('coap')
const server = coap.createServer()
const awsIot = require('aws-iot-device-sdk')
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs')
const utils = require('./utils')
const downlink = require('./downlink')

if (typeof argv.path === 'undefined' || typeof argv.username === 'undefined' || typeof argv.password === 'undefined'){
  console.log("Please specify the required arguments to run the application");
  return
}

const DownLink = new downlink(argv.username, argv.password)

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
async function readStream(stream, cb) {
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
    keyPath: `${argv.path}/${thingId}/privkey.pem`,
    certPath: `${argv.path}/${thingId}/cert.pem`,
    caPath: `${argv.path}/ca.txt`,
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

function getDownlink(thingId){
  try {
    return DownLink.getDownlink(thingId)
  }
  catch(e){
    console.log(e)
  }
}

server.on('request', async function (req, res) {
  try {
    let buffer = await readStream(req)
    let data = flatten(JSON.parse(buffer.toString()))
    let thingId = req.url.substring(1)
    let hash = utils.findAuthOption(req.options)

    /* Check if certificate exist */
    if (!fs.existsSync(`${argv.path}/${thingId}`)) {
      await utils.getCertificate(argv.username, argv.password, thingId, argv.path)
    }

    let verified = await utils.verifyMessage(hash, thingId)

    if(verified === true){
      const downlinkData = getDownlink(thingId)

      sendMQTTmessage(thingId, data)
  
      res.code = 200
  
      res.end(JSON.stringify({
        message: "Message is being published",
        status: 200,
        data: (downlinkData) ? downlinkData : null
      }))
    } else {
      res.end(JSON.stringify({
        message: "Not authorized to publish",
        status: 403,
      }))  
    }
  } 
  catch (e){
    console.log(e)
    res.code = 500
    res.end(JSON.stringify({
      message: error.toString(),
      status: 500
    }))
  }
})

server.listen()