list:
	@cat Makefile

lint:
	@./node_modules/.bin/jshint lib/*.js
test:
	@npm test

home:
	@open https://github.com/mozilla/openbadges-bakery
issues:
	@open https://github.com/mozilla/openbadges-bakery/issues

.PHONY: list test home issues
