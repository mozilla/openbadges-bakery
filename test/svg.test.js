const svg = require('../lib/svg')
const test = require('tap').test

test('svg data extraction: all good', function (t) {
  svg.extract(file('baked.svg'), function (err, url) {
    t.same(getUrlFromAssertion(url), 'http://example.org')
    t.end()
  })
})

test('svg data extraction: all good with a stream', function (t) {
  svg.extract(stream('baked.svg'), function (err, url) {
    t.same(getUrlFromAssertion(url), 'http://example.org')
    t.end()
  })
})

test('svg data extraction: no json', function (t) {
  svg.extract(file('no-json.svg'), function (err, url) {
    t.same(url, 'http://example.org')
    t.end()
  })
})

test('svg baking: all good, full assertion', function (t) {
  const assertion = { verify: { url: 'http://example.org' }}
  const opts = { image: file('unbaked.svg'), data: assertion }
  svg.bake(opts, function (err, svgData) {
    svg.extract(svgData, function (err, url) {
      t.same(getUrlFromAssertion(url), 'http://example.org')
      t.end()
    })
  })
})

test('svg baking: all good, full assertion, image stream', function (t) {
  const assertion = { verify: { url: 'http://example.org' }}
  const opts = {image: stream('unbaked.svg'), data: assertion}
  svg.bake(opts, function (err, svgData) {
    svg.extract(svgData, function (err, url) {
      t.same(getUrlFromAssertion(url), 'http://example.org')
      t.end()
    })
  })
})

test('svg baking: all good, just url', function (t) {
  const opts = {image: file('unbaked.svg'), url: 'http://example.org' }
  svg.bake(opts, function (err, svgData) {
    svg.extract(svgData, function (err, url) {
      t.same(url, 'http://example.org')
      t.end()
    })
  })
})

test('svg baking: bad assertion', function (t) {
  const assertion = { some: {other: 'stuff' }}
  const opts = {image: file('unbaked.svg'), assertion: assertion}
  svg.bake(opts, function (err, svgData) {
    t.same(err.name, 'TypeError', 'should throw a type error')
    t.end()
  })
})

test('svg baking: baking a previously baked badge', function (t) {
  const assertion1 = { verify: { url: 'http://bad-url.org' }}
  const assertion2 = { verify: { url: 'http://example.org' }}

  const opts = {
    image: file('unbaked.svg'),
    assertion: { verify: { url: 'http://bad-url.org' }}
  }

  svg.bake(opts, function (err, svgData1) {
    var opts = { image: svgData1, assertion: assertion2 }
    svg.bake(opts, function (err, svgData2) {
      svg.extract(svgData2, function (err, url) {
        t.same(getUrlFromAssertion(url), 'http://example.org')
        t.end()
      })
    })
  })
})

test('svg baking: not an svg', function (t) {
  const assertion = { verify: { url: 'http://example.org' }}
  const opts = {image: 'not an svg at all', data: assertion}

  svg.bake(opts, function (err, svgData) {
    t.same(err.code, 'INVALID_SVG')
    t.end()
  })
})


test('svg extraction: not an svg', function (t) {
  t.plan(4)

  svg.extract(file('unbaked.png'), function (err, url) {
    t.same(err.code, 'INVALID_SVG')
  })

  svg.extract(Buffer('yo whatever'), function (err, url) {
    t.same(err.code, 'INVALID_SVG')
  })

  svg.extract(null, function (err, url) {
    t.same(err.code, 'INVALID_SVG')
  })

  svg.extract({key: 'value'}, function (err, url) {
    t.same(err.code, 'INVALID_SVG')
  })
})

test('svg extraction: not baked', function (t) {
  svg.extract(file('unbaked.svg'), function (err, url) {
    t.same(err.code, 'IMAGE_UNBAKED')
    t.end()
  })
})

function file(name) {
  return (
    require('fs').readFileSync(
      require('path').join(__dirname, name))
  )
}
function stream(name) {
  return (
    require('fs').createReadStream(
      require('path').join(__dirname, name))
  )
}

function getUrlFromAssertion(str) {
  return JSON.parse(str).verify.url
}
