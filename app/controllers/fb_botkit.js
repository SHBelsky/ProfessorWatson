/*eslint-env node */
// Node Modules
var Botkit    = require('botkit');
var handleBot = require('./bot.js').handleBot;

// Facebook Controller & Bot
var FB_Controller = Botkit.facebookbot({
  access_token: process.env.ACCESS_TOKEN,
  verify_token: process.env.VERIFY_TOKEN
});

var FB_Bot = FB_Controller.spawn({});

// Facebook Bot is live
FB_Controller.log("Facebook Botkit is live");

// Facebook Botkit Dialog
FB_Controller.hears('(.*)', 'message_received', function(bot, message) {
	FB_Controller.log("Facebook message received");
	handleBot("Facebook", bot, message);
});

module.exports.FB_Bot        = FB_Bot;
module.exports.FB_Controller = FB_Controller;
