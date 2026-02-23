const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateId } = require('../utils/generateId');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleEmail = profile.emails[0].value;
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      if (user.role !== 'student') {
        user.role = 'student';
        await user.save();
      }
      return done(null, user);
    }
    
    user = await User.findOne({ email: googleEmail });
    
    if (user) {
      user.googleId = profile.id;
      user.role = 'student';
      user.authProvider = 'google';
      user.avatar = profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }
    
    const userId = await generateId('userId');
    user = await User.create({
      userId,
      googleId: profile.id,
      name: profile.displayName,
      email: googleEmail,
      avatar: profile.photos[0]?.value,
      role: 'student',
      authProvider: 'google'
    });
    
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
