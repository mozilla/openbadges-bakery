const through = require('through')
const bufferEqual = require('buffer-equal')

const PNG = {
  strict: true,
  signature: Buffer([137, 80, 78, 71, 13, 10, 26, 10])
}

const SVG = {
  strict: false,
  signature: 'http://www.w3.org/2000/svg'
}

module.exports = typeCheck;

function typeCheck(stream, callback) {
  if (!stream)
    return callback(new Error('could not type check, missing stream'))

  var buf = Buffer(0)
  const restream = through()
  const headerLen = 256

  function onData (data) {
    buf = Buffer.concat([buf, data])
    if (buf.length < headerLen) return

    if (stream.removeListener)
      stream.removeListener('data', onData)

    const header = buf.slice(0, headerLen)
    var type
    if (check(header, PNG))
      type = 'image/png'
    else if (check(header, SVG))
      type = 'image/svg+xml'
    else
      type = 'unknown'

    callback(null, type, restream)

    restream.write(buf)
    if (stream.pipe)
      stream.pipe(restream)
    else
      restream.end()
  }

  if (!stream.pipe)
    return onData(Buffer(stream))

  stream.on('data', onData)
}

function check(bytes, type) {
  const siglen = type.signature.length

  if (type.strict)
    return bufferEqual(bytes.slice(0, siglen), type.signature)

  if (typeof type.signature == 'string')
    return bytes.toString('ascii').indexOf(type.signature) > -1

  return false
}
