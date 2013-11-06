const util = require('util')
const cheerio = require('cheerio')
const concat = require('concat-stream')

module.exports = {
  extract: extract,
  bake: bake,
  isSvg: isSvg,
}

function bake(opts, callback) {
  const assertion = opts.data || opts.assertion
  const verifyString = (opts.url || opts.signature)
    ? (opts.url || opts.signature)
    : (assertion && assertion.verify && assertion.verify.url)

  var err;

  if (opts.image.pipe) {
    return opts.image.pipe(concat(function (data) {
      opts.image = data
      return bake(opts, callback)
    }))
  }

  if (!verifyString) {
    err = new TypeError('Must provide a valid assertion or URL')
    err.code = 'INVALID_ASSERTION'
    return callback(err)
  }

  if (!isSvg(opts.image)) {
    err = new TypeError('Not an SVG')
    err.code = 'INVALID_SVG'
    return callback(err)
  }

  const svgData = opts.image
    .toString('utf8')
    .replace(/openbadges:assertion/g, 'openbadges_assertion')

  const $ = cheerio.load(svgData, {xmlMode: true})

  // remove any existing assertions
  $('openbadges_assertion').remove()

  // add namespace information
  $('svg').attr('xmlns:openbadges', 'http://openbadges.org')

  // add assertion information
  const fmt = '<openbadges:assertion verify="%s">%s</openbadges:assertion>'
  const contents = assertion ? cdata(assertion) : ''
  const element = util.format(fmt, verifyString, contents)

  $('svg').prepend(element)

  const outputXml = $.xml()
    .replace('<!--[CDATA[', '<![CDATA[', 'g')
    .replace(']]-->', ']]>', 'g')

  return callback(null,outputXml)
}

function cdata(obj) {
  return '<![CDATA[' + JSON.stringify(obj) + ']]>'
}

function isSvg(data) {
  const $ = cheerio.load(data, {xmlMode: true})
  return !!$('svg').length
}

function extract(svgData, callback) {
  var err;

  if (!svgData) {
    err = new TypeError('Must pass an image buffer or stream as first argument')
    err.code = 'INVALID_SVG'
    return callback(err)
  }

  if (svgData.pipe) {
    return svgData.pipe(concat(function (data) {
      extract(data, callback)
    }))
  }

  if (!isSvg(svgData)) {
    err = new TypeError('Not an SVG')
    err.code = 'INVALID_SVG'
    return callback(err)
  }

  // XXX: cheerio can't handle namespaced tags because it thinks we're
  // trying to user pseudo selectors, so we do a global search/replace
  // and turn the NS tags into something it *can* handle.
  svgData = svgData
    .toString('utf8')
    .replace(/openbadges:assertion/g, 'openbadges_assertion')

  const $ = cheerio.load(svgData, {xmlMode: true})
  const element = $('openbadges_assertion')

  if (!element.length) {
    err = new Error('Image does not have any baked in data.');
    err.code = 'IMAGE_UNBAKED';
    return callback(err);
  }

  return getAssertionUrl(element, callback)
}

function getAssertionUrl(el, callback) {
  const assertion = getAssertionFromElement(el)
  const attrUrl = el.attr('verify')

  if (assertion) {
    const fixedAssertion = assertion.replace('openbadges_assertion', 'openbadges:assertion', 'g')
    return callback(null, fixedAssertion)
  }

  return callback(null, attrUrl)
}

function getAssertionFromElement(el) {
  if (el.length) el = el[0]

  var cdataAssertion;
  el.children.some(function (child) {
    if (child.type == 'cdata')
      return cdataAssertion = cdataExtract(child)
  })

  if (cdataAssertion)
    return cdataAssertion
}

function cdataExtract(cdata) {
  const children = cdata.children
  if (!children.length)
    return null
  return children[0].data.trim() || null
}
