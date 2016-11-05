var schema = require('./schema.js');
var errorHandler = require('./ErrorHandler.js');

this.runUserPublic = function (socket) {
    try {
        socket.on('addNewUser', function (user, callback) {
            try {
                schema.User.filter({ phoneNumber: user.phoneNumber }).execute().then((result) => {
                    try {
                        if (result.length > 0) {
                            callback({id: null});
                            console.log('User Alradey Exist!');
                        }
                        else {
                            var newUser = new schema.User(user);
                            newUser.save((function (socket) {
                                return function (error, doc) {
                                    if (doc && callback) {
                                        callback(doc);
                                        return;
                                    }
                                    else {
                                        errorHandler.WriteError('addNewUser => newUser.save', '(doc && callback) = false');
                                        if (callback) {
                                            callback(error);
                                            return;
                                        }
                                    }
                                    if (error) {
                                        errorHandler.WriteError('addNewUser => newUser.save', error);
                                    }
                                };
                            })(socket)).error(function (err){
                                errorHandler.WriteError('addNewUser => newUser.save => error', err);
                            });
                        }
                    } catch (e) {
                        errorHandler.WriteError('isUserExist => schema.User.filter', e);
                    }
        
                }).error(function (err){
                    errorHandler.WriteError('isUserExist => schema.User.filter => error', err);
                });

            } catch (e) {
                errorHandler.WriteError('addNewUser', e);
            }
        });
    } catch (e) {
        errorHandler.WriteError('runUserPublic', e);
    }
};  