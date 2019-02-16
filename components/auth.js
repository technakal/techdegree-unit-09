const auth = require('basic-auth');
// const User = require('../models/models').User;

const authenticateUser = (req, res, next) => {
  let message;

  const credentials = auth(req);

  if (credentials) {
    const users = [1, 2, 3];
    console.log(users);
  }

  next();
};

module.exports = authenticateUser;
