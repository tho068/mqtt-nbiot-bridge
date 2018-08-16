# Nb-IoT to Telenor Managed IoT Cloud Bridge

## How to use

```bash
# install dependencies
npm i

# run the bridge
node src/index.js --path "path to cert folder" --username "mic username" --password "mic password"
```

## Sending an Authenticated CoAP Package

Publishing an authenticated message requires the following:

- Download the certificate files for the device from MIC
- Create an MD5 hash of the `pubkey.pem` file (this can be done using the hashtest.js file)
- Add the hash as a CoAP option to the request under the name '403'
