var test = require('tap').test;
var fs = require('fs');
var streampng = require('streampng');
var pathutil = require('path');
var urlutil = require('url');
var oneshot = require('oneshot');

var bakery = require('..');

var IMG_PATH = pathutil.join(__dirname, 'testimage.png');
var ASSERTION_URL = "http://example.org";

/**
 * Get an image stream for the default image.
 */

function getImageStream() {
  var imgStream = fs.createReadStream(IMG_PATH);
  return imgStream;
}

/**
 * Get the image buffer for the default image
 */

function getImageBuffer() {
  var imgBuffer = fs.readFileSync(IMG_PATH);
  return imgBuffer;
}

/**
 * quickly bake an image with the standard url
 */

function preheat(callback) {
  var imgStream = getImageStream();
  var options = {image: imgStream, url: ASSERTION_URL};
  bakery.bake(options, callback);
}

/**
 * start a server with some options, then bake an image with that url
 */

function broil(opts, callback) {
  oneshot(opts, function (server, urlobj) {
    var url = urlutil.format(urlobj);
    var bakeOpts = { image: getImageStream(), url: url };
    bakery.bake(bakeOpts, function (err, baked) {
      if (err) throw err;
      callback(baked);
    });
  });
}

test('bakery.createChunk', function (t) {
  var chunk = bakery.createChunk(ASSERTION_URL);
  t.same(chunk.keyword, bakery.KEYWORD, 'uses the right keyword');
  t.same(chunk.text, ASSERTION_URL, 'assigns the text properly');
  t.ok(chunk instanceof streampng.Chunk.tEXt, 'makes a tEXt chunk');
  t.end();
});

test('bakery.extract', function (t) {
  var nonImageBuffer = new Buffer('Totally not a png');
  bakery.extract(nonImageBuffer, function (err, url) {
    t.ok(err, 'should get error in callback arguments');
    t.end();
  });
});

test('bakery.bake: takes a buffer', function (t) {
  var imgBuffer = getImageBuffer();
  var options = {
    image: imgBuffer,
    url: ASSERTION_URL,
  };
  bakery.bake(options, function (err, baked) {
    t.notOk(err, 'should not have an error');
    t.ok(baked, 'should get back some data');
    bakery.extract(baked, function (err, url) {
      t.notOk(err, 'there should be a matching tEXt chunk');
      t.same(url, ASSERTION_URL, 'should be able to find the url');
      t.end();
    });
  })
});

test('bakery.bake: takes a stream', function (t) {
  var imgStream = getImageStream();
  var options = {
    image: imgStream,
    url: ASSERTION_URL,
  };
  bakery.bake(options, function (err, baked) {
    t.notOk(err, 'should not have an error');
    t.ok(baked, 'should get back some data');
    bakery.extract(baked, function (err, url) {
      t.notOk(err, 'there should be a matching tEXt chunk');
      t.same(url, ASSERTION_URL, 'should be able to find the url');
      t.end();
    });
  })
});

test('bakery.bake: do not bake something twice', function (t) {
  preheat(function (_, img) {
    bakery.bake({image: img, url: 'wut'}, function (err, baked) {
      t.ok(err, 'should be an error');
      t.notOk(baked, 'should not get an image back');
      t.same(err.code, 'IMAGE_ALREADY_BAKED', 'should get correct error code');
      t.same(err.contents, ASSERTION_URL, 'should get the contents of the chunk');
      t.end();
    })
  });
});

test('bakery.debake: should work', function (t) {
  var expect = {band: 'grapeful dread'};
  var opts = {
    body: JSON.stringify(expect),
    type: 'application/json'
  };
  broil(opts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.notOk(err, 'should not have an error');
      t.same(contents, expect);
      t.end();
    });
  });
});

test('bakery.debake: should get a parse error', function (t) {
  var opts = {
    body: "{no json here}",
    type: 'application/json'
  };
  broil(opts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error');
      t.same(err.code, 'JSON_PARSE_ERROR', 'should be a json parse error');
      t.end();
    });
  });
});

test('bakery.debake: 404 should return error', function (t) {
  var opts = { body: 'x', statusCode: 404 };
  broil(opts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error');
      t.same(err.code, 'RESOURCE_NOT_FOUND', 'should have a resource not found error');
      t.same(err.httpStatusCode, 404, 'should have a 404');
      t.end();
    });
  });
});

test('bakery.debake: 500 should return generic error', function (t) {
  var opts = { body: 'x', statusCode: 500 };
  broil(opts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error');
      t.same(err.code, 'RESOURCE_ERROR', 'should have a resource error');
      t.same(err.httpStatusCode, 500, 'should have a 500');
      t.end();
    });
  });
});

test('bakery.debake: error when DNS fails', function (t) {
  var opts = { image: getImageStream(), url: 'http://this.does.not.exist.bogus'};
  bakery.bake(opts, function (err, baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error');
      t.same(err.code, 'REQUEST_ERROR', 'should be a request error');
      t.end();
    });
  });
});

test('bakery.debake: error when debaking unbaked image', function (t) {
  var image = getImageStream();
  bakery.debake(image, function (err, contents) {
    t.ok(err, 'should have an error');
    t.same(err.code, 'IMAGE_UNBAKED', 'should get unbaked image error');
    t.end();
  });
});
