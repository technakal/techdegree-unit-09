const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator/check');
const User = require('../models/models').User;
const Course = require('../models/models').Course;

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

// TODO - GET /api/users 200
// TODO 17. The user shall log in by accessing the GET /api/users 200 route.
// TODO - 18. When the user provides an incorrect email address during login, the app shall return 401 error to the user.
// TODO - 19. When the user provides an incorrect password during login, the app shall return 401 error to the user.
router.get('/users', (req, res) => {
  res.status(200).json({
    todo: 'create sign-in route',
    description: 'This route authenticates the user.'
  })
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
// TODO - Dynamically pass in user after authorization and before course creation
router.post('/courses', [
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
  course.save((err, course) => {
    if (err) return next(err);
    res.status(201).location('/' + course._id).end();
  });
});

// TODO - PUT /api/courses/:id 201
// TODO - 34. The user shall update a course by accessing the PUT /api/courses/:id 204 route.
// TODO - 35. When the user updates a course, the app shall require the following values: title, description
// TODO - 36. When the user attempts to update a course, the app shall ensure that the course belongs to the user.
// TODO - 37. When the user attempts to update a course that doesn't belong to the user, the app shall return a 403 error.
// TODO - 38. When the user updates the course, the app shall return no content to the user.
// TODO - 39. When the user updates a course and fails to provide the required information, the app shall return a 400 error to the user.
router.put('/courses/:id', (req, res, next) => {
  res.status(201).json({
    id: req.params.id,
    todo: 'set up auth',
    description: 'This is the route for updating a course.',
  });
});

// TODO - DELETE /api/courses/:id 201
// TODO - 40. The user shall delete a course by accessing the DELETE /api/courses/:id 204 route.
// TODO - 41. When the user attempts to delete a course, the app shall ensure that the course belongs to the user.
// TODO - 42. When the user attempts to delete a course that doesn't belong to the user, the app shall return a 403 error.
// TODO - 43. When the user deletes the course, the app shall return no content to the user.
router.delete('/courses/:id', (req, res, next) => {
  Course.findById(req.params.id, (err, doc) => {
    if (err) return next(err);
    if (!doc) {
      err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
    doc.remove(err => {
      if (err) return next(err);
      doc.save((err, course) => {
        if (err) return next(err);
        res.status(201).json({ status: 'deleted' });
      });
    });
  });
});

module.exports = router;
