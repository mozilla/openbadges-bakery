const test = require('tap').test;
const fs = require('fs');
const streampng = require('streampng');
const pathutil = require('path');
const urlutil = require('url');

const png = require('../png.js');

const IMG_PATH = pathutil.join(__dirname, 'unbaked.png');
const ASSERTION_URL = "http://example.org";
const ASSERTION = { verify: {} };

test('png.createChunk', function (t) {
  var chunk = png.createChunk(ASSERTION_URL);
  t.same(chunk.keyword, png.keyword, 'uses the right keyword');
  t.same(chunk.text, ASSERTION_URL, 'assigns the text properly');
  t.ok(chunk instanceof streampng.Chunk.tEXt, 'makes a tEXt chunk');
  t.end();
});

test('png.extract', function (t) {
  var nonImageBuffer = new Buffer('Totally not a png');
  png.extract(nonImageBuffer, function (err, url) {
    t.ok(err, 'should get error in callback arguments');
    t.end();
  });
});

test('png.bake: takes a buffer', function (t) {
  var imgBuffer = getImageBuffer();
  var options = {
    image: imgBuffer,
    url: ASSERTION_URL,
  };
  png.bake(options, function (err, baked) {
    t.notOk(err, 'should not have an error');
    t.ok(baked, 'should get back some data');
    png.extract(baked, function (err, url) {
      t.notOk(err, 'there should be a matching tEXt chunk');
      t.same(url, ASSERTION_URL, 'should be able to find the url');
      t.end();
    });
  })
});

test('png.bake: do not throw on bad image', function (t) {
  var options = {
    image: Buffer('pfffffft whatever'),
    url: ASSERTION_URL,
  }
  try {
    png.bake(options, function (err, baked) {
      t.ok(err, 'should have an error')
      t.notOk(baked, 'should not have baked data')
    })
  } catch(e) {
    t.fail('should not have thrown')
  } finally {
    t.end()
  }
});

test('png.bake: takes a stream', function (t) {
  var imgStream = getImageStream();
  var options = {
    image: imgStream,
    url: ASSERTION_URL,
  };
  png.bake(options, function (err, baked) {
    t.notOk(err, 'should not have an error');
    t.ok(baked, 'should get back some data');
    png.extract(baked, function (err, url) {
      t.notOk(err, 'there should be a matching tEXt chunk');
      t.same(url, ASSERTION_URL, 'should be able to find the url');
      t.end();
    });
  })
});

test('png.bake: do not bake something twice', function (t) {
  preheat(function (_, img) {
    png.bake({image: img, url: 'wut'}, function (err, baked) {
      t.ok(err, 'should be an error');
      t.notOk(baked, 'should not get an image back');
      t.same(err.code, 'IMAGE_ALREADY_BAKED', 'should get correct error code');
      t.same(err.contents, ASSERTION_URL, 'should get the contents of the chunk');
      t.end();
    })
  });
});


function getImageStream() {
  var imgStream = fs.createReadStream(IMG_PATH);
  return imgStream;
}

function getImageBuffer() {
  var imgBuffer = fs.readFileSync(IMG_PATH);
  return imgBuffer;
}

// quickly bake an image with the standard url
function preheat(callback) {
  var imgStream = getImageStream();
  var options = {image: imgStream, url: ASSERTION_URL};
  png.bake(options, callback);
}
