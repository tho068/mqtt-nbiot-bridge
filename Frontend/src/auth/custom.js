module.exports = {
    request: function (req, token) {
        req.headers.set('x-access-token', token);    
    },
    response: function (res) {
        if (typeof res.body.data != 'undefined' && typeof res.body.data.credentials != 'undefined') {
            return res.body.data.credentials.token
        }
    }
};