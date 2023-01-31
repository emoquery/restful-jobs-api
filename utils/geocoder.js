const nodeGeocoder = require("node-geocoder");

const options = {
  provider: "mapquest",
  httpAdapter: "https",

  apiKey: 'QTzf44ex2WEU3XXIPDr0h1EXO5Y4ACt7', // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

const geoCoder = nodeGeocoder(options);

module.exports = geoCoder;
