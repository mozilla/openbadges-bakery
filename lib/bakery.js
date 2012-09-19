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
var urlutil = require('url');

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
      var error = new Error('Image does not have any baked in data.');
      error.code = 'IMAGE_UNBAKED';
      return callback(error);
    }
  }

  png.on('tEXt', textListener);
  png.once('end', endListener);
};


exports.debake = function debake(image, callback) {
  exports.getBakedData(image, function (error, url) {
    if (error)
      return callback(error);

    request(url, function (error, response, body) {
      if (error) {
        error = errors.request(error, url);
        return callback(error);
      }

      var status = response.statusCode;
      var type = response.headers['content-type'];

      if (status == 200 && type == 'application/json')
        return exports.parseResponse(body, url, callback);

      if (status != 200) {
        error = (errors[status] || errors.generic)(status, url);
        return callback(error);
      }
    });
  });
};

exports.parseResponse = function parseResponse(body, url, callback) {
  var error, obj;
  if (typeof body !== 'string')
    return callback(null, body);
  try { obj = JSON.parse(body) }
  catch (original) {
    error = errors.jsonParse(original, url);
    return callback(error);
  }
  return callback(null, obj);
};

var errors = {
  request: function (original, url) {
    var msg = util.format('There was an error initiating the request: %s', original.message);
    var error = new Error(msg);
    error.code = 'REQUEST_ERROR';
    error.original = original;
    error.url = url;
    return error;
  },

  generic: function (status, url) {
    var msg = util.format('There was a problem retrieving the remote resource (%s)', status);
    var error = new Error(msg);
    error.code = 'RESOURCE_ERROR';
    error.url = url;
    error.httpStatusCode = status;
    return error;
  },

  jsonParse: function (original, url) {
    var error = new Error('Could not parse JSON at endpoint');
    error.code = 'JSON_PARSE_ERROR';
    error.url = url;
    error.original = original;
    return error;
  },

  404: function (response, url) {
    var error = new Error('Could not get resource (404)');
    error.code = 'RESOURCE_NOT_FOUND';
    error.url = url;
    error.httpStatusCode = 404;
    return error;
  }
};

exports.createChunk = createChunk;
exports.KEYWORD = KEYWORD;