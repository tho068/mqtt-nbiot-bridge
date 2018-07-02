import AWS from 'aws-sdk'
import axios from 'axios'

class MIC {

  constructor () {
    this._host = null
    this._AWS = AWS
    this._manifest = null
    this._account = null
  }

  /* Load AWS manifest */
  init (hostname = null) {
    this._host = hostname
    return this._loadManifest()
      .then(manifest => { return this._getCredentials() })
      .then(creds => { return Promise.resolve(this._manifest, creds) })
      .catch(err => {
        this._host = null
        return Promise.reject(err)
      })
  }

  /* Parse different formats returned by a lambda call */
  _parseError (err) {
    if (err && err.errorMessage) { return JSON.parse(err.errorMessage).message }
    else if (typeof(err) === 'string') { return JSON.parse(err) }
    else { return err }
  }

  /* Determine if an error returned by a lambda call is an auth error */
  _isAuthError (err) {
    const authErrors = /No data|Token is expired|Invalid login token|Missing credentials in config|is not authorized to perform|Not Found/
    return  (typeof err === 'string' && err.match(authErrors)) ||
        (typeof err.message === 'string' && err.message.match(authErrors))
  }
  
  /* Fetch manifest from correct URL */
  _loadManifest () {
    const manifest_url = `https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest/?hostname=${this._host}`

    return axios(manifest_url)
      .then(res => {
        const manifest = res.data
        this._manifest = manifest
        this._AWS.config.region = manifest.Region
        return Promise.resolve(manifest)
      })
  }

  _assertInited () {
    return (this._host !== null && this._manifest !== null)
  }
  
  /* Invoke will execute a AWS lambda function */
  invoke (function_name, payload) {

    if (!this._assertInited())
      return Promise.reject('Error: MIC not initialized!')

    /* Create an instance of the lambda call for
     * potentially later usage.
     */
    const invoke_instance = () => {
      return this._lambda(function_name, payload)
    }
    
    /* Run it, but catch errors */
    return invoke_instance()
      .catch(err => {

        /* Refresh token if auth error */
        if (this._isAuthError(err)) {
          return this._refreshCredentials()
            .then(invoke_instance)
        }
        return Promise.reject(err)
      })
  }
  
  /* Execute a Cloud Connect Lambda function */
  _lambda (function_name, payload) {
    return new Promise((resolve, reject) => {

      /* Lambda parameters */
      let params = {
        FunctionName: this._manifest[function_name],
        Payload: JSON.stringify(payload)
      }
      
      /* Invoke the lambda function */
      let lambda = new this._AWS.Lambda()
      lambda.invoke(params, (err, res) => {

        /* Parse response */
        try {
          /* Got error */
          if (err) reject(this._parseError(err))
          /* Empty response */
          if (!res || !res.Payload) reject('No data')
          /* No error, got a response */
          const payload = JSON.parse(res.Payload)
          /* Got an error message in response */
          if (res.FunctionError || payload.errorMessage)
            reject(this._parseError(payload))
          /* OK */
          resolve(payload)
        /* Unexpected error */
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  /* Get AWS Cognito Credentials */
  _getCredentials (token = null) {
    /* Don't fetch credentials if we already have them */
    //if (token == null && this._AWS.config.credentials !== null) return Promise.resolve()

    this._AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this._manifest.IdentityPool,
      Logins: {
        [`cognito-idp.${this._manifest.Region}.amazonaws.com/${this._manifest.UserPool}`]: token
      }
    })
    
    /* Clear previously cached ID if token is absent */
    if (!token) this._AWS.config.credentials.clearCachedId()

    return this._AWS.config.credentials.getPromise()
  }

  _refreshCredentials () {
    const account = this._account
    
    if (typeof account === 'undefined')
      throw new Error('No Refresh Token')
    
    const refreshToken = JSON.parse(account).credentials.refreshToken
    
    if (!refreshToken)
      throw new Error('No Refresh Token')
    
    this._AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this._manifest.IdentityPool
    })
    this._AWS.config.credentials.clearCachedId()
    
    const refreshPayload = {
      action: 'REFRESH',
      attributes: {
        refreshToken: refreshToken
      }
    }
    return this.invoke('AuthLambda', refreshPayload)
      .then(account => {
        this._account = account
        return this._getCredentials(account.credentials.token)
      })
      .then(() => { return Promise.resolve(this._account) })
  }
  
  /* Perform steps needed to create a Cognito Identity */
  login (username, password) {

    if (!this._assertInited())
      return Promise.reject('Error: MIC not initialized!')

    /* Invoke an AuthLambda call to obtain an
     * authentication token from Cloud Connect.
     */
    const loginPayload = {
      action: 'LOGIN',
      attributes: {
        userName: username,
        password: password
      }
    }
    return this.invoke('AuthLambda', loginPayload)
      .then(account => {
        this._account = account

        /* Get AWS Cognito raised privilege credential
         * using the obtained MIC auth token.
         */
        return this._getCredentials(account.credentials.token)
      })
      .then(() => { return Promise.resolve(this._account) })
  }
}

export default MIC
