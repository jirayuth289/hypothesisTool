var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/user');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var secret = process.env.SECRET;
var port = process.env.PORT || 3000;


module.exports = function(app, passport) {

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }));

    passport.serializeUser(function(user, done) {
        // Check if the user has an active account
        if (user.active) {
            // Check if user's social media account has an error
            //if (user.error) {
            //  token = 'unconfirmed/error'; // Set url to different error page
            //} else {
            token = jwt.sign({ id: user._id, name: user.name, username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // If account active, give user token
            //}
        } else {
            token = 'inactive/error'; // If account not active, provide invalid token for use in redirecting later
        }

        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    //Facebook Strategy
    passport.use(new FacebookStrategy({
            clientID: '370420283328844',
            clientSecret: '19ed4aad64fafbc3b6eff61d0fd8899e',
            callbackURL: "http://localhost:"+port+"/auth/facebook/callback",
            profileFields: ['id', 'displayName', 'photos', 'email']
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({ email: profile._json.email }).select('_id name username password email active').exec(function(err, user) {
                if (err) done(err);

                if (user && user != null) {
                    done(null, user);
                } else {
                    done(err);
                }
            });
            // done(null, profile);
        }
    ));

    // Google Strategy
    passport.use(new GoogleStrategy({
            clientID: "509363706619-ah5qcrqulv6g31o02svqeb983bg49k8m.apps.googleusercontent.com",
            clientSecret: "yiMAY45sGVQv3v7snidsS4Td",
            callbackURL: "http://localhost:"+port+"/google/callback"
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({ email: profile.emails[0].value }).select('_id name username password email active').exec(function(err, user) {
                if (err) done(err);

                if (user && user != null) {
                    done(null, user);
                } else {
                    done(err);
                }
            });
            // done(null, profile);
        }
    ));

    // Google Routes    
    app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/googleerror' }), function(req, res) {
        res.redirect('/google/' + token); // Redirect user with newly assigned token
    });


    // Facebook Routes
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
            failureRedirect: '/facebookerror'
        }),
        function(req, res) {
            res.redirect('/facebook/' + token);
        });

    app.get('/auth/facebook',
        passport.authenticate('facebook', { scope: 'email' })
    );
    return passport;
}
