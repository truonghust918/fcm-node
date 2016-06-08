fcm-node
========
A Node.JS simple interface to Google's Firebase Cloud Messaging (FCM)

## Installation

Via [npm][1]:

    $ npm install fcm-node

## Usage

    var FCM = require('fcm-node');

    var serverKey = '';
    var fcm = new FCM(serverKey);

    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: 'registration_token', 
        collapse_key: 'your_collapse_key', 
        data: {
            your_custom_data_key: 'your_custom_data_value'
        },
        notification: {
            title: 'Title of your push notification',
            body: 'Body of your push notification',
            icon: 'ic_launcher' //now required
        }
    };
    
    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });

See [FCM documentation][2] for details.

## Credits

Extended by [Leonardo Pereira][3].
Based on the great work on [fcm-push][7] by [Rasmunandar Rustam][4] cloned and modified from there, which in its turn, was cloned and modified from [Changshin Lee][5]'s [node-gcm][5]

## License

[GNU LESSER GENERAL PUBLIC LICENSE v3][6]

[1]: http://github.com/isaacs/npm
[2]: https://firebase.google.com/docs/cloud-messaging/server
[3]: mailto:jlcvp@cin.ufpe.br
[4]: mailto:nandar.rustam@gmail.com
[5]: https://github.com/h2soft/node-gcm
[6]: http://www.gnu.org/licenses/lgpl-3.0.txt
[7]: https://github.com/nandarustam/fcm-push

## Changelog
1.0.7 renaming repository
1.0.6 bugfix: send function was always returning an error object for multicast messages (multiple registration ids)
1.0.5 bugfix with UTF-8 enconding and chunk-encoded transfers
1.0.1 forked from fcm-push and extended to accept topic messages without errors
