/*eslint-env node */
// Importing Bot Controllers
// If you don't need something, you can just comment it out!
var Facebook = require('../controllers/fb_botkit');
var Slack    = require('../controllers/sl_botkit');
var Twilio   = require('../controllers/tw_botkit');
var Twitter  = require('../controllers/twit_bot');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('index');
  });
  
  // Facebook Message Route
  Facebook.FB_Controller.createWebhookEndpoints(app, Facebook.FB_Bot);
  
  // Slack Message Real Time messaging
  Slack.SL_Bot.startRTM();

  // Twilio Message Route
  Twilio.TW_Controller.createWebhookEndpoints(app, Twilio.TW_Bot);

  // Twilio Token Route: Chat Client Variables
  var AccessToken      = require('twilio').AccessToken;
  var IpMessagingGrant = AccessToken.IpMessagingGrant;
  var randomUsername   = require('./randos');

  // Twilio Token Route
  app.get('/twilio/token', function(request, response) {
  	var appName = 'TwilioChatDemo';
  	var identity = randomUsername();
  	var deviceId = request.query.device;

  	// Create a unique ID for the client on their current device
  	var endpointId = appName + ':' + identity + ':' + deviceId;

  	// Create a "grant" which enables a client to use IPM as a given user,
  	// on a given device
  	var ipmGrant = new IpMessagingGrant({
  		serviceSid: process.env.TWILIO_IPM_SERVICE_SID,
  		endpointId: endpointId
  	});

  	// Create an access token which we will sign and return to the client,
  	// containing the grant we just created
  	var token = new AccessToken(
  		process.env.TWILIO_ACCOUNT_SID,
  		process.env.TWILIO_API_KEY,
  		process.env.TWILIO_API_SECRET
  	);
  	token.addGrant(ipmGrant);
  	token.identity = identity;

  	// Serialize the token to a JWT string and include it in a JSON response
  	response.send({
  		identity: identity,
  		token: token.toJwt()
  	});
  });
};
