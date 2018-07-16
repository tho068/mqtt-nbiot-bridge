const mic = require('mic-sdk-js').default
const fs = require('fs')
const AdmZip = require('adm-zip')
const awsIot = require('aws-iot-device-sdk')
const crypto = require('crypto');

function fixPath(str){
    if(str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
}

module.exports = {
    /* Get new certificate from MIC */
    getCertificate: (username, password, thingName, path) => {
        return new Promise(async(Resolve, Reject) => {
            try {
                const api = new mic
            
                await api.init ('startiot.mic.telenorconnexion.com')
                await api.login (username, password)
                
                const payload = {
                    action: 'DOWNLOAD_CERTIFICATE',
                    attributes: {
                        thingName
                    }
                }
                
                const data = await api.invoke('ThingLambda', payload)
        
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
                
            } 
            catch(e){
                console.log(e)
                Reject()
            }
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
    },

    /* Verify the device publishing a message to MIC */
    verifyMessage: (hash, thingName) => {
        return new Promise((Resolve, Reject) => {
            try{
                if(hash == null){
                    Resolve(false)
                    return
                }
                fs.readFile(`certs/${thingName}/pubkey.pem`, function(err, data){
                    let match = crypto.createHash('md5').update(data).digest("hex")
                    if( hash === match ){
                        Resolve(true)
                        return
                    }
                    Resolve(false)
                })
            } catch(e){
                Reject(e)
            }
        })
    },

    findAuthOption: (options) => {
        for(let i = 0; i < options.length; i++){
            let option = options[i]
            if(option.name == '403'){
                return option.value.toString('binary')
            }
        }

        return null
    }
}