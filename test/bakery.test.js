const test = require('tap').test
const oneshot = require('oneshot')
const fs = require('fs')

const bakery = require('..')

test('bakery.debake: should work with URL', function (t) {
  const expect = { band: 'grapeful dread' }
  const proto = {
    body: JSON.stringify(expect),
    type: 'application/json',
  }

  const svgOpts = extend(proto, {image: file('unbaked.svg')})
  const pngOpts = extend(proto, {image: file('unbaked.png')})

  t.plan(4)
  broil(svgOpts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.notOk(err, 'should not have an error')
      t.same(contents, expect)
    })
  })

  broil(pngOpts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.notOk(err, 'should not have an error')
      t.same(contents, expect)
    })
  })
})

test('bakery.debake: should work with full assertion', function (t) {
  const assertion = {
    band: 'ride',
    verify: {
      url: '*will be replaced by broil*'
    }
  }

  const opts = {
    body: JSON.stringify(assertion),
    type: 'application/json',
    image: file('unbaked.png'),
    assertion: assertion,
  }

  t.plan(3)

  broil(opts, function (baked, server) {
    bakery.extract(baked, function (err, string) {
      const contents = JSON.parse(string)
      t.same(contents.band, assertion.band)
    })

    bakery.debake(baked, function (err, contents) {
      t.notOk(err, 'should not have an error')
      t.same(contents.band, assertion.band)
    })

    server.close()
  })
})


test('bakery.debake: should get a parse error', function (t) {
  const opts = {
    body: "{no json here}",
    type: 'application/json',
    image: file('unbaked.svg'),
  }

  broil(opts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error')
      t.same(err.code, 'JSON_PARSE_ERROR', 'should be a json parse error')
      t.end()
    })
  })
})

test('bakery.debake: 404 should return error', function (t) {
  const opts = {
    body: 'x',
    statusCode: 404,
    image: file('unbaked.png')
  }

  broil(opts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error')
      t.same(err.code, 'RESOURCE_NOT_FOUND', 'should have a resource not found error')
      t.same(err.httpStatusCode, 404, 'should have a 404')
      t.end()
    })
  })
})

test('bakery.debake: 500 should return generic error', function (t) {
  const opts = {
    body: 'x',
    statusCode: 500,
    image: file('unbaked.png')
  }

  broil(opts, function (baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error');
      t.same(err.code, 'RESOURCE_ERROR', 'should have a resource error');
      t.same(err.httpStatusCode, 500, 'should have a 500');
      t.end();
    })
  })
})

test('bakery.debake: error when DNS fails', function (t) {
  var opts = {
    image: file('unbaked.svg'),
    url: 'http://this.does.not.exist.bogus'
  }

  bakery.bake(opts, function (err, baked) {
    bakery.debake(baked, function (err, contents) {
      t.ok(err, 'should have an error')
      t.same(err.code, 'REQUEST_ERROR', 'should be a request error')
      t.end()
    })
  })
})

test('bakery.debake: error when debaking unbaked image', function (t) {
  const image = file('unbaked.svg')
  bakery.debake(image, function (err, contents) {
    t.ok(err, 'should have an error')
    t.same(err.code, 'IMAGE_UNBAKED', 'should get unbaked image error')
    t.end()
  })
})

const urlutil = require('url')
const path = require('path')

function file(name) {
  return fs.readFileSync(path.join(__dirname, name))
}

function extend(proto, obj) {
  var newObj = Object.create(proto)
  Object.keys(obj).forEach(function (key) {
    newObj[key] = obj[key]
  })
  return newObj
}

// start a server with some options, then bake an image with that url
function broil(opts, callback) {
  oneshot(opts, function (server, urlobj) {
    const url = urlutil.format(urlobj);
    const assertion = opts.assertion
    var bakeOpts;
    if (assertion) {
      assertion.verify.url = url;
      bakeOpts = { image: opts.image, data: assertion };
    } else {
      bakeOpts = { image: opts.image, url: url };
    }

    bakery.bake(bakeOpts, function (err, baked) {
      if (err) throw err;
      callback(baked, server);
    })
  })
}
