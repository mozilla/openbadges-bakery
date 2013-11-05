const util = require('util')
const streampng = require('streampng');

const KEYWORD = 'openbadges';

function createChunk(url) {
  return streampng.Chunk.tEXt({
    keyword: KEYWORD,
    text: url
  });
}

module.exports = {
  bake: bake,
  extract: extract,
  keyword: KEYWORD,
  createChunk: createChunk
}

function bake(options, callback) {
  const buffer = options.image;
  var data = options.url || options.data;

  if (!data)
    return callback(new Error('must pass a `data` or `url` option'));

  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }

  const png = streampng(buffer);
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

    if (existingChunk) {
      const msg = util.format('This image already has a chunk with the `%s` keyword (contains: %j)', KEYWORD, chunk.text);
      const error = new Error(msg);
      error.code = 'IMAGE_ALREADY_BAKED';
      error.contents = existingChunk.text;
      return callback(error);
    }
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
  png.once('end', endListener);
  png.once('error', errorListener);
}
