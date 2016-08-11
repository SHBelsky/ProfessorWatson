/*eslint-env node */
// Load Node variables
var express        = require('express');
var dotenv         = require('dotenv');
var bodyParser     = require('body-parser');
var path           = require('path');
global.appRoot     = path.resolve(__dirname);
dotenv.load();

// Create an Express app
var app            = express();
var http           = require('http').Server(app);

// Serve client files out of the 'client' folder
app.use(express.static(path.join(__dirname, 'client')));

// Bodyparser: JSON
app.use(bodyParser.json());

// Bodyparser: URL Encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Set environment port (Bluemix)
app.set('port', process.env.VCAP_APP_PORT || process.env.PORT || 5000);

// Required Node routes
require('./app/routes/routes')(app);

// Listen on the specified port
http.listen(app.get('port'), function() {
  console.log('Client server listening on port ' + app.get('port'));
});
