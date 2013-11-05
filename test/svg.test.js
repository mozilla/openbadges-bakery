const svg = require('../svg')
const test = require('tap').test

test('svg data extraction: all good', function (t) {
  const url = svg.extract(file('baked.svg'))
  t.same(url, 'http://example.org')
  t.end()
})

test('svg data extraction: bad json', function (t) {
  try {
    svg.extract(file('bad-json.svg'))
    t.fail('should have thrown')
  }
  catch (e) {
    t.ok(e, 'should have an error')
    t.end()
  }
})

test('svg data extraction: bad json', function (t) {
  const url = svg.extract(file('no-json.svg'))
  t.same(url, 'http://example.org')
  t.end()
})

test('svg baking: all good', function (t) {
  const assertion = { verify: { url: 'http://example.org' }}
  const svgData = svg.bake(file('unbaked.svg'), assertion)
  const url = svg.extract(svgData)
  t.same(url, 'http://example.org')
  t.end()
})

test('svg baking: bad assertion', function (t) {
  const assertion = { some: {other: 'stuff' }}
  try {
    svg.bake(file('unbaked.svg'), assertion)
    t.fail('should have thrown')
  }
  catch (e) {
    t.same(e.name, 'TypeError', 'should throw a type error')
    t.end()
  }
})

test('svg baking: baking a previously baked badge', function (t) {
  const assertion1 = { verify: {url: 'http://bad-url.org' }}
  const assertion2 = { verify: {url: 'http://example.org' }}
  const svgData = svg.bake(svg.bake(file('unbaked.svg'), assertion1), assertion2)
  const url = svg.extract(svgData)
  t.same(url, 'http://example.org')
  t.end()
})

function file(name) {
  return (
    require('fs').readFileSync(
      require('path').join(__dirname, name))
  )
}
