# Nb-IoT to Telenor Managed IoT Cloud bridge

### Get started:

npm i

### Run:

node index.js --path "path to cert folder" --username "mic username" --password "mic password"

### Sending an authenticated package

Publishing an authenticated message requires the following:
- Download the certificate files for the device from MIC
- Create an MD5 hash of the pubkey.pem file
- Add the hash as a coap option to the request under the name '403'
