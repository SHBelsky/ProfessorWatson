/*globals appRoot */
/*eslint-env node */
var initCloudant = require('cloudant');
var jsonfile     = require('jsonfile');
var jsonQuery    = require('json-query');
var pkgoserv     = require('is-pokemon-go-up');

// Data Variables
var pokemon      = jsonfile.readFileSync(appRoot + '/data/pokemon.json');
var types        = jsonfile.readFileSync(appRoot + '/data/types.json');

// Cloudant
var botdb;
var cloudant = initCloudant(process.env.CLOUDANT_URL);
cloudant.db.destroy('botdb', function(err) {
	cloudant.db.create('botdb', function() {
		botdb = cloudant.db.use('botdb');
	});
});

// Watson Converastion
var watson       = require('../watson/watson.js');
var conversation = watson.conversation;
var workspace    = watson.workspace;

// Handle incoming bot and messages
module.exports.handleBot = function handleBot(service, bot, message) {
	if (message.text !== undefined && message.user) {
		var id = message.user;
		botdb.get(id, function(err, cloudantData){
			var payload = {
				workspace_id: workspace,
				input: {"text": message.text}
			};
			if (cloudantData !== undefined){
				payload.context = cloudantData.data.context;
				delete payload.context.prevIntent;
			}
			else {
				payload.context = {};
			}
			
			conversation.message(payload, function(err, watsonData) {
				handleIntents(service, bot, message, watsonData, err, cloudantData);
			});
			
		});
	}
};

