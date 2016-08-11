var Twit      = require('twit');
var handleBot = require('./bot.js').handleBot;
 
//Set up Twitter bot
/*eslint-env node */
var handleBot = require('./bot.js').handleBot;
var Twit = require('twit');

// Twitter Bot
var T = new Twit({
  consumer_key:         process.env.TWIT_CONSUMER_KEY,
  consumer_secret:      process.env.TWIT_CONSUMER_SECRET,
  access_token:         process.env.TWIT_ACCESS_TOKEN,
  access_token_secret:  process.env.TWIT_ACCESS_SECRET
});
var stream = T.stream('user');
console.log("Twitter Bot is live");

//Hears direct message
stream.on('direct_message', function (directMsg){
	if(directMsg.direct_message.sender.screen_name != "professorwatbot"){
		var message = {};
		message.user = directMsg.direct_message.sender_id;
		message.text = directMsg.direct_message.text;
		message.fullDM = directMsg.direct_message;
		handleBot("Twitter", T, message);
	}
});
stream.on('tweet', function(eventMsg) {
	console.log(eventMsg);
    console.log("Heard tweet");
});