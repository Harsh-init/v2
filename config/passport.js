const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// Load User model
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email
      }).then(user => {
        console.log(user)
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
    console.log('serializeUser')
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id).
    populate({
      path: 'referrer',
      select: 'name referrer',
      populate: {
        path: 'referrer',
        select: 'name referrer',
        populate: {
          path: 'referrer',
          select: 'name referrer',
          populate: {
            path: 'referrer',
            select: 'name referrer',
            populate: {
              path: 'referrer',
              select: 'name referrer',
              // 5
              populate: {
                path: 'referrer',
                select: 'name referrer',
                populate: {
                  path: 'referrer',
                  select: 'name referrer',
                  populate: {
                    path: 'referrer',
                    select: 'name referrer',
                    populate: {
                      path: 'referrer',
                      select: 'name referrer',
                      populate: {
                        path: 'referrer',
                        select: 'name referrer'
                        // 10
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }).
     exec(function (err, user) {
    if (err) return handleError(err);
    console.log('The author is %s', user);
      done(err,user)
      });
  });
};

