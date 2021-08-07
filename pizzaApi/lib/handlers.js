/*

Request handlers

*/


// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var payment = require('./payment');

// Handler object
var handlers = {};

/*
* HTML Handlers
*
*/
// Index Handler
handlers.index = async (data) => {
    if (data.method == 'get') {
        //Prepare data for interpolation
        var templateData = {
            'head.title': 'Pizza API',
            'head.description': 'Demo of a pure Node frontend and backend with MailChimp and Stripe API\'s',
            'body.class': 'index'
        };
        // Read the template as a string
        var template = await helpers.getTemplate('index', templateData)
        if (!template.err && template.str) {
            // Add the universal header and footer
            var str = await helpers.addUniversalTemplates(template.str, templateData)
            if (!str.err && str.str) {
                return { statusCode: 200, message: str.str, contentType: 'html' }
            } else {
                return { statusCode: 500, message: undefined, contentType: 'html' };
            }
        } else {
            return { statusCode: 500, message: undefined, contentType: 'html' };
        }
    } else {
        return { statusCode: 405, message: undefined, contentType: 'html' }
    }
};

//Create account handler
handlers.accountCreate = async (data) => {
    if (data.method == 'get') {
        //Prepare data for interpolation
        var templateData = {
            'head.title': 'Create an Account',
            'head.description': 'Sign upp to order pizza',
            'body.class': 'accountCreate'
        };
        // Read the template as a string
        var template = await helpers.getTemplate('accountCreate', templateData)
        if (!template.err && template.str) {
            // Add the universal header and footer
            var str = await helpers.addUniversalTemplates(template.str, templateData)
            if (!str.err && str.str) {
                return { statusCode: 200, message: str.str, contentType: 'html' }
            } else {
                return { statusCode: 500, message: undefined, contentType: 'html' };
            }
        } else {
            return { statusCode: 500, message: undefined, contentType: 'html' };
        }
    } else {
        return { statusCode: 405, message: undefined, contentType: 'html' }
    }
}

handlers.favicon = async (data) => {
    if (data.method == 'get') {
        var icon = await helpers.getStaticAsset('favicon.ico')
        if (!icon.err && icon.data) {
            return { statusCode: 200, message: icon.data, contentType: 'favicon' }
        } else {
            return { statusCode: 500 }
        }
    } else {
        return { statusCode: 405 }
    }
};

// Public assests

handlers.public = async (data) => {
    if (data.method == 'get') {
        // Get the filename being requested
        var trimmedAssesName = data.trimmedPath.replace('public/', '').trim();
        if (trimmedAssesName.length > 0) {
            // Read in the assets data
            var assest = await helpers.getStaticAsset(trimmedAssesName);
            if (!assest.err && assest.data) {
                // Determine the content type and default to text
                var contentType = 'plain'
                if (trimmedAssesName.indexOf('.css') > -1) {
                    contentType = 'css'
                }
                if (trimmedAssesName.indexOf('.png') > -1) {
                    contentType = 'png'
                }
                if (trimmedAssesName.indexOf('.jpg') > -1) {
                    contentType = 'jpg'
                }
                if (trimmedAssesName.indexOf('.ico') > -1) {
                    contentType = 'favicon'
                }

                // Return the data

                return { statusCode: 200, message: assest.data, contentType: contentType }
            } else {
                return { statusCode: 404 }
            }
        } else {
            return { statusCode: 404 };
        }
    } else {
        return { statusCode: 405 }
    }
};

/*
* JSON API Handlers
*
*/
//Ping
handlers.ping = async (data) => {
    return { statusCode: 200 };
};

// notFound
handlers.notFound = async (data) => {
    return { statusCode: 404 };
};

// Users object
handlers.users = async (data) => {

    // list all acceptable methods
    var acceptableMethods = ['get', 'put', 'post', 'delete'];

    // Verify method sent is accepted and route to proper handler
    if (acceptableMethods.indexOf(data.method) > -1) {
        var result = await handlers._users[data.method](data);
        return result;
    } else {
        return { statusCode: 405 };
    };
};

