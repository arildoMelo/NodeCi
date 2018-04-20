const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const keys = require('../config/keys');

const User = mongoose.model('User');

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id).then(user => {
		done(null, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			callbackURL: '/auth/google/callback',
			clientID: keys.googleClientID,
			clientSecret: keys.googleClientSecret,
			proxy: false
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				console.log('get user from db');
				const existingUser = await User.findOne({ googleId: profile.id });
				if (existingUser) {
					return done(null, existingUser);
				}
				console.log('save user to db');
				const user = await new User({

					googleId: profile.id,
					displayName: profile.displayName
				}).save();
				done(null, user);
			} catch (err) {
				done(err, null);
			}
		}
	)
);
