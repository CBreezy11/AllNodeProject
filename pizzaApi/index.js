/*

Primary File for Pizza API

*/

// Dependencies
const server = require('./lib/server');

// Declare the app
var app = {};

// Init Function
app.init = () => {

    // Start the server
    server.init();

};

// Self executing
app.init();

// Export the app
module.exports = app;