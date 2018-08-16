const MIC = require('mic-sdk-js').default,
      AWSIot = require('aws-iot-device-sdk')

class Downlink {
  /* Authenticate with MIC using Pontus lib */
  constructor (userName, password) {
    this.ds = {}
    this.retries = 0

    this.mic = new MIC
    this.mic.init('startiot.mic.telenorconnexion.com')
      .then(() => {
        console.log('Manifest is retrived')

        this.manifest = this.mic.manifest

        this.mic.login(userName, password)
          .then(() => {
            console.log('Signed in')
            this.init(this.mic._AWS.config)
          })
          .catch(err => {
            console.log(err)
          })
      })
      .catch(err => {
        console.log(err)
      })
  }

  /* Init MQTT client and subscribe to root domain */
  init (config) {
    this.client = AWSIot.device({
      region:                         config.region,
      accessKeyId:                    config.credentials.accessKeyId,
      secretKey:                      config.credentials.secretAccessKey,
      sessionToken:                   config.credentials.sessionToken,
      maximumReconnectTimeMs:         8000,
      protocol:                       'wss',
      host:                           this.manifest.IotEndpoint
    })

    this.client.on('message', (topic, message) => this.onMessage(topic, message))
    this.client.on('connect', () => this.onConnect())
    this.client.on('error',   () => this.onError())
    this.client.on('close', () => this.onClose())
    this.client.on('reconnect', () => this.onReconnect())

    this.client.subscribe('thing-update/#', {qos: 1}, (err, granted) => {
      if (err) console.log('-- MQTT: error in message,', err)
    })
  }

  /* MQTT reconnect */
  onReconnect () {
    this.mic._refreshCredentials().then(() => {
      this.retries++
      if (this.retries >= 2) {
        this.retries = 0
        this.kill()
      }
    })
    .catch(e => {
      console.log(e)
    })
  }

  /* MQTT on connect */
  onConnect () {
    console.log('Connected')
  }

  /* MQTT on error */
  onError (e) {
      console.log(e)
  }

  /* MQTT on close */
  onClose () {
    console.log('Connection closed')
  }

  /* Kill and restart MQTT */
  kill () {
    this.client.unsubscribe('thing-update/#')
    this.client.end(true)
    this.init()
  }

  transformMessage (message) {
    try {
      let data = message.state.desired
      let res = {}

      for (let key in data) {
        res[key] = data[key]
      }
      return res
    } catch (e) {
      console.log(e)
      return null
    }
  }

  /* Add a new downlink message to the ds */
  storeDownlink (thingName, message) {
    try {
      if (!this.ds.hasOwnProperty(thingName)) {
        this.ds[thingName] = []
        this.ds[thingName].push({
          resources: this.transformMessage(message),
          timestamp: +new Date()
        })
      } else {
        this.ds[thingName].push({
          resources: this.transformMessage(message),
          timestamp: +new Date()
        })

        if (this.ds[thingName].length > 3) {
          this.ds[thingName].length = 3
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  /* Get downlink messages from ds */
  getDownlink (thingName) {
    try {
      if (this.ds.hasOwnProperty(thingName)) {
        const tmp = this.ds[thingName]
        this.ds[thingName] = []
        return tmp
      }

      return null
    } catch (e) {
      console.log(e)
    }
  }

  /* MQTT on message */
  onMessage (topic, message) {
    try {
      const topicSplit = topic.split('/')
      const thingId = topicSplit[topicSplit.length - 1]
      
      const data = JSON.parse(message)
      
      if (data.state.hasOwnProperty('desired')) {
        this.storeDownlink(thingId, data)
      }
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = Downlink
