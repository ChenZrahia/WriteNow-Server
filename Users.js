var schema = require('./schema.js');
var errorHandler = require('./ErrorHandler.js');

this.isUserExist = function (uid, callback) {
    try {
        if (!uid) {
            callback(false);
            return;
        }
        schema.User.filter({ id: uid }).execute().then(function (result) {
            try {
                if (result.length > 0) {
                    callback(true);
                    return;
                }
                else {
                    callback(false);
                    return;
                }
            } catch (e) {
                errorHandler.WriteError('isUserExist => schema.User.filter', e);
            }

        }).error(function (err){
            errorHandler.WriteError('isUserExist => schema.User.filter => error', err);
        });
    } catch (e) {
        errorHandler.WriteError('isUserExist', e);
    }
};

this.runUser = function (socket, sockets) {
    try {
        socket.on('SearchUser', function (name, callback) {
            try {
                schema.User.get(socket.handshake.query.uid).getJoin({ friends: true }).execute().then(function (myUser) {
                    try {
                        schema.User.filter(function (user) {
                            try {
                                var res = user("publicInfo")("fullName").match("(?i)" + name);
                                return res;
                            } catch (e) {
                                errorHandler.WriteError('on SearchUser => schema.User.get(socket.handshake.query.uid) => schema.User.filter', e);
                            }
                        }).limit(7)
                                     .merge(function (user) {
                                         try {
                                             return {
                                                 'isFriend': schema.r.expr(myUser.friends).contains(user)
                                             }
                                         } catch (e) {
                                             errorHandler.WriteError('on SearchUser => schema.User.get(socket.handshake.query.uid) => merge', e);
                                         }
                                     })
                                     .execute().then(function (result) {
                                         try {
                                             if (callback) {
                                                 callback(result);
                                             }
                                         } catch (e) {
                                             errorHandler.WriteError('on SearchUser => schema.User.get(socket.handshake.query.uid) => execute().then', e);
                                         }
                                     });
                    } catch (e) {
                        errorHandler.WriteError('on SearchUser => schema.User.get(socket.handshake.query.uid)', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('on SearchUser => schema.User.get => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('on SearchUser', e);
            }
        });

        socket.on('GetAllUsers', function (callback) { //for test only
            try {
                schema.User.run().then(function (result) {
                    try {
                        if (callback) {
                            callback(result);
                        }
                    } catch (e) {
                        errorHandler.WriteError('GetAllUsers => schema.User.run()', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('GetAllUsers => schema.User => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllUsers', e);
            }
        });

        socket.on('GetAllMyFriends', function (callback) { //לבטל/למחוק
            try {
                schema.User.get(socket.handshake.query.uid).getJoin({ friends: true }).execute().then(function (myUser) {
                    try {
                        if (callback) {
                            callback(myUser.friends);
                        }
                    } catch (e) {
                        errorHandler.WriteError('GetAllMyFriends => schema.User.get', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('GetAllMyFriends => schema.User.get => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('GetAllMyFriends', e);
            }
        });
        
        socket.on('GetMyFriendsChanges', function (usersToServer, callback) {
            try {
                console.log(usersToServer);
                var friendUidArray = usersToServer.friendUidArray;
                var phonesArray = usersToServer.phonesArray.filter((num) => {return num != null});
                schema.User.filter((usr) => {
                    try {
                        return (schema.r.expr(phonesArray).contains(usr("phoneNumber"))).and(schema.r.expr(friendUidArray).contains(usr("id")).not());
                    } catch (e) {
                        errorHandler.WriteError('GetMyFriendsChanges => schema.User.filter', e);
                    }
                }).run().then(function (myFriends) {
                    try {
                        console.log(myFriends);
                        if (callback) {
                            callback(myFriends);
                        }
                    } catch (e) {
                        errorHandler.WriteError('GetMyFriendsChanges => schema.User.get', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('GetMyFriendsChanges => schema.User.get => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('GetMyFriendsChanges', e);
            }
        });

        socket.on('GetUserByUid', function (uid, callback) {
            try {
                schema.User.get(uid).run().then(function (result) {
                    try {
                        if (callback) {
                            callback(result);
                        }
                    } catch (e) {
                        errorHandler.WriteError('GetUserByUid => schema.User.get', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('GetUserByUid => schema.User.get => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('GetUserByUid', e);
            }
        });

        socket.on('GetUserFriends', function (callback) {
            try {
                schema.User.get(socket.handshake.query.uid).run().then(function (result) {
                    try {
                        if (callback) {
                            callback(result);
                        }
                    } catch (e) {
                        errorHandler.WriteError('GetUserFriends => schema.User.get', e);
                    }
                }).error(function (err){
                    errorHandler.WriteError('GetUserFriends => schema.User.get => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('GetUserFriends', e);
            }
        });

        socket.on('addFriend', function (Fuid, callback, ErrorCallback) {
            try {
                if (socket.handshake.query.uid != Fuid) {
                    //schema.User.get(socket.handshake.query.uid).addRelation("friends", { id: Fuid });
                    schema.User.get(socket.handshake.query.uid).follow(schema.User.get(Fuid), socket.handshake.query.uid, Fuid);
                    if (callback) {
                        callback();
                    }
                }
                else {
                    errorHandler.WriteError('addFriend => uid == Fuid', 'User try to add himself as a friend');
                }
            } catch (e) {
                errorHandler.WriteError('addFriend', e);
            }
        });

        socket.on('removeFriend', function (Fuid, callback, ErrorCallback) { //צריך לתקן. removeRelation!
            try {
                console.log('removeFreind with uid: ' + Fuid);
                schema.User.get(socket.handshake.query.uid).run().then(function (user) {
                    if (!user.friends) {
                        user.friends = [];
                        ErrorCallback('invalid friend');
                    }
                    else {
                        var indexOfFriend = user.friends.indexOf(Fuid);
                        if (indexOfFriend >= 0) {
                            user.friends.splice(indexOfFriend, 1);
                            if (callback) {
                                callback();
                            }
                        }
                        else {
                            if (ErrorCallback) {
                                ErrorCallback('invalid friend');
                            }
                        }
                    }
                }).error(function (err){
                    errorHandler.WriteError('removeFriend => schema.User.get => error', err);
                });
            } catch (e) {
                errorHandler.WriteError('removeFriend', e);
            }
        });

        schema.friendsOnline.filter(
          function (user) {
              try {
                  return user("uid").eq(socket.handshake.query.uid);
              } catch (e) {
                  errorHandler.WriteError('runUser => schema.friendsOnline.filter', e);
              }
          }).delete().run();

        schema.User.filter({ id: socket.handshake.query.uid }).getJoin({ friends: true }).pluck('friends').map(function (friends) {
            try {
                return friends("friends").map(function (friend) {
                    try {
                        return {
                            uid: socket.handshake.query.uid,
                            fid: friend("id"),
                            isOnline: friend("isOnline")
                        };
                    } catch (e) {
                        errorHandler.WriteError('runUser => schema.User.filter => map', e);
                    }
                });
            } catch (e) {
                errorHandler.WriteError('runUser => schema.User.filter', e);
            }
        }).execute().then(function (result) {
            try {
                schema.friendsOnline.insert(result[0]).run();
            } catch (e) {
                errorHandler.WriteError('runUser => schema.User.filter => execute().then', e);
            }
        }).error(function (err){
                    errorHandler.WriteError('runUser => schema.User.filter => error', err);
                });

        schema.friendsOnline.filter({ uid: socket.handshake.query.uid }).changes().execute().then(function (result) {
            try {
                result.each(function (oldValue, newValue) {
                    socket.emit('friendOnline', newValue);
                });
            } catch (e) {
                errorHandler.WriteError('runUser => schema.friendsOnline.filter => execute().then', e);
            }
        }).error(function (err){
            errorHandler.WriteError('runUser => schema.friendsOnline.filter => error', err);
        });
    } catch (e) {
        errorHandler.WriteError('runUser', e);
    }
};