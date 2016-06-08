var util = require('util');
var https = require('https');
var querystring = require('querystring');
var emitter = require('events').EventEmitter;
var retry = require('retry');

function FCM(serverKey) {

    if (serverKey)
    {
        this.serverKey = serverKey;
    }
    else
    {
        throw Error('You must provide the APIKEY for your firebase application.');
    }

    this.fcmOptions = {
        host: 'fcm.googleapis.com',
        port: 443,
        path: '/fcm/send',
        method: 'POST',
        headers: {}
    };    

    this.send = function(payload, CB) {
        console.log("FCM.send");

        var self = this;
        if (CB) this.once('sent', CB);

        var operation = retry.operation();

        mpayload = JSON.stringify(payload);
       
        operation.attempt(function(currentAttempt) {
            var headers = {
                'Host': self.fcmOptions.host,
                'Authorization': 'key=' + self.serverKey,
                'Content-Type': 'application/json' 
                //'Content-Length': mpayload.length //removed this line for chunk-encoded transfer compatibility (UTF-8 and all non-ANSI codification)
            };

            self.fcmOptions.headers = headers;

            if (self.keepAlive) headers.Connection = 'keep-alive';

            var request = https.request(self.fcmOptions, function(res) {
                var data = '';


                if (res.statusCode == 503) {
                    // If the server is temporary unavailable, the C2DM spec requires that we implement exponential backoff
                    // and respect any Retry-After header
                    if (res.headers['retry-after']) {
                        var retrySeconds = res.headers['retry-after'] * 1; // force number
                        if (isNaN(retrySeconds)) {
                            // The Retry-After header is a HTTP-date, try to parse it
                            retrySeconds = new Date(res.headers['retry-after']).getTime() - new Date().getTime();
                        }
                        if (!isNaN(retrySeconds) && retrySeconds > 0) {
                            operation._timeouts['minTimeout'] = retrySeconds;
                        }
                    }
                    if (!operation.retry('TemporaryUnavailable')) {
                        self.emit('sent', operation.mainError(), null);
                    }
                    // Ignore all subsequent events for this request
                    return;
                }

                function respond() {
                    var error = null, id = null;

                    //HAndle the various responses
                    if(data.indexOf('\"multicast_id\":')> -1)//handle multicast_id
                    {
                        anyFail = ((JSON.parse(data)).failure > 0);

                        if(anyFail)
                        {
                            error = data.substring(0).trim();
                        }

                        anySuccess = ((JSON.parse(data)).success > 0);

                        if(anySuccess)
                        {
                            id = data.substring(0).trim();
                        }
                    }
                    if (data.indexOf('\"failure\":') > -1) {
                        error = data.substring(0).trim();
                    } else if (data.indexOf('\"success\":') > -1) {
                        id = data.substring(0).trim();
                    } else if (data.indexOf('Unauthorized') > -1) {
                        error = 'NotAuthorizedError'
                    } else if(data.indexOf('\"message_id\":')>-1){  //topic messages
                        id=data;
                    }else {
                        error = 'InvalidServerResponse';
                    }
                    // Only retry if error is QuotaExceeded or DeviceQuotaExceeded
                    if (operation.retry(currentAttempt <= 3 && ['QuotaExceeded', 'DeviceQuotaExceeded', 'InvalidServerResponse'].indexOf(error) >= 0 ? error : null)) {
                        return;
                    }

                    // Success, return message id (without id=)
                    self.emit('sent', error, id);
                }

                res.on('data', function(chunk) {
                    data += chunk;
                });
                res.on('end', respond);
                res.on('close', respond);
            });

            request.on('error', function(error) {
                self.emit('sent', error, null);
            });

            request.end(mpayload);
        });
    };

}
util.inherits(FCM, emitter);

module.exports = FCM;

