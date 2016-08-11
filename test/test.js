/*
TESTS
*/
require('dotenv').load();

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var path           = require('path');
global.appRoot     = path.resolve('./');


//TESTS WATSON MODULE
describe('Testing Watson Module', function(){
  it('Confirming watson objects', function(){
    var watson = require('../app/watson/watson');
    expect(watson).to.have.property('conversation');
    expect(watson).to.have.property('workspace');
    expect(watson.conversation).to.be.an('object');
    expect(watson.workspace).to.be.a('string');
  });
});

//TESTS ALL MODULES IN ROUTES
describe('Testing Routes', function(){
    it('Confirming randomUsername returns a string', function(){
      var randomUsername = require('../app/routes/randos');
      var tempName = randomUsername();
      expect(tempName).to.be.a('string');
    });
});

//TESTS ALL MODULES IN CONTROLLER
describe('Testing Controllers', function(){
  it('Confirming handleBot exports a function', function(){
    var handleBot = require('../app/controllers/bot').handleBot;
    expect(handleBot).to.be.a('function');
  });
});
