# Managed IoT Cloud SDK
Use this as an interface to easily communicate with the Cloud API's, which can be found [here](https://docs.telenorconnexion.com/mic/cloud-api/).

## Installing
Using npm:
```
npm i mic-sdk-js
```

## Usage
```javascript
import MIC from 'mic-sdk-js'

const api = new MIC

const main = (async () => {
  try {
    // Init by providing the hostname of your MIC instance
    await api.init('startiot.mic.telenorconnexion.com')

    // Login a user
    await api.login('John', '********')

    // Invoke a cloud API with a payload
    const result = await api.invoke('ThingTypeLambda', { action: 'LIST' })

    // Output the result
    console.log('Thing Type list: ', JSON.stringify(result))
  } catch (e) {
    throw e
  }
})()
```

**Note:** If using the `require`-syntax select the `.default` property.
```javascript
var MIC = require('mic-sdk-js').default;
```

## Properties
To access instance properties, use them as regular object properties. E.g. to output the account information for a logged in user:

```javascript
console.log(JSON.stringify(api.account))
```

### MIC.token
The session token for an authenticated Cognito user.

### MIC.refreshToken
The refresh token used to refresh the session for an authenticated Cognito user.

### MIC.manifest
The MIC manifest object.

### MIC.account
User account information for an authenticated Cognito user.

## API

### MIC.init(hostname)
  * `hostname`: the host name used for your application

This method must be called before any other methods are used.

**Return:** promise

---

### MIC.login(username, password)
  * `username`: the user of the user to be authenticated
  * `password`: the password of the user to be authenticated

Authenticate a Cognito user by invoking the [`Auth API LOGIN`](https://docs.telenorconnexion.com/mic/cloud-api/auth/#login) action.

**Return:** promise

---

### MIC.invoke(cloud_api, payload)
  * `cloud_api`: the Cloud API name, refer to the [Cloud API documentation](https://docs.telenorconnexion.com/mic/cloud-api/)
  * `payload`: a payload object

Invoke a Cloud API with the given payload.

**Return:** `result` promise
