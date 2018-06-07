var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Thing', new Schema({ 
    thingId: String,
    numMessages: Number,
    cognitoUsername: String,
}));