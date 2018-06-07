var express = require('express');
var apiRoutes = express.Router();
var mongoose = require('mongoose');
var jwkToPem = require('jwk-to-pem');
var jwt = require('jsonwebtoken');
var fs = require('fs')
var AdmZip = require('adm-zip');
var mic = require('../MIC.js')

var config = require('../config');
var User = require('../models/user');
var Thing = require('../models/thing')

function convertToPEM() {
    let keys = config.aws_jwt.keys
    let pems = []

    for (var i = 0; i < keys.length; i++) {
        var key_id = keys[i].kid;
        var modulus = keys[i].n;
        var exponent = keys[i].e;
        var key_type = keys[i].kty;
        var jwk = { kty: key_type, n: modulus, e: exponent };
        var pem = jwkToPem(jwk);
        pems[key_id] = pem;
    }

    return pems
}

/* Common error respond function */
function respond_error(res, status = 500, message) {
    res.status(status).json({
        success: false,
        message: message
    })
}

/* Common respond function */
function respond(res, message, data = null) {
    if (data != null) {
        res.json({
            success: true,
            message: message,
            data: data,
        })
    }
    else {
        res.json({
            success: true,
            message: message,
        })
    }
}

/* Authentication*/
apiRoutes.post('/authenticate', function (req, res) {
    mic.init().then(() => {
        mic.login(req.body.email, req.body.password).then(response => {
            respond(res, "You are logged in", response)
        }).catch(error => {
            respond_error(res, 403, error.toString())
        })
    }).catch(error => {
        respond_error(res, 500, error.toString())
    })
});

/* Middleware to check token */
apiRoutes.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    let decoded_jwt = jwt.decode(token, { complete: true })

    if (!decoded_jwt) {
        res.json({
            success: false,
            message: "Not a valid token"
        })

        return
    }

    let pems = convertToPEM()
    let kid = decoded_jwt.header.kid;

    /* Verify the token using Cognito public key */
    jwt.verify(token, pems[kid], { issuer: config.issuer }, function (err, payload) {
        if (err) {
            res.json({
                success: false,
                message: 'Invalid token.'
            })

            return
        }

        req.decoded = payload

        next()
    })
});

/* Get certificates via cognito */
apiRoutes.post('/getcertificates', function (req, res) {
    let thingId = req.body.thingId

    if (thingId.length != 8) {
        res.json({
            success: false,
            message: "Fields are missing."
        })
        return
    }

    /* Invoke lambda to get authentication certificates for thing */
    mic.certificate(thingId, req.headers['x-access-token']).then(data => {
        fs.writeFile(`certs/${thingId}.zip`, new Buffer(data, 'base64'), (err) => {
            if (err) {
                res.json({
                    success: false,
                    message: 'Error saving certificate.'
                })
            }

            /* Unzip the file */
            let zip = new AdmZip(`certs/${thingId}.zip`)
            zip.extractAllTo('certs/', true)

            /* Delete tmp zip */
            fs.unlink(`certs/${thingId}.zip`)

            /* Check if thing exists in DB, if not - add it */
            Thing.findOne({ thingId: thingId }, (err, thing) => {
                if (!thing) {
                    console.log("FAILED")
                    Thing.create({
                        thingId: thingId,
                        numMessages: 0,
                        cognitoUsername: req.decoded['cognito:username']
                    }).then(thing => {
                        res.json({
                            success: true,
                            data: { thing: thing },
                            message: "Certificate files are downloaded succesfully."
                        })
                    })
                }
                else {
                    res.json({
                        success: true,
                        data: { thing: thing },
                        message: "Certificate files are downloaded succesfully."
                    })
                }
            })
        })
    }).catch(error => {
        res.json({
            success: false,
            message: error.toString()
        })
    })
})

/* Fetch current user */
apiRoutes.get('/fetch_user', function (req, res) {
    res.json(JSON.stringify(req.decoded))
})

/* Fetch things */
apiRoutes.get('/fetch_things', function (req, res) {
    Thing.find({ cognitoUsername: req.decoded['cognito:username'] }, (err, things) => {
        if (err) {
            res.json({
                success: false,
                message: err.toString()
            })
        }

        res.json({
            success: true,
            message: "All the things.",
            data: { things }
        })
    })
})

module.exports = apiRoutes