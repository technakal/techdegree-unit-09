const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator/check');
const User = require('../models/models').User;
const Course = require('../models/models').Course;

/**
 * Authenticates the user to the app.
 * @param req
 * @param res
 * @param next
 */
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

/**
 * Checks if the current user is the owner of the current course.
 * @param [object] req - The request object, containing course and user information.
 * @returns {boolean}
 */
const isCourseOwner = (req) => {
  const courseOwner = req.course.user[0]._id.toString();
  const currentOwner = req.currentUser._id.toString();
  return courseOwner === currentOwner;
};

/**
 * Pulls the course associated with the entered id.
 */
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
 * GET /courses/:id 200
 */
router.get('/courses/:id', (req, res, next) => {
  Course.findOne({ _id: req.params.id})
    .populate('user', ['firstName', 'lastName'])
    .exec((err, course) => {
      if(err) return next(err);
      res.status(200).json(course);
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
 * Prevents the user from updating the course if they are not the owner.
 * PUT /api/courses/:id 204
 * @param [string] id - The course id of the course to update.
 */
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
  if(isCourseOwner(req)) {
    Course.findOneAndUpdate({ _id: req.params.id }, req.body, (err, doc) => {
      if(err) return next(err);
      res.status(204).json(doc);
    });
  } else {
    res.status(403).json('Unauthorized');
  }
});

/**
 * Delete the course matching the input :id
 * Prevents the user from deleting the course if they are not the course owner.
 * DELETE /api/courses/:id 204
 * @param [string] id - The course id of the course to delete.
 */
router.delete('/courses/:id', authenticateUser, (req, res, next) => {
  if(isCourseOwner(req)) {
    Course.findOneAndDelete({ _id: req.course._id }, (err) => {
      if(err) return next(err);
      res.status(204).json('Deleted');
    })
  } else {
    res.status(403).json('Unauthorized');
  }
});

module.exports = router;
