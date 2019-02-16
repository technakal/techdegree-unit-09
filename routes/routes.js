const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator/check');
const User = require('../models/models').User;
const Course = require('../models/models').Course;

const authenticateUser = (req, res, next) => {
  let message = '';

  const credentials = auth(req);

  if(credentials) {
    User.findOne({ emailAddress: credentials.name }, (err, doc) => {
      if(err) return next(err);
      if( doc ) {
        const authenticated = bcrypt.compareSync(credentials.pass, doc.password);
        if(authenticated) {
          req.currentUser = doc;
          next();
        } else {
          res.status(401).json({error: 'Access Denied'});
        }
      } else {
        res.status(401).json({error: 'Access Denied'});
      }
    });
  } else {
    res.status(401).json({error: 'Access Denied'});
  }
};

router.param('id', (req, res, next, id) => {
  Course.findById(id, (err, doc) => {
    if(err) return next(err);
    if(!doc) {
      err = new Error( 'Not Found' );
      err.status = 404;
      return next(err);
    }
    req.course = doc;
    return next();
  })
});

/**
 * Authenticate to the application.
 * GET /api/users 200
 */
router.get('/users', authenticateUser, (req, res) => {
  const user = req.currentUser
  res.status(200).json({user});
});

/**
 * Create a new user profile.
 * Validate entry for required fields.
 * Make sure email address isn't already in use.
 * POST /api/users 201
 */
router.post('/users', [
  check('firstName')
    .exists({checkNull: true, checkFalsy: true})
    .withMessage('Registration requires a first name.'),
  check('lastName')
    .exists({checkNull:true, checkFalsey: true})
    .withMessage('Registration requires a last name'),
  check('emailAddress')
    .exists( {checkNull: true, checkFalsy: true})
    .withMessage('Registration requires an email address')
    .isEmail()
    .withMessage('Enter a valid email address'),
  check('password')
    .exists({checkNull: true, checkFalsy: true})
    .withMessage(('Registration requires a password'))
], (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({errors: errorMessages});
  }
  const user = new User(req.body);
  User.find({ emailAddress: user.emailAddress}, (err, doc) => {
    if ( err ) return next( err );
    if ( doc.length ) {
      const err = new Error( 'Email Already Registered' );
      err.status = 409;
      return next( err );
    } else {
      user.password = bcrypt.hashSync( user.password );
      user.save( ( err ) => {
        if ( err ) return next( err );
        return res.status( 201 ).location( '/' ).end();
      } );
    }
  });
});

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
      res.status(200).json(courses);
    });
});

/**
 * Retrieve a single course, by ID.
 * Returns the course owner's first and last name.
 * GET /courses/:id 201
 */
router.get('/courses/:id', (req, res, next) => {
  Course.findOne({ _id: req.params.id})
    .populate('user', ['firstName', 'lastName'])
    .exec((err, course) => {
      if(err) return next(err);
      res.status(201).json(course);
    });
});

/**
 * Create a new course.
 * Validates required fields.
 * POST /api/courses 201
 */
router.post('/courses', authenticateUser, [
  check('title')
    .exists({checkNull: true, checkFalsy: true})
    .withMessage('Course creation requires title.'),
  check('description')
    .exists({checkNull: true, checkFalsy: true})
    .withMessage('Course creation requires description.')
], (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({errors: errorMessages});
  }
  const course = new Course(req.body);
  course.user = req.currentUser._id;
  course.save((err, course) => {
    if (err) return next(err);
    res.status(201).location('/' + course._id).end();
  });
});

/**
 * Update the course matching the requested :id
 * PUT /api/courses/:id 201
 * @param [string] id - The course id of the course to update.
 */
// TODO - 36. When the user attempts to update a course, the app shall ensure that the course belongs to the user.
// TODO - 37. When the user attempts to update a course that doesn't belong to the user, the app shall return a 403 error.
router.put('/courses/:id', authenticateUser, [
  check('title')
    .exists({checkNull: true, checkFalsy: true})
    .withMessage('Course update requires title.'),
  check('description')
    .exists({checkNull: true, checkFalsy: true})
    .withMessage('Course update requires description.')
], (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({errors: errorMessages});
  }
  Course.findOne({ _id: req.course._id }, req.body, (err, course) => {
    if ( err ) return next( err );201 ).end();
    res.status(
  });
});

/**
 * Delete the course matching the input :id
 * DELETE /api/courses/:id 201
 * @param [string] id - The course id of the course to delete.
 */
// TODO - 41. When the user attempts to delete a course, the app shall ensure that the course belongs to the user.
// TODO - 42. When the user attempts to delete a course that doesn't belong to the user, the app shall return a 403 error.
router.delete('/courses/:id', (req, res, next) => {
  req.course.remove(err => {
    if ( err ) return next( err );
    res.status( 201 );
  });
});

module.exports = router;
