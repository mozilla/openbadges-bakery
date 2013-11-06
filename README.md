# openbadges-bakery [![Build Status](https://secure.travis-ci.org/mozilla/openbadges-bakery.png)](http://travis-ci.org/mozilla/openbadges-bakery)

An OpenBadges image baking library that works with PNGs and SVGs

# Install
```bash
$ npm install openbadges-bakery
```
# CLI Usage

## Baking

```bash
$ oven [--in ./path/to/image.svg] [--out ./path/to/baked-image.svg] <data>
```
If `--out` is not set, the baked image will print to stdout.

The input file can also be piped into stdin.

```bash
$ oven <data> <  ./path/to/image.png  > ./path/to/baked-image.png
```
## Extracting

```bash
$ oven [--in path/to/image.png] --extract
```

Same as above,  you can also pipe a file to stdin. The data will be printed to stdout.

# Libary Usage

## bakery.bake(options callback);

Bakes some data into an image.

Options are
- `image`: either a buffer or a stream representing the PNG or SVG to bake
- `assertion`: assertion to save into the image (optional)
- `signature`: JSON Web Signature representing a signed OpenBadges assertion (optional)

You must pass either `assertion` or `signature`

`callback` has the signature `function(err, imageData)`

## bakery.extract(image, callback)

Gets the raw data from the badge. This could be a URL, assertion in JSON format or a signature.

`callback` has the signature `function (err, data)`

## bakery.debake(image, callback);
## bakery.getAssertion(image, callback);

Gets the assertion from the badge. If the assertion is remote, this will require an HTTP request. If the assertion is baked into the badge, either directly or as part of a signature, this will pull the local copy.

`image` should be a stream or a buffer

`callback` has the signature `function (err, object)` where `object` is expected to be a OpenBadges assertion.
