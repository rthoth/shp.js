var download = require('download'),
each = require('each-async'),
path = require('path'),
existsSync = require('fs').existsSync;

var dest = path.join(__dirname, 'data');


module.exports = function(downloads) {

	if (!Array.isArray(downloads))
		downloads = [downloads];

	if (!existsSync(path.join(__dirname, 'data')))
		require('fs').mkdirSync(path.join(__dirname, 'data'));
	
	process.chdir(path.join(__dirname, 'data'));

	return function(done) {

		this.timeout(10 * 1000 * 60);

		each(downloads, function(source, index, next) {

			if (existsSync(path.join(dest, source.test)))
				next();
			else {
				console.log('downloading %s from %s', source.name, source.url);
				/*
					download(source, dest, {extract: true})
						.on('error', function(err) {
							next(err);
						})
						.on('close', function() {
							next();
						});
				*/
				new download({extract: true}).get(source.url).dest(dest).run(function(err, files) {
					next(err);
				});
			}
		}, function(err) {
			if (err)
				done(err);
			else
				done();
		});
	};

};