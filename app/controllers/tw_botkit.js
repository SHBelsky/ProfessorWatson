/*eslint-env node */
// Node Modules
var Botkit    = require('botkit');
var handleBot = require('./bot.js').handleBot;

// Twilio Controller & Bot
var TW_Controller = Botkit.twilioipmbot({
    debug: false,
});
var TW_Bot = TW_Controller.spawn({
    TWILIO_IPM_SERVICE_SID: process.env.TWILIO_IPM_SERVICE_SID,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY: process.env.TWILIO_API_KEY,
    TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
    identity: process.env.BOT_NAME,
    autojoin: true
});

// Slack Bot is live
TW_Controller.log("Twilio Botkit is live");

// Twilio Botkit Dialog
TW_Controller.hears(['.*'], 'message_received', function(bot, message) {
  TW_Controller.log("Twilio message received");
  handleBot("Twilio", bot, message);
});

module.exports.TW_Bot        = TW_Bot;
module.exports.TW_Controller = TW_Controller;
