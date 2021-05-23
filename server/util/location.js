const axios = require("axios");
const httpError = require("../models/http-error");
const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${API_KEY}
    `);
  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    throw new httpError(
      "Could not find location for the specific address",
      422
    );
  }

  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

module.exports = getCoordsForAddress;
