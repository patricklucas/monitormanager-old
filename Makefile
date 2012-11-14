CRX=./scripts/crxmake.sh

NAME=monitormanager

CHROMESRC=chrome/
CHROMEEXT=$(NAME).crx

.PHONY: all
all:
	@echo "No 'all' target"

chrome: $(CHROMEEXT)

$(CHROMEEXT): $(CHROMESRC)
	$(CRX) $<
