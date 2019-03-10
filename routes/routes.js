const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/models').User;
const Course = require('../models/models').Course;

/**
 * Verify JSON web token.
 */
const verifyToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];

  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }

    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) return next(err);
      req.currentUser = decoded.username;
      return next();
    });
  } else {
    return res
      .status(401)
      .json({
        success: false,
        message: 'No auth token. Please sign in.',
      })
      .next();
  }
};

/**
 * Authenticates the user to the app.
 * @param req
 * @param res
 * @param next
 */
const authenticateUser = (req, res, next) => {
  const credentials = auth(req);

  if (credentials) {
    User.findOne({ emailAddress: credentials.name }, (err, doc) => {
      if (err) return next(err);
      if (doc) {
        const authenticated = bcrypt.compareSync(
          credentials.pass,
          doc.password
        );
        if (authenticated) {
          req.currentUser = doc;
          req.token = jwt.sign({ username: credentials.name }, config.secret, {
            expiresIn: '30d',
          });
          next();
        } else {
          res.status(401).json({ error: 'Incorrect password.' });
        }
      } else {
        res.status(401).json({ error: `That account doesn't exist.` });
      }
    });
  } else {
    res.status(401).json({ error: `You're missing your login credentials.` });
  }
};

/**
 * Checks if the current user is the owner of the current course.
 * @param [object] req - The request object, containing course and user information.
 * @returns {boolean}
 */
const isCourseOwner = (req, res, next) => {
  User.find({ emailAddress: req.currentUser }, (err, doc) => {
    if (err) return next(err);
    if (!doc) {
      err = new Error('Not Found');
      err.status = 401;
      return next(err);
    }
    req.isOwner = doc[0]._id.toString() === req.course.user[0].toString();
    next();
  });
};

const getUser = (req, res, next) => {
  User.find({ emailAddress: req.currentUser }, (err, doc) => {
    if (err) return next(err);
    if (!doc) {
      err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
    req.user = doc[0];
    next();
  });
};

/**
 * Pulls the course associated with the entered id.
 */
router.param('id', (req, res, next, id) => {
  Course.findById(id, (err, doc) => {
    if (err) return next(err);
    if (!doc) {
      err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
    req.course = doc;
    return next();
  });
});

/**
 * Authenticate to the application.
 * GET /api/users 200
 */
router.get('/users', authenticateUser, (req, res) => {
  const user = req.currentUser;
  const decoded = req.decoded;
  const token = req.token;
  const response = {
    success: true,
    user,
    token,
    decoded,
  };
  res.status(200).json(response);
});

/**
 * Create a new user profile.
 * Validate entry for required fields.
 * Make sure email address isn't already in use.
 * POST /api/users 201
 */
router.post(
  '/users',
  [
    check('firstName')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Registration requires a first name.'),
    check('lastName')
      .exists({ checkNull: true, checkFalsey: true })
      .withMessage('Registration requires a last name'),
    check('emailAddress')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Registration requires an email address')
      .isEmail()
      .withMessage('Enter a valid email address'),
    check('password')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Registration requires a password'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }
    const user = new User(req.body);
    User.find({ emailAddress: user.emailAddress }, (err, doc) => {
      if (err) return next(err);
      if (doc.length) {
        const err = new Error('Email Already Registered');
        err.status = 409;
        return next(err);
      } else {
        user.password = bcrypt.hashSync(user.password);
        user.save(err => {
          if (err) return next(err);
          req.token = jwt.sign({ username: user.emailAddress }, config.secret, {
            expiresIn: '30d',
          });
          User.find({ emailAddress: user.emailAddress }, (err, doc) => {
            if (err) return next(err);
            if (!doc) {
              err = new Error('Not Found');
              err.status = 401;
              return next(err);
            }
            const userRes = {
              user: {
                firstName: doc[0].firstName,
                lastName: doc[0].lastName,
                emailAddress: doc[0].emailAddress,
                id: doc[0]._id.toString(),
              },
              token: req.token,
            };
            return res
              .status(201)
              .location('/')
              .json(userRes)
              .end();
          });
        });
      }
    });
  }
);

/**
 * Retrieves all courses and returns to the user.
 * Returns the course owner's first and last name.
 * GET /api/courses 200
 */
router.get('/courses', (req, res, next) => {
  Course.find({}, null, { sort: { title: 1 } })
    .populate('user', ['firstName', 'lastName'])
    .exec((err, courses) => {
      if (err) return next(err);
      if (!courses) {
        const errorMessage = ['No courses found.'];
        res.status(404).json(errorMessage);
      } else {
        res.status(200).json(courses);
      }
    });
});

/**
 * Retrieve a single course, by ID.
 * Returns the course owner's first and last name.
 * GET /courses/:id 200
 */
router.get('/courses/:id', (req, res, next) => {
  Course.findOne({ _id: req.params.id })
    .populate('user', ['firstName', 'lastName'])
    .exec((err, course) => {
      if (err) return next(err);
      res.status(200).json(course);
    });
});

/**
 * Create a new course.
 * Validates required fields.
 * POST /api/courses 201
 */
router.post(
  '/courses',
  verifyToken,
  getUser,
  [
    check('title')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Course creation requires title.'),
    check('description')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Course creation requires description.'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }
    const course = new Course(req.body);
    course.user = req.user._id;
    course.save((err, course) => {
      if (err) return next(err);
      res
        .status(201)
        .location('/' + course._id)
        .end();
    });
  }
);

/**
 * Update the course matching the requested :id
 * Prevents the user from updating the course if they are not the owner.
 * PUT /api/courses/:id 204
 * @param [string] id - The course id of the course to update.
 */
router.put(
  '/courses/:id',
  verifyToken,
  isCourseOwner,
  [
    check('title')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Course update requires title.'),
    check('description')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Course update requires description.'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }
    if (req.isOwner) {
      Course.findOneAndUpdate({ _id: req.params.id }, req.body, (err, doc) => {
        if (err) return next(err);
        res.status(204).json(doc);
      });
    } else {
      res.status(403).json('Unauthorized');
    }
  }
);

/**
 * Delete the course matching the input :id
 * Prevents the user from deleting the course if they are not the course owner.
 * DELETE /api/courses/:id 204
 * @param [string] id - The course id of the course to delete.
 */
router.delete('/courses/:id', verifyToken, isCourseOwner, (req, res, next) => {
  if (req.isOwner) {
    Course.findOneAndDelete({ _id: req.course._id }, err => {
      if (err) return next(err);
      res.status(204).json('Deleted');
    });
  } else {
    res.status(403).json('Unauthorized');
  }
});

module.exports = router;
