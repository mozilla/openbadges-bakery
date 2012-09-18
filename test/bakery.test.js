var test = require('tap').test;

var fs = require('fs');
var streampng = require('streampng');
var bakery = require('../lib/bakery');
var pathutil = require('path');

var IMG_PATH = pathutil.join(__dirname, 'testimage.png');
var ASSERTION_URL = "http://example.org";

function getImageStream() {
  var imgStream = fs.createReadStream(IMG_PATH);
  return imgStream;
}

function getImageBuffer() {
  var imgBuffer = fs.readFileSync(IMG_PATH);
  return imgBuffer;
}

function getBakedData(img, callback) {
  var png = streampng(img);
  var found = false;
  png.on('tEXt', function (chunk) {
    if (chunk.keyword !== 'openbadges')
      return;
    found = true;
    return callback(null, chunk.text);
  }).on('end', function () {
    if (!found)
      return callback(new Error('no baked data'));
  });
}

function preheat(callback) {
  var imgStream = getImageStream();
  var options = {image: imgStream, url: ASSERTION_URL};
  bakery.bake(options, callback);
}

test('bakery.createChunk', function (t) {
  var chunk = bakery.createChunk(ASSERTION_URL);
  t.same(chunk.keyword, bakery.KEYWORD, 'uses the right keyword');
  t.same(chunk.text, ASSERTION_URL, 'assigns the text properly');
  t.ok(chunk instanceof streampng.Chunk.tEXt, 'makes a tEXt chunk');
  t.end();
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
    getBakedData(baked, function (err, url) {
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
    getBakedData(baked, function (err, url) {
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