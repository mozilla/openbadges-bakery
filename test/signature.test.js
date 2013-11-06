const test = require('tap').test
const bakery = require('..')
const jws = require('jws')


const ASSERTION = {verify: { url: 'oh sup'}}
const sig = jws.sign({
  header: { alg: 'rs256' },
  privateKey: file('rsa-private.pem'),
  payload: ASSERTION
})

test('baking svg badges with signatures', function (t) {
  bakery.bake({
    image: file('unbaked.svg'),
    signature: sig
  }, function (err, baked) {
    bakery.debake(baked, function (err, assertion) {
      t.same(ASSERTION, assertion, 'assertions should match')
      t.end()
    })
  })
})

test('baking png badges with signatures', function (t) {
  bakery.bake({
    image: file('unbaked.png'),
    signature: sig
  }, function (err, baked) {
    bakery.debake(baked, function (err, assertion) {
      t.same(ASSERTION, assertion, 'assertions should match')
      t.end()
    })
  })
})



function file(name) {
  return (
    require('fs').readFileSync(
      require('path').join(__dirname, name))
  )
}