// Container for all the user methods
handlers._users = {};


/* User post
    Required data firstName, lastName email, street address
    */
handlers._users.post = async (data) => {


    // Check all required fields exist and are valid
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim().toLowerCase() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim().toLowerCase() : false;
    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.split('').indexOf('@') > -1 ? data.payload.email : false;
    var address = typeof (data.payload.address) == 'string' && data.payload.address.length > 0 ? data.payload.address : false;

    if (firstName && lastName && email && address) {

        // Make sure the user doesnt already exist
        var exist = await _data.read('users', email)
        if (exist.Error) {

            // Create the user object
            var newUser = {
                'firstName': firstName,
                'lastName': lastName,
                'email': email,
                'address': address
            };

            // Store the user
            var stored = await _data.create('users', email, newUser)
            if (!stored) {
                return { statusCode: 200 };
            } else {
                return { statusCode: 500, message: 'Could not create the new user' };
            }
        } else {
            return { statusCode: 400, message: 'A user with that email already exists' };
        }
    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
};

/*
Get a user
    Required data = email
    */

handlers._users.get = async (data) => {

    // Check that the email is valid
    var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.split('').indexOf('@') > -1 ? data.queryStringObject.email : false;
    if (email) {

        // Validate the token
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        var tokenIsValid = await handlers._tokens.verfifyToken(token, email);
        if (tokenIsValid) {

            // Retrieve the user
            var getUser = await _data.read('users', email);
            if (!getUser.Error) {
                return {
                    statusCode: 200, message: getUser.result
                };
            } else {
                return {
                    statusCode: 404
                };
            }
        } else {
            return { statusCode: 403, message: 'Token is missing or invalid' };
        }

    } else {
        return { statusCode: 400, message: 'Missing required field' };
    }
};

// Update a user
// Required = email
// Optional = firstName lastName address

handlers._users.put = async (data) => {

    // Check for required field
    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.split('').indexOf('@') > -1 ? data.payload.email : false;

    // Check for optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim().toLowerCase() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim().toLowerCase() : false;
    var address = typeof (data.payload.address) == 'string' && data.payload.address.length > 0 ? data.payload.address : false;

    // Check if required field is valid
    if (email) {

        // Validate the token
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        var tokenIsValid = await handlers._tokens.verfifyToken(token, email);
        if (tokenIsValid) {

            // Lookup the user
            var user = await _data.read('users', email);
            if (!user.Error) {

                // update the fields
                if (firstName) {
                    user.result.firstName = firstName
                }
                if (lastName) {
                    user.result.lastName = lastName
                }
                if (address) {
                    user.result.address = address
                }

                // Store the updates
                var updatedUser = await _data.update('users', email, user.result);
                if (!updatedUser) {
                    return {
                        statusCode: 200
                    };
                } else {
                    return { statusCode: 500, message: 'Could not update the user' };
                }
            } else {
                return { statusCode: 400, message: 'User does not exist' };
            }
        } else {
            return { statusCode: 403, message: 'Token is missing or invalid' };
        }

    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
};

// Delete a user
handlers._users.delete = async (data) => {

    // Check that the email is valid
    var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.split('').indexOf('@') > -1 ? data.queryStringObject.email : false;
    if (email) {

        // Validate tthe token
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        var tokenIsValid = await handlers._tokens.verfifyToken(token, email);
        if (tokenIsValid) {

            // Lookup the user
            var lookup = await _data.read('users', email);
            if (!lookup.Error) {

                // Delete the users data
                var deleted = await _data.delete('users', email);
                if (!deleted) {
                    return {
                        statusCode: 200
                    };
                } else {
                    return { statusCode: 500, message: 'Could not delete the user' };
                }
            } else {
                return { statusCode: 400, message: 'Could not find the specified user' };
            }
        } else {
            return { statusCode: 403, message: 'Token is missing or invalid' };
        }
    } else {
        return { statusCode: 400, message: 'Missing required field' };
    }
};

// Tokens handler
handlers.tokens = async (data) => {
    var acceptableMethods = ['get', 'put', 'post', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        var result = await handlers._tokens[data.method](data);
        return result;
    } else {
        return {
            statusCode: 405
        };
    }
};

// Handlers._tokens container
handlers._tokens = {};

// Tokens post
handlers._tokens.post = async (data) => {

    // Get and verify the email
    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.split('').indexOf('@') > -1 ? data.payload.email : false;
    if (email) {

        // Lookup the user with the email
        var lookup = await _data.read('users', email);
        if (!lookup.Error) {

            // Create the token
            var tokenId = helpers.createRandomString(20);
            var expires = Date.now() + 1000 * 60 * 60;
            var tokenObject = {
                'email': email,
                'tokenId': tokenId,
                'expires': expires
            }

            // Store the token
            var token = await _data.create('tokens', tokenId, tokenObject);
            if (!token) {
                return {
                    statusCode: 200, message: tokenObject
                };
            } else {
                return { statusCode: 500, message: 'Could not create the new token' };
            }

        } else {
            return { statusCode: 400, message: lookup.Error };
        }
    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
};

handlers._tokens.delete = async (data) => {

    // Check the id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id : false;
    if (id) {

        // Lookup the token
        let token = await _data.read('tokens', id);
        if (!token.Error) {

            // Delete the token
            var deleted = await _data.delete('tokens', id);
            if (!deleted) {
                return {
                    statusCode: 200
                };
            } else {
                return { statusCode: 500, message: 'Could not delete the token' };
            }
        } else {
            return { statusCode: 400, message: 'Could not find the specified token' };
        }
    } else {
        return { statusCode: 400, message: 'Missing required field' };
    }
};

// Verify a given token is valid
handlers._tokens.verfifyToken = async (id, email) => {

    // Lookup the token
    let tokenData = await _data.read('tokens', id);
    if (!tokenData.Error) {
        if (tokenData.result.email == email && Date.now() < tokenData.result.expires) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
};
// Create the menu handler and route it
handlers.menu = async (data) => {
    var acceptableMethods = ['get', 'post'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        var result = await handlers._menu[data.method](data);
        return result
    } else {
        return {
            statusCode: 405
        };
    }
};

// Create container for internal menu 
handlers._menu = {};

// Get menu
handlers._menu.get = async (data) => {

    // Get the token that sent the request
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    if (token) {
        let tokenData = await _data.read('tokens', token);
        if (!tokenData.Error) {

            // Retrieve email from token file and validate the token
            var email = tokenData.result.email;
            var tokenIsValid = await handlers._tokens.verfifyToken(token, email)
            if (tokenIsValid) {

                // Send the menu
                var menu = await _data.read('menu', 'menu');
                if (!menu.Error) {
                    return {
                        statusCode: 200, message: menu.result
                    };
                } else {
                    return { statusCode: 500, message: 'Could not retrieve the menu' };
                }
            } else {
                return { statusCode: 400, message: 'Invalid token' };
            }
        } else {
            return {
                statusCode: 403
            };
        }
    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
};

// Cart Handler
handlers.cart = async (data) => {
    var acceptableMethods = ['get', 'put', 'delete', 'post'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        let result = await handlers._cart[data.method](data);
        return result
    } else {
        return {
            statusCode: 405
        };
    }
};

// Cart internal methods
handlers._cart = {};

// Add items to the cart
// Required = valid items from menu to add to the cart && email address that cart is attached to
handlers._cart.post = async (data) => {

    // Validate the inputs
    var cartItems = typeof (data.payload.cart) == 'string' ? data.payload.cart : false;
    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.split('').indexOf('@') > -1 ? data.payload.email : false;
    if (email && cartItems) {

        // Lookup the user and grab the menu
        var user = await _data.read('users', email);
        var menu = await _data.read('menu', 'menu');
        if (!user.Error && !menu.Error) {

            // Validate item attempting to put in cart is on the menu
            if (Object.keys(menu.result.menu).indexOf(cartItems) > -1) {
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

                // Validate token
                var tokenIsValid = await handlers._tokens.verfifyToken(token, email);
                if (tokenIsValid) {
                    var userCart = typeof (user.result.cart) == 'string' && user.result.cart.length == 20 ? user.result.cart : '';

                    // Create cart object
                    var cartObject = {
                        id: userCart,
                        userEmail: email,
                        items: [{
                            item: cartItems,
                            quantity: 1,
                            price: menu.result.menu[cartItems]
                        }],
                        total: menu.result.menu[cartItems]
                    }
                    if (userCart == '') {

                        // Create new cart for the logged in user if it doesnt exist
                        var newCartId = helpers.createRandomString(20);
                        cartObject.id = newCartId;
                        var newCart = await _data.create('cart', newCartId, cartObject);
                        if (!newCart) {
                            user.result.cart = newCartId;
                            var complete = await _data.update('users', email, user.result);
                            if (!complete) {
                                return {
                                    statusCode: 200, message: cartObject
                                };
                            } else {
                                return { statusCode: 500, message: 'Could not update the user with their cart number' };
                            }
                        } else {
                            return { statusCode: 500, message: 'Could not create a cart' };
                        }
                    } else {

                        // Update the users cart if it does already exist
                        var cartToUpdate = await _data.read('cart', userCart);
                        if (!cartToUpdate.Error) {
                            newTotal = menu.result.menu[cartItems];
                            cartToUpdate.result.items.forEach((item) => {
                                if (item.item == cartItems) {
                                    cartObject.items[0].quantity += item.quantity;
                                    cartObject.items[0].price += item.price;
                                    newTotal += item.price;
                                } else {
                                    cartObject.items.push(item);
                                    newTotal += item.price
                                }
                            });
                            cartObject.total = newTotal;
                            var updatedCart = await _data.update('cart', userCart, cartObject);
                            if (!updatedCart) {
                                return {
                                    statusCode: 200, message: cartObject
                                };
                            } else {
                                return { statusCode: 500, message: 'Could not update the cart' };
                            }
                        } else {
                            return { statusCode: 500, message: 'Could not find user cart' };
                        }
                    }
                } else {
                    return { statusCode: 400, message: 'Bad or missing token' };
                }
            } else {
                return { statusCode: 400, message: 'Items not on the menu' };
            }
        } else {
            return { statusCode: 400, message: 'User does not exist' };
        }
    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
};

// Get a users cart
handlers._cart.get = async (data) => {

    // Get cart id and validate
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {

        // Make sure cart exists
        var userCart = await _data.read('cart', id);
        if (!userCart.Error) {

            // Validate token
            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
            if (token) {
                var tokenIsValid = await handlers._tokens.verfifyToken(token, userCart.result.userEmail);
                if (tokenIsValid) {
                    return {
                        statusCode: 200, message: userCart.result
                    };
                } else {
                    return {
                        statusCode: 403
                    };
                }
            } else {
                return {
                    statusCode: 404
                };
            }
        } else {
            return { statusCode: 400, message: 'Invalid cart' };
        }
    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
};

// Delete a cart
handlers._cart.delete = async (data) => {

    // Get the cart id
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {

        // Get the cart
        var userCart = await _data.read('cart', id);
        if (!userCart.Error) {

            // Validate token
            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
            if (token) {
                var tokenIsValid = await handlers._tokens.verfifyToken(token, userCart.result.userEmail);
                if (tokenIsValid) {

                    // Delete the cart
                    var toDelete = await _data.delete('cart', id);
                    if (!toDelete) {

                        // Delete and update the user to no longer have an attached cart
                        var user = await _data.read('users', userCart.result.userEmail);
                        if (!user.Error) {
                            user.result.cart = '';
                            var updatedUser = await _data.update('users', user.result.email, user.result);
                            if (!updatedUser) {
                                return {
                                    statusCode: 200
                                };
                            } else {
                                return {
                                    statusCode: 500
                                };
                            }
                        } else {
                            return {
                                statusCode: 500
                            };
                        }
                    } else {
                        return {
                            statusCode: 500
                        };
                    }
                } else {
                    return {
                        statusCode: 403
                    };
                }
            } else {
                return {
                    statusCode: 404
                };
            }
        } else {
            return {
                statusCode: 404
            };
        }
    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
};

// Checkout handler
handlers.checkout = async (data) => {
    var acceptableMethods = ['post'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        let result = await handlers._checkout[data.method](data);
        return result
    } else {
        return {
            statusCode: 405
        };
    }
};
// Container for checkout methods
handlers._checkout = {};

// Execute the checkout
// Required fields = cartId, cc number, cc expiration, cc CVC
handlers._checkout.post = async (data) => {

    // Validate all fields
    var cart = typeof (data.payload.cart) == 'string' && data.payload.cart.trim().length == 20 ? data.payload.cart : false;
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    var ccNumber = typeof (data.payload.ccNumber) == 'string' && data.payload.ccNumber.trim().length >= 15 ? data.payload.ccNumber : false;
    var ccExpMonth = typeof (data.payload.ccExpMonth) == 'string' && data.payload.ccExpMonth.trim().length > 0 && data.payload.ccExpMonth.trim().length < 3 ? data.payload.ccExpMonth : false;
    var ccExpYear = typeof (data.payload.ccExpYear) == 'string' && data.payload.ccExpYear.trim().length > 1 && data.payload.ccExpYear.trim().length < 5 ? data.payload.ccExpYear : false;
    var ccCvc = typeof (data.payload.ccCvc) == 'string' && data.payload.ccCvc.trim().length > 2 && data.payload.ccCvc.trim().length < 5 ? data.payload.ccCvc : false;

    if (cart && token && ccNumber && ccExpMonth && ccExpYear && ccCvc) {

        // Get the cart
        var userCart = await _data.read('cart', cart);
        if (!userCart.Error) {

            // Verify the token
            var tokenIsValid = await handlers._tokens.verfifyToken(token, userCart.result.userEmail)
            if (tokenIsValid) {
                var user = await _data.read('users', userCart.result.userEmail);
                if (!user.Error) {

                    // create data object to send to the stripe API
                    var dataString = {
                        type: 'card',
                        "card[exp_month]": ccExpMonth,
                        "card[exp_year]": ccExpYear,
                        "card[number]": ccNumber,
                        "card[cvc]": ccCvc,
                        "billing_details[address][line1]": user.result.address,
                        "billing_details[name]": `${user.result.firstName} ${user.result.lastName}`
                    };

                    // Create payment object with masked card infor
                    var cardDetails = await payment.getCard(dataString);
                    if (!cardDetails.error) {

                        // Create the data for authorizing the credit card
                        var authLoad = {
                            "amount": userCart.result.total * 100,
                            "currency": 'usd',
                            "payment_method": cardDetails.message
                        }

                        // Authorize the credit card
                        var auth = await payment.intent(authLoad);
                        if (!auth.error) {

                            // Finalize the payment
                            var payFinal = await payment.complete(auth.message);
                            if (!payFinal.error) {

                                //Delete the cart once the payment goes through
                                var deleteCart = { queryStringObject: { id: cart }, headers: { token: token } };
                                var emailData = { id: payFinal.message, total: userCart.result.total }
                                handlers._cart.delete(deleteCart);

                                // Send info to mailGun to email a receipt after the card was charged
                                helpers.sendMailgun(emailData);
                                return { statusCode: 200 };
                            } else {
                                return { statusCode: payFinal.statusCode, message: payFinal.message };
                            }
                        } else {
                            return { statusCode: auth.statusCode, message: auth.message };
                        }
                    } else {
                        return { statusCode: cardDetails.statusCode, message: cardDetails.message };
                    }
                } else {
                    return { statusCode: 500, message: 'Cannot find your account' };
                }
            } else {
                return { statusCode: 403 };
            }
        } else {
            return { statusCode: 400, message: 'Cart does not exist' };
        }
    } else {
        return { statusCode: 400, message: 'Missing required fields' };
    }
}


// Export then handlers module
module.exports = handlers