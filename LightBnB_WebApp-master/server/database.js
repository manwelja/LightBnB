const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'jennifermanwell',
  host: 'localhost',
  database: 'lightbnb'
});

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString =
  `SELECT * FROM users
     WHERE email = $1;  
  `;
  //Return a promise containing the user object for the specified email, NULL if the user wasn't found in the database
  return pool
    .query(queryString, [email])
    .then((result) => {
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString =
  `SELECT * FROM users
     WHERE id = $1;  
  `;
  //Return a promise containing the user object for the specified user id, NULL if the user wasn't found in the database
  return pool
    .query(queryString, [id])
    .then((result) => {
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {

  //query string to add a new user to the database
  const queryStringAdd = `
     INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3);
  `;
  //query string to retrieve the new users information from the database
  const queryStringGet = `
    SELECT * FROM users 
      WHERE email = $1;
`;

  const valuesAdd = [user.name, user.email, user.password];
  const valuesGet = [user.email];

  //The first pool is to create a new user
  return pool
    .query(queryStringAdd, valuesAdd)
    .then((result) => {
      //The second pool is used to get the new users info so we can get the id which was auto generated
      //This is only done if no errors were encountered adding the new user to the database
      return pool
        .query(queryStringGet, valuesGet)
        .then((newUser) => {
          //return the new user object
          return newUser.rows[0];
        })
        .catch((errGet) => {
          console.log(errGet.message);
        });
    })
    .catch((errAdd) => {
      console.log(errAdd.message);
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function(options, limit = 10) {
  
//   const city = options.city;
//   const minimum_price_per_night = parseInt(options.minimum_price_per_night);
//   const maximum_price_per_night = parseInt(options.maximum_price_per_night);
//   const minimum_rating = parseInt(options.minimum_rating);

//   const values = [limit, city, minimum_price_per_night, maximum_price_per_night, minimum_rating];
  
//  const queryString2 = `
//  SELECT DISTINCT properties.* FROM properties 
//  JOIN property_reviews ON properties.id = property_reviews.property_id
//  WHERE properties.city = $2 AND
//        properties.cost_per_night >= $3 AND properties.cost_per_night <= $4 AND
//        property_reviews >= $5
//   LIMIT $1;     
//  `;

  const queryString = `
    SELECT * FROM properties LIMIT $1;
  `;

  return pool
    .query(queryString, [limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
