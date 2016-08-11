module.exports.conversation = require('watson-developer-cloud').conversation({
  url: process.env.CONVERSATION_URL,
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  version_date: '2016-07-11',
  version: 'v1'
});
module.exports.workspace = process.env.WORKSPACE_ID;
