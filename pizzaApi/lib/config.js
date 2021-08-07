/*
  Create and export configuration variables
 
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'stripeKey': 'sk_test_51IozuCKU37GQ5M6d6VfjfXvOvXzXKgZ71XjRqEn5QiAADgOpZRkhmY2BjmT8o82g7f9KPjmFvdv1fk5Ph7qwiCbg00VfqCQfcP',
    'mailgunSandbox': {
        'from': "Mailgun Sandbox <postmaster@sandbox9b52396f72d546218fcbb5dbf513f8f9.mailgun.org>",
        'to': 'manager@bellyupaspen.com',
        'auth': 'api:8112e0655abceba864f83d365474a1ba-602cc1bf-b1251e62',
        'path': '/v3/sandbox9b52396f72d546218fcbb5dbf513f8f9.mailgun.org/messages'
    },
    'templateGlobals': {
        'appName': 'PizzaApp',
        'companyName': 'Company, Inc',
        'yearCreated': '2021',
        'baseUrl': 'http://localhost:3000/'
    }
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'templateGlobals': {
        'appName': 'PizzaApp',
        'companyName': 'Company, Inc',
        'yearCreated': '2021',
        'baseUrl': 'http://localhost:5000/'
    }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