// Handle incoming intents and errors
function handleIntents(service, bot, message, watsonData, err, cloudantData) {
	if(err) {
		console.error(err);
	}
	else {
		// Pull proper data out of Watson Conversation's data
		var context    = watsonData.context;
		var entities   = watsonData.entities;
		var intents    = watsonData.intents[0].intent;
		var response   = {};
		response.text  = watsonData.output.text[0];
		
		intents = watsonData.context.prevIntent || intents;
		
		// Variables for the below loop
		var curPoke = [], curType = [], curEggDist, x = 0, attachments = null;
		
		// If entities are present in the string, extract them and create JSONs
		if (entities !== undefined) {
			entities.forEach(function(curEnt) {
				if (curEnt.entity === "Pokemon") {
					curPoke.push(jsonQuery("pokemon[Name=" + curEnt.value + "]", {data: pokemon}).value);
				}
				else if (curEnt.entity === "Type") {
					curType.push(jsonQuery("types[type=" + curEnt.value + "]", {data: types}).value);
				}
				else if (curEnt.entity === "EggDistance") {
					curEggDist = curEnt.value.replace(/(km|kilometers|kilometer)/, "");
				}
				x++;
			});
		}
		
		// Handle data based on the intent
		switch(intents) {
			case "GymBattle":
			case "AttackType":
				if (typeof curPoke[0] !== "undefined") {
					response.text = "";
					curPoke.forEach(function(curPokemon) {
						response.text     += curPokemon.Name + " (" + arrLister(curPokemon.types) + "): Weak against " + arrLister(curPokemon.weaknesses) +  ".\n";
					});
				}
				break;
			case "EggDistance":
					if (typeof curEggDist !== "undefined") {
						var curEggs        = jsonQuery("pokemon[*egg=" + curEggDist + "]", {data: pokemon}).value;
						response.text      = "You can hatch " + arrLister(curEggs, "Name") + " from a " + curEggDist + "km egg";
					}
				break;
			case "Evolution":
				if (typeof curPoke[0] !== "undefined") {
					if (!curPoke[0].evolutionPrev) {
						response.text  = curPoke[0].Name + " can evolve into " + arrLister(curPoke[0].evolutionNext, "Name") + ". ";
						response.text += "It needs " + curPoke[0].evolutionReq.Amount + " " + curPoke[0].evolutionReq.Name + " in order to evolve.";
					}
					else if (curPoke[0].evolutionPrev && curPoke[0].evolutionNext !== "None") {
						response.text = curPoke[0].Name + " evolves from " + curPoke[0].evolutionPrev.Name + " and into " + curPoke[0].evolutionNext.Name + " with " + curPoke[0].evolutionReq.Amount + " " + curPoke[0].evolutionReq.Name + ".";
					}
					else if (curPoke[0].evolutionNext === "None") {
						response.text  = curPoke[0].Name + " evolves from " + arrLister(curPoke[0].evolutionPrev, "Name");
						response.text += ". It does not evolve into any other Pokémon within Generation I.";
					}
					
					if (["Eevee", "Vaporeon", "Jolteon", "Flareon"].indexOf(curPoke[0].Name) > -1) {
						response.text += " Additionally, when evolving an Eevee, you can specify your Eevee evolution by nicknaming the Eevee prior to evolving it. For a Jolteon, name your Eeeve 'Sparky', for a Flareon, name it 'Pyro', and for a Vaporeon, name it 'Rainer'.";
					}
				}
				break;
			case "FindPokemon":
				if (typeof curPoke[0] !== "undefined") {
					var eevee           = ["Vaporeon", "Jolteon", "Flareon"];
					var legends         = ["Ditto", "Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"];
					var region          = {
						"Mr. Mime": "Europe",
						"Tauros": "North America",
						"Farfetch'd": "Asia",
						"Kangaskhan": "Australia & the Pacific Islands"
					};
					if (legends.indexOf(curPoke[0].Name) > -1) {
						response.text = "As a Legendary Pokemon, " + curPoke[0].Name + " cannot be found in the wild. It is unknown when they will be available for players to capture.";
					}
					else if (typeof region[curPoke[0].Name] !== "undefined") {
						response.text = curPoke[0].Name + " is a region specific Pokemon, and can't be caught in every geographic region of the world. You can catch " + curPoke[0].Name + " only in " + region[curPoke[0].Name] + ".";
					}
					else {
						var curPokeTypeInfo1 = jsonQuery("types[type=" + curPoke[0].types[0] + "]", {data: types}).value, curPokeTypeInfo2;
						if (typeof curPoke[0].types[1] !== "undefined") {
							curPokeTypeInfo2 = jsonQuery("types[type=" + curPoke[0].types[1] + "]", {data: types}).value;
						}
						
						response.text       = curPoke[0].Name + " is " + vowelWord(curPoke[0].types[0]) + " " + curPoke[0].types[0] + " Type Pokemon. " + curPokeTypeInfo1.location;
						if (typeof curPoke[0].types[1] !== "undefined") {
							response.text  += " " + curPoke[0].Name + " is also " + vowelWord(curPoke[0].types[1]) + " " + curPoke[0].types[1] + " Type Pokemon. " + curPokeTypeInfo2.location;
						}
						
						if (eevee.indexOf(curPoke[0].Name) > -1) {
							response.text  += " Additionally, when evolving an Eevee, you can specify your Eevee evolution by nicknaming the Eevee prior to evolving it. For a Jolteon, name your Eeeve 'Sparky', for a Flareon, name it 'Pyro', and for a Vaporeon, name it 'Rainer'.";
						}
					}
				}
				else if (typeof curType[0] !== "undefined") {
					response.text = curType[0].location;
				}
				break;
			case "NumCandies":
				if (typeof curPoke[0] !== "undefined") {
					if (curPoke[0].evolutionNext !== "None") {
						response.text = "You need " + curPoke[0].evolutionReq.Amount + " " + curPoke[0].evolutionReq.Name + " in order to evolve " + curPoke[0].Name + " into " + curPoke[0].evolutionNext[0].Name + ".";
					}
					else {
						response.text = curPoke[0].Name += " does not evolve into anything.";
					}
				}
				break;
			case "PokemonDescribe":
				if (typeof curType[0] !== "undefined") {
					var typePoke = [];
					pokemon.pokemon.forEach(function(curPokemon) {
						if (curPokemon.types.indexOf(curType[0].type) > -1) {
							typePoke.push(curPokemon.Name);
						}
					});
					response.text = arrLister(typePoke) + " are all " + curType[0].type + " type Pokemon. They share a common weakness to" + arrLister(curType[0].weak) + " Type Pokemon.";
				}
				else if (typeof curPoke[0] !== "undefined") {
					response.text    = curPoke[0].pokedex;
					attachments      = {
					 "title": curPoke[0].Name,
					 "image": curPoke[0].image,
					 "subtitle": curPoke[0].Name + " is known as the " + curPoke[0].Classification + ". ",
					};
				}
				break;
			case "PokemonMatchup":
				if (typeof curType[0] !== "undefined") {
					response.text = curType[0].type + " is best against " + arrLister(curType[0].strong) + " Type Pokemon.";
				}
				else if (typeof curPoke[0] !== "undefined") {
					if (typeof curPoke[9] !== "undefined") {
						response.text = "Slow down there, trainer. I can only process a maximum of ten Pokemon at a time.";
					}
					else if (typeof curPoke[1] !== "undefined") {
						function sortByKey(array, key) {
							return array.sort(function(a, b) {
							    var x = a[key]; var y = b[key];
							    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
							});
						}
						var bestPokeArray = sortByKey(curPoke, "maxCP");
						response.text = "The best Pokémon among those provided is " + bestPokeArray[0].Name + ", with a maximum CP of " + bestPokeArray[0].maxCP + ".";
					}
				}
				break;
			case "PossibleMoves":
				if (typeof curPoke[0] !== "undefined") {
					response.text  = curPoke[0].Name + " can learn the following Quick Moves: " + arrLister(curPoke[0].moves_fast);
					response.text += ".\nIt can learn the following Charge Moves: ";
					response.text += arrLister(curPoke[0].moves_charged);
				}
				break;
			case "PossibleTypes":
				if (typeof curPoke[0] !== "undefined") {
					var currentType;
					response.text   = curPoke[0].Name + " is ";
					if (typeof curPoke[0].types[1] !== "undefined") {
						currentType = curPoke[0].types[0] + "/" + curPoke[0].types[1];
					}
					else {
						currentType =  curPoke[0].types[0];
					}
					response.text  += vowelWord(currentType) + " " + currentType +  " Type Pokemon.";
				}
				break;
			case "ServersDown":
				pkgoserv().then(function(servResponse) {
					if (servResponse === "Yep. Go outside and catch some!") {
						response.text = "Nope, the servers are online. Go outside and catch some!";
					}
					else if (servResponse === "Yep, but the servers are struggling") {
						response.text = "Nope, but the servers are struggling. :(";
					}
					else if (servResponse === "Nope, servers are down! Go back to work.") {
						response.text = "Yes, servers are down! Go back to work.";
					}
					else {
						response.text = "Error! Probably not a good sign, but try again.";
					}
					botReply(service, bot, message, response, null);
				});
				break;
			case "ServersUp":
				pkgoserv().then(function(servResponse) {
					response.text = servResponse;
					botReply(service, bot, message, response, null);
				});
				break;
			case "StrengthWeakness":
				var superEffArr;
				if (typeof curPoke[0] !== "undefined") {
					response.text = arrLister(curPoke[0].weaknesses) + " Type Pokémon are supereffective against " + curPoke[0].Name + ". " + curPoke[0].Name + " is ";
					if (typeof curPoke[0].types[1] !== "undefined") {
						var curPokeTypeInfo1 = jsonQuery("types[type=" + curPoke[0].types[0] + "]", {data: types}).value.strong;
						var curPokeTypeInfo2 = jsonQuery("types[type=" + curPoke[0].types[1] + "]", {data: types}).value.strong;
						superEffArr = curPokeTypeInfo1.concat(curPokeTypeInfo2).unique();
					}
					else {
						superEffArr = jsonQuery("types[type=" + curPoke[0].types[0] + "]", {data: types}).value.strong;
					}
					
					if (typeof superEffArr[0] === "undefined") {
						response.text += "not supereffective against anything.";
					}
					else {
						response.text += " supereffective against " + arrLister(superEffArr) + " Type Pokemon.";
					}	
				}
				break;
			case "TypeQuery":
				if (typeof curType[0] !== "undefined") {
					var typePoke = [];
					if (typeof curType[1] !== "undefined") {
						pokemon.pokemon.forEach(function(curPokemon) {
							if ((curPokemon.types[0] === curType[0].type && curPokemon.types[1] === curType[1].type) ||
							(curPokemon.types[0] === curType[1].type && curPokemon.types[1] === curType[0].type)) {
								typePoke.push(curPokemon.Name);
							}
						});
					}
					else {
						pokemon.pokemon.forEach(function(curPokemon) {
							if (curPokemon.types.indexOf(curType[0].type) > -1) {
								typePoke.push(curPokemon.Name);
							}
						});
					}
					if (typeof typePoke[0] === "undefined") {
						response      = "No Generation I Pokémon has that type or type combination. Please try your query again.";
					}
					else if (typeof curType[1] !== "undefined") {
						response.text = arrLister(typePoke) + (typePoke.length === 1 ? " is " + vowelWord(curType[0].type) + " " : " are all ") + curType[0].type + "/" + curType[1].type + " Type Pokemon.";
					}
					else {
						response.text = arrLister(typePoke) + (typePoke.length === 1 ? " is " + vowelWord(curType[0].type) + " " : " are all ") + curType[0].type + " Type Pokemon.";					
					}
				}
				break;
			default:
				console.log("Default response");
				break;
		}
		
		var id = message.user;
		botdb.get(id, function(err, data) {
			var cloudantPayload;
			if (typeof data !== "undefined") {
				cloudantPayload = {_id: id, _rev: data._rev, data: {context: context, intent: intents}};
			}
			else {
				cloudantPayload = {_id: id, data: {context: context, intent: intents}};
			}
			
			botdb.insert(cloudantPayload, function(err, body, header){
				if (err){
					return err;
				}
			});
		});
		
		if (intents !== "ServersDown" && intents !== "ServersUp") {
			botReply(service, bot, message, response, attachments);
		}
	}
}

