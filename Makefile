CRX=./scripts/crxmake.sh

NAME=monitormanager

CHROMESRC=chrome/
CHROMEBUILD=chrome-build/
CHROMEEXT=$(NAME).crx
CHROMEKEY=$(NAME).pem

PYTHONSRC=$(NAME)
PYTHONBUILD=build/

.PHONY: all
all: chrome python

.PHONY: chrome
chrome: $(CHROMEEXT)

$(CHROMEEXT): $(CHROMEBUILD)
	$(CRX) $<

$(CHROMEBUILD): $(CHROMESRC)
	@mkdir $@
	@rsync -a $< $@ --exclude '.*'
	@rm $@/underscore.js
	@rm $@/backbone.js
	@sed -i '' 's/underscore\.js/underscore-min.js/' $@/popup.html
	@sed -i '' 's/backbone\.js/backbone-min.js/' $@/popup.html

.PHONY: python
python: $(PYTHONBUILD)

$(PYTHONBUILD): $(PYTHONSRC)
	python setup.py build

.PHONY: clean
clean:
	rm -rf $(CHROMEEXT) $(CHROMEKEY)
	rm -rf $(CHROMEBUILD)
	rm -rf $(PYTHONBUILD)
