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
  const queryString = `
     INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3) RETURNING *;;
  `;
  const values = [user.name, user.email, user.password];
 
  //The first pool is to create a new user
  return pool
    .query(queryString, values)
    .then((result) => {
      //If no errors were encountered add the new user to the database
      return result.rows[0];
    })
    .catch((errGet) => {
      console.log(errGet.message);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {

  const values = [guest_id, limit];
  const queryString = `
  SELECT reservations.id, properties.title, properties.cost_per_night, properties.number_of_bedrooms, properties.number_of_bathrooms,
         properties.parking_spaces, properties.cover_photo_url, reservations.start_date, reservations.end_date, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
  `;
  return pool
    .query(queryString, values)
    .then((result) => {
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows;

    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function(options, limit = 10) {
  const values = [limit];
  const whereClause = [];

  //Set up the values array for the query and the conditions for the where clause based on what the user entered
  let count = 2;
  for (let key in options) {
    if (options[key] !== '') {
      //city
      if (key === 'city') {
        values.push(options[key]);
        whereClause.push('properties.city = $' + count);
      }
      //minimum price per night
      if (key === 'minimum_price_per_night') {
        values.push(options[key] * 100);
        whereClause.push('properties.cost_per_night >= $' + count);
      }
      //maximum price per night
      if (key === 'maximum_price_per_night') {
        values.push(options[key] * 100);
        whereClause.push('properties.cost_per_night <= $' + count);
      }
      //minimum rating
      if (key === 'minimum_rating') {
        values.push(options[key]);
        whereClause.push('rating >= $' + count);
      }
      count += 1;
    }
  }
  //if there are user specified parameters, concatenate them into a string, otherwise return blank
  const whereString = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') + ' ': '';

  const queryString = `
  SELECT DISTINCT properties.*, AVG(rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_reviews.property_id
  ` + whereString +
  `GROUP BY properties.id      
    LIMIT $1;     
  `;

  //return array of objects containing properties that satisfy the query string
  return pool
    .query(queryString, values)
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
  //query string to add a new property to the database
  //title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id
  const queryString = `
  INSERT INTO properties (` + Object.keys(property) + `) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;;
`;
  //put the property variables into an array for the query
  const values = Object.values(property);
  
  //Replace blank integer values in the query parameter array if any
  if (values[2] === '') values[2] = '0';
  if (values[3] === '') values[3] = '0';
  if (values[4] === '') values[4] = '0';
  if (values[5] === '') values[5] = '0';

  //Create and return the new property
  return pool
    .query(queryString, values)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addProperty = addProperty;
