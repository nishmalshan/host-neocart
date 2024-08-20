const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, done) {
  console.log('Profile............:', profile);
  if (!profile) {
    console.error('Profile is undefined');
    return done(new Error('Failed to retrieve profile'));
  }
  // Your logic to find or create a user
  return done(null, profile);
}));

// Serialize and deserialize user
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
