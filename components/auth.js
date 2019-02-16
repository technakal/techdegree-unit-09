const auth = require('basic-auth');
const bcrypt = require('bcryptjs');
const User = require('../models/models').User;

const authenticateUser = (req, res, next) => {
  let message;

  const credentials = auth(req);

  if (credentials) {
    User.find( { username: credentials.name }, (err, user) => {
      if ( err ) return next( err );
      if ( user ) {
        const authenticated = bcrypt.compareSync( credentials.pass, user.password );
        if ( authenticated ) {
          req.currentUser = user;
        } else {
          message = `Authentication failed for user ${ user.username }.`;
        }
      } else {
        message = `User not found for username ${ credentials.name }`;
      }
    });
    } else {
      message = 'Auth header not found.';
    }
  if (message) {
    console.warn(message);
    res.status(401).json({ message: 'Access Denied' });
  } else {
    next();
  }
};

module.exports = authenticateUser;