function botReply(service, bot, message, response, attachments) {
	if (!response.text) {
		response.text = "I didn't catch that. Please try again with a different query. Thanks!";
	}
	if (service === "Facebook" && response.text.length > 300) {
		var resp1     = response.text.slice(0,response.text.length / 2 );
		var resp2     = response.text.slice(response.text.length / 2, response.text.length);
		var lastComma = resp1.slice(resp1.lastIndexOf(",") + 1);
		resp1         = resp1.slice(0,resp1.lastIndexOf(",") + 1);
		resp2         = lastComma + resp2;
		
		bot.reply(message, resp1);
		bot.reply(message, resp2);
	}
	else if (service === "Facebook" && response.text.length < 300) {
		var fbAttachment;
		if (attachments !== null) {
			fbAttachment = {
		      "type": "template",
		      "payload": {
		        "template_type": "generic",
		        "elements": [
		          {
		          	"buttons": [
		              {
		                "type": "web_url",
		                "url": "http://bulbapedia.bulbagarden.net/wiki/" + attachments.title + "_(Pokémon)",
		                "title": "Bulbapedia Page"
		              },             
		            ],
		            "title": attachments.title,
		            "image_url": attachments.image,
		            "subtitle": attachments.subtitle,
		          }
		        ]
		      }
		    };
		    bot.reply(message, {
				attachment: fbAttachment,
			});
		}
		bot.reply(message, response);
	}
	else if (service === "Slack") {
		if (attachments !== null) {
			response = {
				"attachments": [
					{
						"footer": "Pokemon Image from Serebii",
						"footer_icon": "http://cdn.bulbagarden.net/upload/9/93/Bag_Pok%C3%A9_Ball_Sprite.png",						
						"text": attachments.subtitle + response.text,
						"thumb_url": attachments.image,
						"title": attachments.title,
						"title_link": "http://bulbapedia.bulbagarden.net/wiki/" + attachments.title + "_(Pokémon)",
					}
		        ],
		       "as_user": true,
			};
		}
		bot.reply(message, response);
	}
	else if (service === "Twitter") {
		bot.post('direct_messages/new', {screen_name: message.fullDM.sender.screen_name, text: response.text}, function(err, data, resp) {
			if (err) {
				throw err;
			}
		});
	}
	else {
		bot.reply(message, response);
	}
}

