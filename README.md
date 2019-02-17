# REST API Project

## Treehouse Techdegree Unit 09 Project

In this project, you’ll create a REST API using Express. The API will provide a way for users to administer a school database containing information about courses: users can interact with the database by retrieving a list of courses, as well as adding, updating and deleting courses in the database.

In addition, the project will require users to create an account and log-in to make changes to the database.

To complete this project, you’ll use your knowledge of REST API design, Node.js, and Express to create API routes, along with the Mongoose ORM for data modeling, validation, and persistence. To test your application, you'll use Postman, a popular application for exploring and testing REST APIs.

### Routes

- GET /api/users 200
- POST /api/users 201
- GET /api/courses 200
- POST /api/courses 201
- PUT /api/courses 201
- DELETE /api/courses 201

### Requirements

#### Technology

1. Create a REST API using Express.
2. Use mongoDB for the backend database.
3. Use Mongoose to connect the Express app to the database.
4. When the app successfully connects to the database, log a success message to the console.
5. When the app fails to connect to the database, log a failure message to the console.
6. The app shall use Mongoose to validate user entry.
7. The app shall use `bcrypt` to hash the password.
8. The app shall use `basic-auth` to ensure that users must be logged in to perform create, update, and delete functions on the courses routes.
   1. The authentication middelware shall apply to the following routes;
      1. GET /api/users
      2. POST /api/courses
      3. PUT /api/courses
      4. DELETE /api/courses.

#### Schemas

9. The User document shall use the following schema:
   - \_id - ObjectId, system generated
   - firstName - String
   - lastName - String
   - emailAddress - String
   - password - String
10. The Course document shall use the following schema:
   - \_id - ObjectId, system generated
   - user - \_id from the User collection
   - title - String
   - description - String
   - estimatedTime - String
   - materialsNeeded - String

#### Routes

17. The user shall log in by accessing the GET /api/users 200 route.
18. When the user provides an incorrect email address during login, the app shall return 401 error to the user.
19. When the user provides an incorrect password during login, the app shall return 401 error to the user.
20. The user shall create a user profile by accessing the POST /api/users 201 route.
21. When the user creates a user profile, the app shall require the folloing values:
    1. firstName
    2. lastName
    3. emailAddress
    4. password
22. When the user creates a user profile and fails to enter the required information, the app shall return a 400 error to the user.
23. When the user creates a user profile, the app shall validate that the entered email address is a real address. 400
24. When the user creates a user profile, the app shall ensure that the entered email address doesn't belong to an existing user. 409
25. The app shall hash the user's password before saving it to the database.
26. When the user successfully creates a profile, the app shall set the Location header to '/' and shall return no content to the user.
27. The user shall access all courses by accessing the GET /api/courses 200 route.
28. The user shall access a single courses by accessing the GET /api/courses/:id 200 route.
29. When the user accesses course information, the app shall use Mongoose's deep population function to only return the course owners firstName and lastName properties.
30. The user shall create a new course by accessing the POST /api/courses 201 route.
31. When the user creates a new course, the app shall require the following values:
    1. title
    2. description
32. When the user creates a new coures and fails to provide the required information, the app shall return a 400 error to the user.
33. When the user creates a new course, the app shall set the Location header to match the URI of the new course and shall return no content.
34. The user shall update a course by accessing the PUT /api/courses/:id 204 route.
35. When the user updates a course, the app shall require the following values:
    1. title
    2. description
36. When the user attempts to update a course, the app shall ensure that the course belongs to the user.
37. When the user attempts to update a course that doesn't belong to the user, the app shall return a 403 error.
38. When the user updates the course, the app shall return no content to the user.
39. When the user updates a course and fails to provide the required information, the app shall return a 400 error to the user.
40. The user shall delete a course by accessing the DELETE /api/courses/:id 204 route.
41. When the user attempts to delete a course, the app shall ensure that the course belongs to the user.
42. When the user attempts to delete a course that doesn't belong to the user, the app shall return a 403 error.
43. When the user deletes the course, the app shall return no content to the user.

#### User Requirements

44. The user can create an account that is stored in the database.
45. The user can log into their account.
46. The user can retrieve a list of courses.
47. When the user is logged in, the user can view information about a single course.
48. When the user is logged in, the user can add a course.
49. When {the user is logged in} AND {the user owns the course}, the user can update the course's information.
50. When {the user is logged in} AND {the user owns the course}, the user can delete a course.

### Overview of the Provided Project Files

We've supplied the following files for you to use:

- The `seed` folder contains a starting set of data for your database in the form of a JSON file (`data.json`) and a collection of files (`context.js`, `database.js`, and `index.js`) that can be used to create your app's database and populate it with data (we'll explain how to do that below).
- We've included a `.gitignore` file to ensure that the `node_modules` folder doesn't get pushed to your GitHub repo.
- The `app.js` file configures Express to serve a simple REST API. We've also configured the `morgan` npm package to log HTTP requests/responses to the console. You'll update this file with the routes for the API. You'll update this file with the routes for the API.
- The `nodemon.js` file configures the nodemon Node.js module, which we are using to run your REST API.
- The `package.json` file (and the associated `package-lock.json` file) contain the project's npm configuration, which includes the project's dependencies.
- The `RESTAPI.postman_collection.json` file is a collection of Postman requests that you can use to test and explore your REST API.

## Getting Started

To get up and running with this project, run the following commands from the root of the folder that contains this README file.

First, install the project's dependencies using `npm`.

```
npm install

```

Second, ensure that you have MongoDB installed globally on your system.

- Open a `Command Prompt` (on Windows) or `Terminal` (on Mac OS X) instance and run the command `mongod` (or `sudo mongod`) to start the MongoDB daemon.
- If that command failed then you’ll need to install MongoDB.
- [How to Install MongoDB on Windows](http://treehouse.github.io/installation-guides/windows/mongo-windows.html)
- [How to Install MongoDB on a Mac](http://treehouse.github.io/installation-guides/mac/mongo-mac.html)

Third, seed your MongoDB database with data.

```
npm run seed
```

And lastly, start the application.

```
npm start
```

To test the Express server, browse to the URL [http://localhost:5000/](http://localhost:5000/).
