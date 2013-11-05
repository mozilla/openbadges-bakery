const util = require('util')
const cheerio = require('cheerio')

module.exports = {
  extract: extract,
  bake: bake
}

function bake(svgData, assertion) {
  if (!assertion || !assertion.verify || !assertion.verify.url)
    throw new TypeError('Must provide a valid assertion as the second argument')

  svgData =svgData
    .toString('utf8')
    .replace(/openbadges:assertion/g, 'openbadges_assertion')

  const $ = cheerio.load(svgData, {xmlMode: true})

  // remove any existing assertions
  $('openbadges_assertion').remove()

  // add namespace information
  $('svg').attr('xmlns:openbadges', 'http://openbadges.org')

  // add assertion information
  const fmt = '<openbadges:assertion verify="%s">%s</openbadges:assertion>'
  const element = util.format(fmt, assertion.verify.url, cdata(assertion))

  $('svg').prepend(element)

  return $.xml()
}

function cdata(obj) {
  return '<![CDATA[' + JSON.stringify(obj) + ']]>'
}

function extract(svgData) {
  svgData = svgData
    .toString('utf8')
    .replace(/openbadges:assertion/g, 'openbadges_assertion')
  const $ = cheerio.load(svgData, {xmlMode: true})
  const element = $('openbadges_assertion')
  return getAssertionUrl(element)
}

function getAssertionUrl(el) {
  const assertion = getAssertionFromElement(el)
  const attrUrl = el.attr('verify')

  var assertionUrl;

  try {
    if (assertion)
      assertionUrl = JSON.parse(assertion).verify.url
    return assertionUrl || attrUrl
  }

  catch(e) {
    if (e.name == 'TypeError')
      throw Error('Could not find a `verify` structure in the embedded JSON')

    if (e.name == 'SyntaxError')
      throw Error('Could not parse JSON in <openbadges:assertion> tag')

    else throw e
  }
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
