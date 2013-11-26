const test = require('tap').test
const concat = require('concat-stream')
const typeCheck = require('../lib/stream-type-check')
const fs = require('fs')
const path = require('path')

test('checking svgs', function (t) {
  const name = 'unbaked.svg'
  typeCheck(stream(name), function (err, type, restream) {
    t.same(type, 'image/svg+xml')
    restream.pipe(concat(function (data) {
      t.same(data, file(name), 'should have all the data')
      t.end()
    }))
  })
})

test('checking png', function (t) {
  const name = 'unbaked.png'
  typeCheck(stream(name), function (err, type, restream) {
    t.same(type, 'image/png')
    restream.pipe(concat(function (data) {
      t.same(data, file(name), 'should have all the data')
      t.end()
    }))
  })
})

test('checking svg, nostream', function (t) {
  const name = 'unbaked.svg'
  typeCheck(file(name), function (err, type, restream) {
    t.same(type, 'image/svg+xml')
    restream.pipe(concat(function (data) {
      t.same(data, file(name), 'should have all the data')
      t.end()
    }))
  })
})

test('immediately fail if given nothing', function (t) {
  typeCheck(null, function (err, type, restream) {
    t.ok(err, 'should have error')
    t.end()
  })
})

function stream(name, opts) {
  return fs.createReadStream(path.join(__dirname, name), opts)
}
function file(name) {
  return fs.readFileSync(path.join(__dirname, name))
}
