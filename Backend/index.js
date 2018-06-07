var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwkToPem = require('jwk-to-pem');
var request = require('request');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./models/user');
var Thing = require('./models/thing')
var fs = require('fs')
var AdmZip = require('adm-zip');
var mic = require('./MIC.js')

var port = process.env.PORT || 3000;
var apiRoutes = require('./routes')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.use('/api', apiRoutes);
mongoose.connect(config.database);
app.set('superSecret', config.secret);
app.use(morgan('dev'));
app.listen(port);