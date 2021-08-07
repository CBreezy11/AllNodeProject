/* 

Server related tasks

*/

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var path = require('path');

var helpers = require('./helpers');
var handlers = require('./handlers')
var config = require('./config')



// Server object
var server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

// Get https options
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

// Instantiate https server
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
});

// Server logic for both servers
server.unifiedServer = (req, res) => {
    // Parse the url
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the querystring object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as on object
    var headers = req.headers;

    // Get the payload
    var decoder = new stringDecoder('utf-8');
    var buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // Construct the object to send to the router
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.JSONtoObject(buffer)
        };

        // Route the correct handler
        var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        // Route the request
        chosenHandler(data).then((result) => {
            // Determine the type of response
            var contentType = typeof (result.contentType) == 'string' ? result.contentType : 'json';

            // Use the status code returned from the handler, or set the default status code to 200
            var statusCode = typeof (result.statusCode) == 'number' ? result.statusCode : 200;


            // Use the payload returned from the handler, or set the default payload to an empty object
            var payload = result.message;

            // Return the response parts that are content specific
            var payloadString = '';

            switch (contentType) {
                case 'json':
                    res.setHeader('Content-Type', 'application/json');
                    payloadString = JSON.stringify(payload);
                    break;
                case 'html':
                    res.setHeader('Content-Type', 'text/html');
                    payloadString = typeof (payload) == 'string' ? payload : '';
                    break;
                case 'favicon':
                    res.setHeader('Content-Type', 'image/x-icon');
                    payloadString = typeof (payload) !== 'undefined' ? payload : '';
                    break;
                case 'css':
                    res.setHeader('Content-Type', 'text/css');
                    payloadString = typeof (payload) !== 'undefined' ? payload : '';
                    break;
                case 'png':
                    res.setHeader('Content-Type', 'image/png');
                    payloadString = typeof (payload) !== 'undefined' ? payload : '';
                    break;
                case 'jpg':
                    res.setHeader('Content-Type', 'image/jpeg');
                    payloadString = typeof (payload) !== 'undefined' ? payload : '';
                    break;
                default:
                    res.setHeader('Content-Type', 'text/plain');
                    payloadString = typeof (payload) !== 'undefined' ? payload : '';
            };

            // Return the response parts that are common to all content types
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log(trimmedPath, statusCode);
        });
    });
}

// Router
server.router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDelete,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.cartList,
    'checks/create': handlers.cartCreate,
    'checks/edit': handlers.cartEdit,
    'ping': handlers.ping,
    'notFound': handlers.notFound,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/menu': handlers.menu,
    'api/cart': handlers.cart,
    'api/checkout': handlers.checkout,
    'favicon.ico': handlers.favicon,
    'public': handlers.public
}

// Init Script
server.init = () => {
    // Start the http server
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `The HTTP server is listening on port ${config.httpPort}`)
    });

    // Start the https server
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', `The HTTPS server is listening on port ${config.httpsPort}`)
    })

};


module.exports = server;
