/*
 * openbadges-bakery
 * https://github.com/mozilla/openbadges-bakery
 *
 * Copyright (c) 2012 Mozilla Foundation
 * Licensed under the MPL 2.0 license.
 */

var util = require('util');
var streampng = require('streampng');
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

exports.createChunk = createChunk;
exports.KEYWORD = KEYWORD;