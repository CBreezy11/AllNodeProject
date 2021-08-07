/*

Helpers for various tasks

*/

// Dependencies
var config = require('./config');
var querystring = require('querystring');
var https = require('https');
var path = require('path');
var fs = require('fs').promises;

// Container for the helpers
var helpers = {};

// Parse JSON string to object
helpers.JSONtoObject = (str) => {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    };
};

// Create a string of random characters
helpers.createRandomString = (strLength) => {
    try {
        strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
        if (strLength) {
            var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
            var str = '';
            for (i = 1; i <= strLength; i++) {
                var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
                str += randomCharacter;
            }
            return str;
        }
    } catch (e) {
        return false
    }
};

helpers.sendMailgun = async (emailData) => {

    // Create the payload for the request
    var payload = {
        from: config.mailgunSandbox.from,
        to: config.mailgunSandbox.to,
        subject: "Your recipet from the Pizza Api",
        text: `Your confirmation code is ${emailData.id} for you purchase of $${emailData.total} with the Pizza Api`
    };
    var stringPayload = querystring.stringify(payload);

    // Contruct the options for the request
    var options = {
        protocol: 'https:',
        hostname: 'api.mailgun.net',
        method: 'POST',
        path: config.mailgunSandbox.path,
        auth: config.mailgunSandbox.auth,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    // Send the request
    return new Promise((resolve) => {
        var req = https.request(options, (res) => {
            var data = [];
            res.on('data', d => {
                data.push(d)
            });
            res.on('end', () => {
                var result = JSON.parse(data);
                if (res.statusCode == 200) {
                    resolve({ error: false, message: result.message });
                } else {
                    resolve({ error: true, statusCode: res.statusCode, message: result.message });
                }
            });
            req.on('error', e => {
                console.log(e)
            });
        });
        req.write(stringPayload);
        req.end();
    });
};

// Get the string content of a template
helpers.getTemplate = async (templateName, data) => {
    try {
        templateName = typeof (templateName) == 'string' && templateName.length > 0 ? templateName : false;
        data = typeof (data) == 'object' && data !== null ? data : {};
        if (templateName) {
            var templatesDir = path.join(__dirname, '/../templates/');
            var template = await fs.readFile(`${templatesDir}${templateName}.html`, 'utf8');
            var finalString = await helpers.interpolate(template, data);
            return { err: false, str: finalString }
        }
    } catch (err) {
        return err
    }
};

// Add the universal header and footer to a string and pass data object to header and footer
helpers.addUniversalTemplates = async (str, data) => {
    try {
        str = typeof (str) == 'string' && str.length > 0 ? str : '';
        data = typeof (data) == 'object' && data !== null ? data : {};

        // Get the header
        var headerString = await helpers.getTemplate('_header', data)
        if (!headerString.err && headerString.str) {
            // Get the footer
            var footerString = await helpers.getTemplate('_footer', data)
            if (!footerString.err && footerString.str) {
                // Add them all together
                var fullString = headerString.str + str + footerString.str;
                return { err: false, str: fullString }
            }
        }
    } catch (err) {
        return err
    }
};

// Take a given string and data object and find/replace all the keys within it
helpers.interpolate = (str, data) => {
    str = typeof (str) == 'string' && str.length > 0 ? str : '';
    data = typeof (data) == 'object' && data !== null ? data : {};

    // Add the template globals to the data object, prepending with global
    for (var keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.' + keyName] = config.templateGlobals[keyName];
        }
    }

    // For each key in data object insert its value into the string at the correct place
    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof (data[key]) == 'string') {
            var replace = data[key];
            var find = '{' + key + '}';
            str = str.replace(find, replace);
        }
    }
    return str;
};

//Get the contents of a static asset

helpers.getStaticAsset = async (fileName) => {
    try {
        fileName = typeof (fileName) == 'string' && fileName.length > 0 ? fileName : false;
        if (fileName) {
            var publicDir = path.join(__dirname, '/../public/');
            var file = await fs.readFile(publicDir + fileName);
            return { err: false, data: file };
        } else {
            return { err: 'A valid filename was not specified' };
        }
    } catch (e) {
        return { err: e }
    }
};

// Export the module
module.exports = helpers;

