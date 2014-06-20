const util = require('util')
const streampng = require('streampng');

const KEYWORD = 'openbadges';

module.exports = {
  bake: bake,
  extract: extract,
  keyword: KEYWORD,
  createChunk: createChunk
}

function bake(options, callback) {
  options = options || {};
  const bufferOrStream = options.image;

  if (!bufferOrStream)
    return callback(new Error('Must pass an `image` option'));

  var data = options.url || options.data || options.assertion || options.signature;

  if (!data)
    return callback(new Error('Must pass an `assertion` or `signature` option'));

  if (typeof data === 'object')
    data = JSON.stringify(data);

  const png = streampng(bufferOrStream);
  const chunk = createChunk(data);
  var existingChunk, hadError;

  png.inject(chunk, function (txtChunk) {
    if (txtChunk.keyword === KEYWORD) {
      existingChunk = txtChunk;
      return false;
    }
  })

  png.on('error', function (err) {
    hadError = true;
    return callback(err)
  })

  png.on('end', function () {
    if (hadError) return;

    if (existingChunk)
      existingChunk.set('text', chunk.text)

    return png.out(callback);
  })
}

function extract(img, callback) {
  const png = streampng(img);
  var found = false;
  var hadError = false;

  function textListener(chunk) {
    if (chunk.keyword !== 'openbadges')
      return;
    found = true;
    png.removeListener('tEXt', textListener);
    png.removeListener('iTXt', textListener);
    return callback(null, chunk.text);
  }

  function endListener() {
    if (!found && !hadError) {
      const error = new Error('Image does not have any baked in data.');
      error.code = 'IMAGE_UNBAKED';
      return callback(error);
    }
  }

  function errorListener(error) {
    hadError = true;
    return callback(error);
  }

  png.on('tEXt', textListener);
  png.on('iTXt', textListener);
  png.once('end', endListener);
  png.once('error', errorListener);
}

function createChunk(data) {
  return streampng.Chunk.iTXt({
    keyword: KEYWORD,
    text: data
  })
}
