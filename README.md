# openbadges-bakery [![Build Status](https://secure.travis-ci.org/mozilla/openbadges-bakery.png)](http://travis-ci.org/mozilla/openbadges-bakery)

# Install
```bash
$ npm install openbadges-bakery
```
# CLI Usage

## Baking

```bash
$ oven [--in path/to/image.png] [--out path/to/baked-image.png] <data>
```
If `--out` is not set, the baked image will print to stdout.

The input file can also be piped into stdin.

```bash
$ cat path/to/image.png | oven <data> > path/to/baked-image.png
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
- `image`: either a buffer or a stream representing the PNG to bake
- `data`: the data to put into the badge. At this point, it should likely be a URL pointing to a badge assertion

`callback` has the signature `function(err, imageData)`

## bakery.debake(image, callback);

Gets the URL from a baked badge and attempts to retreive the assertion
at the other end.

`image` should be a stream or a buffer

`callback` has the signature `function (err, object)` where `object` is expected to be a OpenBadges assertion.

## bakery.extract(image, callback)

Gets the data from the baked badge.

`callback` has the signature `function (err, data)`

