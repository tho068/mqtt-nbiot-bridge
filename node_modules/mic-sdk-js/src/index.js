import AWS from 'aws-sdk'
import axios from 'axios'

class MIC {

  constructor () {
    this._host = null
    this._AWS = AWS
    this._manifest = null
    this._account = null
  }

  // Load AWS manifest
  async init (host = null) {
    this._host = host

    if (this._manifest !== null)
      return

    try {
      await this._loadManifest()
    } catch (e) {
      throw `Could not initialize MIC: ${e}`
    }
  }

  get token () {
    try {
      return this._account.credentials.token
    } catch (e) {
      return null
    }
  }

  get refreshToken () {
    try {
      return this._account.credentials.refreshToken
    } catch (e) {
      return null
    }
  }

  get manifest () {
    try {
      return this._manifest
    } catch (e) {
      return null
    }
  }

  get account () {
    try {
      return this._account
    } catch (e) {
      return null
    }
  }

  // Parse different formats returned by a lambda call
  _parseError (e) {
    if (e && e.errorMessage)
      return JSON.parse(e.errorMessage).message
    else if (typeof e === 'string')
      return JSON.parse(e)
    else
      return e
  }

  // Determine if an error returned by a lambda call is an auth error
  _isAuthError (e) {
    const authErrors = /No data|Token is expired|Invalid login token|Missing credentials in config|is not authorized to perform|Not Found/
    return ((typeof e === 'string' && e.match(authErrors)) ||
            (typeof e.message === 'string' && e.message.match(authErrors)))
  }
  
  // Fetch manifest from static endpoint
  async _loadManifest () {
    const manifestEndpoint = `https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest/?hostname=${this._host}`

    if (this._host === null)
      throw `Filed to load manifest: MIC is not initialized.`

    try {
      const result = await axios(manifestEndpoint)
      const manifest = result.data
      this._manifest = manifest
      this._AWS.config.region = manifest.Region
    } catch (e) {
      throw `Filed to load manifest: ${e}`
    }
  }

  _assertInited () {
    return (this._host !== null && this._manifest !== null)
  }
  
  // Invoke will execute a AWS lambda functionZZ
  async invoke (functionName, payload) {

    if (!this._assertInited())
      throw `Filed to load manifest: MIC is not initialized.`

    // Create an instance of the lambda call for
    // potentially later usage.
    const invokeInstance = async () => {
      return await this._lambda(functionName, payload)
    }
    
    // Run it, but catch errors
    try {
      return await invokeInstance()
    } catch (e) {
      // Refresh token if auth error
      if (this._isAuthError(e)) {
        try {
          await this._refreshCredentials(this._account.credentials.refreshToken)
          await invokeInstance()
        } catch (e) {
          throw e
        }
      } else {
        throw e
      }
    }
  }
  
  // Execute a MIC Lambda function
  async _lambda (functionName, functionPayload) {
    try {
      // Lambda params
      const params = {
        FunctionName: this._manifest[functionName],
        Payload: JSON.stringify(functionPayload)
      }

      // Invoke the Lambda function
      const lambda = new this._AWS.Lambda()
      const result = await lambda.invoke(params).promise()
      
      // Empty response
      if (!result || !result.Payload)
        throw 'Error while invoking Lambda: No response data.'

      // No error, got a response
      const payload = JSON.parse(result.Payload)

      // Got an error message in response
      if (result.FunctionError || payload.errorMessage)
        throw this._parseError(payload)

      // OK
      return payload

    // Unexpected error
    } catch (e) {
      throw this._parseError(e)
    }
  }

  // Get AWS Cognito Credentials
  async _getCredentials (token = null) {
    try {
      this._AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: this._manifest.IdentityPool,
        Logins: {
          [`cognito-idp.${this._manifest.Region}.amazonaws.com/${this._manifest.UserPool}`]: token
        }
      })

      // Clear previously cached ID if token is absent
      if (token === null)
        this._AWS.config.credentials.clearCachedId()

      await this._AWS.config.credentials.getPromise()
    } catch (e) {
      throw e
    }
  }

  async _refreshCredentials (refreshToken) {
    try {
      // Reset potential previous session
      await this._getCredentials()

      // Invoke an AuthLambda call to obtain an
      // authentication token from MIC.
      const payload = {
        action: 'REFRESH',
        attributes: {
          refreshToken
        }
      }
      this._account = await this.invoke('AuthLambda', payload)

      // Get AWS Cognito raised privilege credential
      // using the obtained MIC auth token.
      await this._getCredentials(this._account.credentials.token)
    } catch (e) {
      throw e
    }
  }
  
  // Perform steps needed to create a Cognito Identity
  async login (username, password) {
    try {
      if (!this._assertInited())
        throw `Filed to load login: MIC is not initialized.`

      await this._getCredentials()

      // Invoke an AuthLambda call to obtain an
      // authentication token from MIC.
      const payload = {
        action: 'LOGIN',
        attributes: {
          userName: username,
          password: password
        }
      }
      this._account = await this.invoke('AuthLambda', payload)

      // Get AWS Cognito raised privilege credential
      // using the obtained MIC auth token.
      await this._getCredentials(this._account.credentials.token)
    } catch (e) {
      throw e
    }
  }
}

export default MIC
