/* Module dependencies */
var util = require('util');
var inherits = util.inherits;
var EventEmitter = require('events').EventEmitter;
var qs = require('qs');
var superagent = require('superagent');
var _ = require('lodash')

module.exports = WiMP;

var Track = require('./track');

WiMP.login = function(un, pw, fn){
	if(!fn) fn = function(){};
	var wimp = new WiMP();
	wimp.login(un, pw, function(err){
		if(err) return fn(err);
		fn.call(wimp, null, wimp);
	})
	return wimp;
}

function WiMP(){
	if(!(this instanceof WiMP)) return new WiMP();
	EventEmitter.call(this);

 	this.agent = superagent.agent();

	this.apiLocation = 'https://play.wimpmusic.com/v1/';
	this.apiToken = 'rQtt0XAsYjXYIlml';
	this.countryCode = 'NO';

	this.user = {};

	this.on('user', this.getUser);
}
inherits(WiMP, EventEmitter);

WiMP.prototype._buildUrl = function(method, params, querystring){
	var self = this;
	var querystring = qs.stringify(_.merge({
		'sessionId': self.sessionId,
		'countryCode': self.countryCode
	}, querystring));
	return self.apiLocation + method + '/' + params.join('/') + '?' + querystring;
}
WiMP.prototype.login = function(un, pw, fn){
	var self = this;
	var e = {
		'username': un,
		'password': pw
	};
	self.agent
	.post(self.apiLocation + 'login/username?token=' + this.apiToken)
	.type('form')
	.send(e)
	.end(function(err, res){
		if(res.body.status && res.body.status == 401){
			self.emit('error', new Error(res.body.userMessage))
		}else{
			self.sessionId = res.body.sessionId;
			self.countryCode = res.body.countryCode;
			self.user.id = res.body.userId;
			self.emit('user');
		}
	});
	self.on('login', fn);
};
WiMP.prototype.getUser = function(){
	var self = this;
	self.agent
	.get(self._buildUrl('users', [self.user.id]))
	.end(function(err, res){
		self.user = res.body;
		self.emit('login');
	});
}
WiMP.prototype.getTracks = function(albumId, fn){
	var self = this;
	self.agent
	.get(self._buildUrl('albums', [albumId, 'tracks']))
	.end(function(err, res){
		var items = res.body.items;
		var tracks = [];
		_.each(items, function(track){
			track = new Track(track, self);
			tracks.push(track);
			return track;
		});
		fn(err, tracks);
	})
}