/*
 * openbadges-bakery
 * https://github.com/mozilla/openbadges-bakery
 *
 * Copyright (c) 2012 Mozilla Foundation
 * Licensed under the MPL 2.0 license.
 */

const util = require('util');
const request = require('request');
const urlutil = require('url');
const jws = require('jws')

const typeCheck = require('./lib/stream-type-check')
const png = require('./lib/png')
const svg = require('./lib/svg')

module.exports = {
  bake: bake,
  extract: extract,
  debake: debake,
  getRemoteAssertion: debake,
  typeCheck: typeCheck,
}

var bakeries = {
  'image/png': png.bake,
  'image/svg+xml': svg.bake,
  'unknown': unknownImageType
}

var extractors = {
  'image/png': png.extract,
  'image/svg+xml': svg.extract,
  'unknown': unknownImageType
}

function unknownImageType(opts, callback) {
  return callback(new Error('Unknown/unhandled image type'))
}

function bake(options, callback) {
  typeCheck(options.image, function (err, type, stream) {
    if (err) return callback(err)
    options.image = stream
    return bakeries[type](options, callback)
  })
}

function extract(imgdata, callback) {
  typeCheck(imgdata, function (err, type, stream) {
    if (err) return callback(err)
    return extractors[type](stream, callback)
  })
}

function debake(image, callback) {
  function defer(fn) {
    return (global.setImmediate || process.nextTick)(fn)
  }

  extract(image, function (error, data) {
    if (error)
      return defer(function(){ callback(error) })

    var url = data
    var assertion
    var decoded

    // signature?
    if ((decoded = jws.decode(data))) {
      try {
        assertion = JSON.parse(decoded.payload)
        return defer(function(){ callback(null, assertion) })
      } catch (e) {
        return defer(function(){ callback(errors.jsonParse(e)) })
      }
    }

    // assertion?
    try {
      assertion = JSON.parse(data)
      return defer(function(){ callback(null, assertion) })
    } catch (_) {}

    // fall back to url
    request(url, function (error, response, body) {
      if (error) {
        error = errors.request(error, url)
        return callback(error)
      }

      const status = response.statusCode
      const type = response.headers['content-type']

      if (status != 200) {
        error = (errors[status] || errors.generic)(status, url)
        return callback(error)
      }

      return parseResponse(body, url, callback)
    })
  })
}

function parseResponse(body, url, callback) {
  var error, obj

  if (typeof body !== 'string')
    return callback(null, body)

  try {
    obj = JSON.parse(body)
  }

  catch (original) {
    error = errors.jsonParse(original, url)
    return callback(error)
  }

  return callback(null, obj);
}

const errors = {
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
    var error = new Error('Could not parse JSON');
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
}
