const mic = require('mic-sdk-js').default
const fs = require('fs')
const AdmZip = require('adm-zip')
const awsIot = require('aws-iot-device-sdk')

function fixPath(str){
    if(str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
}

module.exports = {
    /* Get new certificate from MIC */
    getCertificate: (username, password, thingName, path) => {
        return new Promise((Resolve, Reject) => {
            const api = new mic
            api.init ('startiot.mic.telenorconnexion.com')
                .then( (manifest, credentials) => {
                    api.login (username, password)
                        .then (user => {
                            const payload = {
                                action: 'DOWNLOAD_CERTIFICATE',
                                attributes: {
                                    thingName
                                }
                            }
                            api.invoke('ThingLambda', payload)
                                .then (data => {
                                    fs.writeFile(`${fixPath(path)}/${thingName}.zip`, Buffer.from(data, 'base64'), (err) => {
                                        if (err) {
                                            console.log(err)
                                        }
                            
                                        /* Unzip the file */
                                        let zip = new AdmZip(`${fixPath(path)}/${thingName}.zip`)
                                        zip.extractAllTo(`${fixPath(path)}/`, true)
                            
                                        /* Delete tmp zip */
                                        fs.unlink(`${fixPath(path)}/${thingName}.zip`, (err) => {
                                            if (err) console.log(err);
                                        })
    
                                        Resolve()
                                    })
                                })
                                .catch(e => {
                                    console.log(e)
                                    Reject(e)
                                })
                            })
                            .catch(e => {
                                console.log(e)
                                Reject(e)
                            })
                    })
                    .catch(e => {
                        console.log(e)
                        Reject(e)
                    })
        })
    },

    /* Check if certificate exists in folder */
    isValidCert: async (pathToDir, thingName) => {
        return new Promise((Resolve, Reject) => {
            const path = fixPath(pathToDir)
            fs.access(`${path}/${thingName}`, fs.constants.F_OK, (err) => {
                if(err) {
                    Reject()
                } else {
                Resolve()
                }
            })
        })
    },

    /* Send MQTT message to MIC */
    sendMessage: (thingName, payload, path) => {
        try {
            var device = awsIot.device({
                keyPath: `${path}/${thingName}/privkey.pem`,
                certPath: `${path}/${thingName}/cert.pem`,
                caPath: `${path}/ca.txt`,
                clientId: thingName,
                host: 'a3k7odshaiipe8.iot.eu-west-1.amazonaws.com'
            });
            
            device.on('connect', function () {
                let topic = `$aws/things/${thingName}/shadow/update`
                let message = {
                state: {
                    reported: {
                    ...payload
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
        } catch(e) {
            console.log(e)
        }
    }
}