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
- `assertion`: the assertion to save into the image

`callback` has the signature `function(err, imageData)`

## bakery.extract(image, callback)

Gets the assertion data from the baked badge.

`callback` has the signature `function (err, data)`

## bakery.debake(image, callback);
## bakery.getRemoteAssertion(image, callback);

Gets the verification URL from a baked badge and attempts to retreive the assertion at the other end.

`image` should be a stream or a buffer

`callback` has the signature `function (err, object)` where `object` is expected to be a OpenBadges assertion.
