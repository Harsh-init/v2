const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');

let uuid_count=317018 ;
async function getUuid(){
  let latest_user=await User.findOne({"uuid": { $exists: true, $ne: null }}, {}, {
              sort: {_id: -1}
            })

  if (latest_user) {
    console.log(latest_user.uuid)
    uuid_count= parseInt(latest_user.uuid,16) + 9
    console.log('Count UUID : ' +uuid_count)

  } else {
    console.log('cant find lATEST USER UUID ')
  }
}
getUuid()


// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {


  const { name, email,referalcode, password, password2 } = req.body;
  let errors = [];
  console.log(referalcode)
  console.dir(name)
  if (!name || !email || !password || !password2 || !referalcode) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

 
  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      referalcode,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          referalcode,
          password,
          password2
        });
      } else {
          User.findOne({ referalcode: referalcode }).then(user => {
        if (user || referalcode=='none') {
         
             const newUser = new User({
              name,
              email,
              password
            });
             if (referalcode == "none") {
               
             } else {
             newUser.referrer=user._id 
             }
              
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser.uuid= uuid_count.toString(16)
                uuid_count=uuid_count + 9
                console.log(newUser)
                newUser
                  .save()
                  .then(user => {
                    req.flash(
                      'success_msg',
                      'You are now registered and can log in'
                    );
                    res.redirect('/users/login');
                  })
                  .catch(err => console.log(err));
              });
            });

        } else {
           errors.push({ msg: 'Invalid Referal code' });
            res.render('register', {
            errors,
            name,
            email,
            referalcode,
            password,
            password2
          });
        }
        })
      } // else end here 
    });
  }

});

// Login
router.post('/login', (req, res, next) => {


  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);

});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});


module.exports = router;