Array.prototype.unique = function() {
    var a = this.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) {
            	a.splice(j, 1);
            }
        }
    }
    return a;
};

/**
 * Returns a string that consists of the elements of @arr separated by commas.
 * Accounts for arrays of variable length (1, 2, or more).
 * 
 * arg: @arr is an array of string elements
 * arg: @property is optional, but if specified must refer to a valid property name belonging to every element of @arr
 */
function arrLister(arr, property) {
	property = property || null;
	var arrResponse = "", z = 0;
	if (property === null) {
		if (arr.length === 1) {
			arrResponse += arr[z];
		}
		else if (arr.length === 2) {
			arrResponse += arr[z] + " and " + arr[z+1];
		}
		else {
			for (z = 0; z < arr.length; z++) {
				if (z === arr.length - 1) {
					arrResponse += " and " + arr[z];
				}
				else {
					arrResponse += " " + arr[z] + ",";
				}
			}
		}
	}
	else {
		if (arr.length === 1) {
			arrResponse += arr[z][property];
		}
		else if (arr.length === 2) {
			arrResponse += arr[z][property] + " and " + arr[z+1][property];
		}
		else {
			for (z = 0; z < arr.length; z++) {
				if (z === arr.length - 1) {
					arrResponse += " and " + arr[z][property];
				}
				else {
					arrResponse += " " + arr[z][property] + ",";
				}
			}
		}
	}
	return arrResponse;
}

function vowelWord(word) {
	var letter  = word.charAt(0), newWord = "";
	if (["a", "e", "i", "o", "u"].indexOf(letter.toLowerCase()) > -1) {
		newWord = "an";
	}
	else {
		newWord = "a";
	}
	return newWord;
}