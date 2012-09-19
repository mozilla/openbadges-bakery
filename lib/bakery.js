/*
 * openbadges-bakery
 * https://github.com/mozilla/openbadges-bakery
 *
 * Copyright (c) 2012 Mozilla Foundation
 * Licensed under the MPL 2.0 license.
 */

var util = require('util');
var streampng = require('streampng');
var request = require('request');

var KEYWORD = 'openbadges';

function createChunk(url) {
  return streampng.Chunk.tEXt({
    keyword: KEYWORD,
    text: url
  });
}

exports.bake = function bake(options, callback) {
  var buffer = options.image;
  var png = streampng(buffer);
  // #TODO: make sure the url is set
  var chunk = createChunk(options.url);
  var existingChunk;
  png.inject(chunk, function (txtChunk) {
    if (txtChunk.keyword === KEYWORD) {
      existingChunk = txtChunk;
      return false;
    }
  });
  if (existingChunk) {
    var msg = util.format('This image already has a chunk with the `%s` keyword (contains: %j)', KEYWORD, chunk.text);
    var error = new Error(msg);
    error.code = 'IMAGE_ALREADY_BAKED';
    error.contents = existingChunk.text;
    return callback(error);
  }
  return png.out(callback);
};

exports.getBakedData = function getBakedData(img, callback) {
  var png = streampng(img);
  var found = false;

  function textListener(chunk) {
    if (chunk.keyword !== 'openbadges')
      return;
    found = true;
    png.removeListener('tEXt', textListener);
    return callback(null, chunk.text);
  }

  function endListener() {
    if (!found) {
      var err = new Error('Image does not have any baked in data.')
      err.code = IMAGE_UNBAKED;
      return callback(err);
    }
  }

  png.on('tEXt', textListener);
  png.once('end', endListener);
};


exports.debake = function debake(image, callback) {
  exports.getBakedData(image, function (err, url) {
    if (err)
      return callback(err);
    request(url, function (err, response, body) {
      if (err)
        return callback(err);
      callback(null, body);
    });
  });
};

exports.createChunk = createChunk;
exports.KEYWORD = KEYWORD;