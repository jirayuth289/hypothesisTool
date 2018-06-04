var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');

// User Name Validator
var nameValidator = [
    validate({
        validator: 'matches',
        arguments: /^(([\u0E00-\u0E7Fa-zA-Z]{3,20})+[ ]+([\u0E00-\u0E7Fa-zA-Z]{3,20})+)+$/,
        message: 'Name must be at least 3 characters, max 30, no special characters or numbers, must have space in between name.'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 40],
        message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];


// User E-mail Validator
var emailValidator = [
    validate({
        validator: 'matches',
        arguments: /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/,
        message: 'Name must be at least 3 characters, max 40, no special characters or numbers, must have space in between name.'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 40],
        message: 'Email should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

var usernameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 25],
        message: 'Username should be between {ARGS[0]} and {ARGS[1]} characters'
    }),
    validate({
        validator: 'isAlphanumeric',
        message: 'Username must contain letters and numbers only.'
    })
];

var passwordValidator = [
    validate({
        validator: 'matches',
        //(?=.*?[\W])   special character
        arguments: /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d]).{8,35}$/,
        message: 'Password needs to have at least one lower case, one uppercase, one number and must be at least 8 characters but no more than 35.'
    }),
    validate({
        validator: 'isLength',
        arguments: [8, 35],
        message: 'Password should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

var UserSchema = new Schema({
    name: { type: String, required: true, validate: nameValidator },
    username: { type: String, lowercase: true, required: true, unique: true, validate: usernameValidator },
    password: { type: String, required: true, validate: passwordValidator, select: false },
    email: { type: String, unique: true, required: true, validate: emailValidator },
    diagram: { type: Array, required: false },
    active: { type: Boolean, required: true, default: false },
    temporarytoken: { type: String, required: true },
    resettoken: { type: String, required: false },
    permission: { type: String, required: true, default: 'user' },
    created: { type: Date, default: Date.now }
});

// Middleware to ensure password is encrypted before saving user to database
UserSchema.pre('save', function(next) {
    var user = this;

    if (!user.isModified('password')) return next(); // If password was not changed or is new, ignore middleware

    // Function to encrypt password 
    bcrypt.hash(user.password, null, null, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
    });
});

//UserSchema.plugin(titlize, {
//    paths: ['name']
//});

UserSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);