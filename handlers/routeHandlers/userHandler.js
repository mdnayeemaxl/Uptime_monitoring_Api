// user related handler
// Handler to handle user related routes
const data = require('../../lib/data');
// const { handleReqRes } = require('../../helpers/handleReqRes'); // It may not need here
const { parseJSON } = require('../../helpers/utilities');
const { hash } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');

const handler = {};
handler._users = {};
handler.userHandler = (requestProperties, callback) => {
    const acceptendMethods = ['get', 'post', 'put', 'delete'];
    if (acceptendMethods.indexOf(requestProperties.method) > -1) {
        handler._users[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._users.post = (requestProperties, callback) => {
    const firstName =        requestProperties.body.firstName.trim().length > 0
            ? requestProperties.body.firstName
            : false;

    const lastName =        requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;

    const phone = requestProperties.body.phone.length === 11 ? requestProperties.body.phone : false;

    const password =        requestProperties.body.password.length > 0 ? requestProperties.body.password : false;

    const tosAgreement = requestProperties.body.tosAgreement
        ? requestProperties.body.tosAgreement
        : false;
    console.log(firstName, lastName, phone, tosAgreement);
    if (firstName && lastName && phone && tosAgreement) {
        // make sure that user doesn't already exists

        data.read('users', phone, (err1) => {
            if (err1) {
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    tosAgreement,
                };
                data.create('users', phone, userObject, (err) => {
                    if (!err) {
                        callback(200, {
                            message: ' user was created successfully',
                        });
                    } else {
                        callback(500, { error: 'Could not creat users' });
                    }
                });
            } else {
                callback(500, { error: 'There is a problem in server side' });
            }
        });
    } else {
        callback(112, {
            error: 'You have a problem in your request',
        });
    }
};
handler._users.get = (requestProperties, callback) => {
    const phone =        requestProperties.queryStringObject.phone.length === 11
            ? requestProperties.queryStringObject.phone
            : false;
    if (phone) {
        const token =            typeof requestProperties.headersObject.token === 'string'
                ? requestProperties.headersObject.token
                : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                // lookup users
                data.read('users', phone, (err, u) => {
                    const user = { ...parseJSON(u) };
                    if (!err && user) {
                        delete user.password;
                        callback(200, user);
                    } else {
                        callback(404, { error: 'requested users was not found' });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication fail',
                });
            }
        });
    } else {
        callback(404, { error: 'requested users was not found' });
    }
};

handler._users.put = (requestProperties, callback) => {
    const phone = requestProperties.body.phone.length === 11 ? requestProperties.body.phone : false;

    const firstName =        requestProperties.body.firstName.trim().length > 0
            ? requestProperties.body.firstName
            : false;

    const lastName =        requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;

    const password =        requestProperties.body.password.length > 0 ? requestProperties.body.password : false;
    if (phone) {
        if (firstName || lastName || password) {
            const token =                typeof requestProperties.headersObject.token === 'string'
                    ? requestProperties.headersObject.token
                    : false;

            tokenHandler._token.verify(token, phone, (tokenId) => {
                if (tokenId) {
                    // look up the user
                    data.read('users', phone, (err7, udata) => {
                        const userData = { ...parseJSON(udata) };
                        if (!err7 && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = hash(password);
                            }
                            // Update to database
                            data.update('users', phone, userData, (err5) => {
                                if (!err5) {
                                    callback(200, { message: 'user has updated successfully' });
                                } else {
                                    callback(500, { error: 'There is a problem in serversite' });
                                }
                            });
                        } else {
                            callback(400, { error: 'You have problem in your request' });
                        }
                    });
                } else {
                    callback(403, {
                        error: 'Authentication fail',
                    });
                }
            });
        } else {
            callback(400, { error: 'You have problem in your request' });
        }
    } else {
        callback(400, { err: 'Invalid phone Number' });
    }
};
handler._users.delete = (requestProperties, callback) => {
    const phone =        requestProperties.queryStringObject.phone.trim().length === 11
            ? requestProperties.queryStringObject.phone
            : false;
    if (phone) {
        data.read('users', phone, (err99, userdata) => {
            if (!err99 && userdata) {
                data.delete('users', phone, (err8) => {
                    if (!err8) {
                        callback(200, { message: 'user successfully created' });
                    }
                });
            } else {
                callback(400, { error: 'There is a problem in your request' });
            }
        });
    } else {
        callback(400, { error: 'There is a problem in your request' });
    }
};

module.exports = handler;
