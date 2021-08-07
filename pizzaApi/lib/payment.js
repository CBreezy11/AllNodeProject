/*
Module for accepting the credit card payments
*/

// Dependencies
const https = require('https');
var querystring = require('querystring');

var config = require('./config');

// Create the object to export
var pay = {};

// Encrypts the card data before authorizing
pay.getCard = async (dataString) => {

    var stringPayload = querystring.stringify(dataString);

    // Contruct the options
    const options = {
        protocol: 'https:',
        hostname: 'api.stripe.com',
        path: '/v1/payment_methods',
        method: 'POST',
        auth: `${config.stripeKey}:`
    };

    //Send the request
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            data = [];
            res.on('data', d => {
                data.push(d);
            });
            res.on('end', () => {
                result = JSON.parse(data);
                if (res.statusCode == 200) {

                    // Return the id that contains the payment method
                    resolve({ error: false, message: result.id });
                } else {
                    resolve({ error: true, statusCode: res.statusCode, message: result });
                }
            });
            req.on('error', (e) => {
                console.log(e)
            })

        });
        req.write(stringPayload);

        req.end();
    })
};

// Authorize the credit card
pay.intent = async (authLoad) => {
    var stringPayload = querystring.stringify(authLoad);

    // Contruct the request options
    const options = {
        protocol: 'https:',
        hostname: 'api.stripe.com',
        path: '/v1/payment_intents',
        method: 'POST',
        auth: `${config.stripeKey}:`
    };

    // Send the request
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            data = [];
            res.on('data', d => {
                data.push(d);
            });
            res.on('end', () => {
                var result = JSON.parse(data);
                if (res.statusCode == 200) {

                    // Return the id needed to finalize the authorization
                    resolve({ error: false, message: result.id });
                } else {
                    resolve({ error: true, statusCode: res.statusCode, message: result });
                }
            });
        });
        req.on('error', (e) => {
            console.log(e)
        })

        req.write(stringPayload);

        req.end();
    });
};

// Finalize the payment
pay.complete = async (id) => {

    // Contruct the request options
    const options = {
        protocol: 'https:',
        hostname: 'api.stripe.com',
        path: `/v1/payment_intents/${id}/confirm`,
        method: 'POST',
        auth: `${config.stripeKey}:`
    };

    // Send the request
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            var data = [];
            res.on('data', d => {
                data.push(d);
            });
            res.on('end', () => {
                var result = JSON.parse(data);
                if (res.statusCode == 200) {
                    resolve({ error: false, message: result.id });
                } else {
                    resolve({ error: true, statusCode: res.statusCode, message: result });
                }
            })
        });
        req.end();
    });
};

// Export the module
module.exports = pay;

