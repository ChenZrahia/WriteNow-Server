var thinky = require('thinky')({ db: 'WriteNow' });
var errorHandler = require('./ErrorHandler.js');
this.r = thinky.r;

try {

    var type = thinky.type;

    this.User = thinky.createModel('User', {
        id: type.string(),
        pkey: type.string(),
        lastSeen: type.date(),
        isOnline: type.boolean(),
        phoneNumber: type.string(),
        blockedFriends: [type.string()],
        ModifyDate: type.date(),
        ModifyPicDate: type.date(),
        isTempUser: type.boolean(),
        publicInfo: {
            fullName: type.string(),
            picture: type.string()
        },
        privateInfo: {
            tokenNotification: type.string()
        }
    });

    this.Conversation = thinky.createModel('Conversation', {
        convId: type.string(),
        isEncrypted: type.boolean().default(false),
        manager: type.string(),
        groupName: type.string(),
        groupPicture: type.string(),
        isGroup: type.boolean().default(false)
    });

    this.Message = thinky.createModel('Message', {
        mid: type.string(),
        convId: type.string(),
        isEncrypted: type.boolean().default(false),
        from: type.string(), 
        to: type.string(), //למחוק
        content: type.string(),
        image: type.string(),
        sendTime: type.date(),
        lastTypingTime: type.date(),
        seen: [{ uid: type.string(), when: type.date() }], //array of all users that read the messages
    });

    this.friendsOnline = thinky.createModel('friendsOnline', {
        id: type.string(),
        uid: type.string(),
        fid: type.string(),
        isOnline: type.boolean(),
        lastSeen: type.date()
    });
    
    this.Error = thinky.createModel('Error', {
        id: type.string(),
        message: type.string(),
        stackTrace: type.string(),
        isClient: type.boolean(),
        timestamp: type.date(),
        userId: type.string()
    });

    /*
     * Define Relationships.
     */
    this.User.hasMany(this.Conversation, "Conversations", "uid", "convId");

    this.Conversation.hasMany(this.Message, "messages", "id", "convId");

    this.Conversation.hasAndBelongsToMany(this.User, "participates", "id", "id");
    this.User.hasAndBelongsToMany(this.Conversation, "convs", "id", "id");

    this.User.hasAndBelongsToMany(this.User, "friends", "id", "id", {  type: 'friends' });
    this.User.hasAndBelongsToMany(this.User, "friends_followers", "id", "id", {  type: 'friends_followers' });
    
    this.User.defineStatic('follow', function(targetUser, uid, Fuid) {
      return Promise.all([
        this.addRelation('friends', { id: Fuid }),
        targetUser.addRelation('friends_followers', { id: uid }),
      ]);
    });
    this.User.defineStatic('unfollow', function(targetUser) {
      return Promise.all([
        this.removeRelation('friends', { id: targetUser.id }).run(),
        targetUser.removeRelation('friends_followers', { id: this.id }).run(),
      ]);
    });
} catch (e) {
    errorHandler.WriteError('schema.js', e);
}


