var Promise = require('promise'),
NestedError = require('nested-error-stacks');

var format = require('util').format,
fs = require('fs');


function Shp(fileName, shx, jstsFactory) {
	this._shx = shx;
	this._jstsFactory = jstsFactory;
	var self = this;
	this._p = new Promise(function(resolve, reject) {
		shx._p.then(
			function() {
				fs.open(fileName, 'r', function(err, fd) {
					if (err)
						reject(err);
					else {
						self._fd = fd;
						fs.read(fd, new Buffer(100), 0, 100, 0, function(err, bytes, buffer) {
							if (err)
								reject(err);
							else {
								self._parseHead(bytes, buffer, resolve, reject);
							}
						});
					}
				});
			},
			function(err) {
				reject(new NestedError('In shx', err));
			}
		);
	});
}

Shp.prototype.get = function(index, callback) {
	var self = this;
	this._p.then(
		function() {
			self._get(index, callback);
		},
		function(err) {
			console.log(err);
			callback(err);
		}
	);
};

Shp.prototype._loadBytes = function(r, callback) {
	var self = this;
	r.bytes = r.length * 2;
	fs.read(this._fd, new Buffer(r.bytes), 0, r.bytes, r.offset, function(err, bytes, buffer) {
		if (err)
			callback(err);
		else {
			self._parseShape(r, bytes, buffer, callback);
		}
	});
};

Shp.prototype._get = function(index, callback) {
	var self = this;
	this._shx.get(index, function(err, record) {
		if (err)
			callback(err);
		else
			self._loadBytes(record, callback);
	});
};

Shp.prototype._parseHead = function(bytes, buffer, resolve, reject) {
	if (bytes !== 100)
		return reject(new Error('Invalid file length'));

	var header = {
		code: buffer.readInt32BE(0),
		fileLength: buffer.readInt32BE(24) * 2,
		shapeType: buffer.readInt32LE(32),
		version: buffer.readInt32LE(28)
	};

	if (header.code !== 9994)
		return reject(new Error('Invalid file code'));

	if (header.fileLength <= 0)
		return reject(new Error('Invalid shp file length'));

	if (header.version !== 1000)
		return reject(new Error('Invalid file version'));

	if (!(header.shapeType in SUPPORTED_SHAPE_TYPES))
		return reject(new Error('Unsupported  Shape Type ' + header.shapeType));


	var parser;
	try {
		parser = require('./shp/' + SUPPORTED_SHAPE_TYPES[header.shapeType]);
	} catch (e) {
		return reject(new NestedError('Loading Shape Type Parser', e));
	}

	this._heade = header;
	this._parse = parser.read;

	resolve(header);
};

Shp.prototype._parseShape = function(record, bytes, buffer, callback) {
	if (bytes !== record.bytes) {
		return callback(new Error('Record length error'));
	}

	var number = buffer.readInt32BE(0),
	length = buffer.readInt32BE(4);


	if (number !== record.index + 1)
		return callback(new Error('Shape record number is incorrect'));

	if (length !== record.length)
		return callback(new Error('Shape record length expected is different'));

	var geometry;
	try {
		geometry = this._parse(buffer.slice(8), this._jstsFactory);
	} catch (err) {
		return callback(new NestedError(format('Loading shape #%d error', record.index), err));
	}

	callback(null, geometry);
};


var SUPPORTED_SHAPE_TYPES = {
	0: 'null',
	1: 'point',
	3: 'polyLine',
	5: 'polygon',
	8: 'multiPoint',
	25: 'polygonM'
};

module.exports = Shp;