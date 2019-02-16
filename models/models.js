'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'Registration requires first name.']
  },
  lastName: {
    type: String,
    required: [true, 'Registration requires last name.']
  },
  emailAddress: {
    type: String,
    required: [true, 'Registration requires email address.']
  },
  password: {
    type: String,
    required: [true, 'Registration requires password.']
  },
});

const CourseSchema = new Schema({
  title: {
    type: String,
    required: [ true, 'Course creation requires title.']
  },
  description: {
    type: String,
    required: [ true, 'Course creation requires description.']
  },
  estimatedTime: String,
  materialsNeeded: String,
  user: [{type: Schema.Types.ObjectId, ref: 'User'}],
});

const User = mongoose.model('User', UserSchema);

const Course = mongoose.model('Course', CourseSchema);

module.exports.User = User;

module.exports.Course = Course;
