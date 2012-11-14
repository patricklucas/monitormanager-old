CRX=./scripts/crxmake.sh

NAME=monitormanager

CHROMESRC=chrome/
CHROMEEXT=$(NAME).crx
CHROMEKEY=$(NAME).key

PYTHONSRC=$(NAME)/
PYTHONBUILD=build/

.PHONY: all
all: chrome python

.PHONY: chrome
chrome: $(CHROMEEXT)

$(CHROMEEXT): $(CHROMESRC)
	$(CRX) $<

.PHONY: python
python: $(PYTHONBUILD)

$(PYTHONBUILD): $(PYTHONSRC)
	python setup.py build

.PHONY: clean
clean:
	rm -rf $(CHROMEEXT) $(CHROMEKEY)
	rm -rf $(PYTHONBUILD)
