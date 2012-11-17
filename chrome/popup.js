(function() {
    var mm = chrome.extension.getBackgroundPage().mm;

    var getEl = function(id) {
        return document.getElementById(id);
    };

    var initEvent = function(id, ev, callback) {
        getEl(id).addEventListener(ev, callback);
    };

    var initOpenButton = function() {
        initEvent('open_monitor_tab', 'click', function(e) {
            mm.openMonitorTab();
            e.srcElement.disabled = true;
        });
    };

    var initDisableCheck = function() {
        getEl('disable_check').checked = !mm.getEnabled();
        initEvent('disable_check', 'change', function(e) {
            mm.setEnabled(!e.srcElement.checked);
        });
    };

    var initServiceNetlocField = function() {
        getEl('service_netloc').value = mm.getServiceNetloc();
        initEvent('service_netloc_save', 'click', function(e) {
            var newServiceNetloc = getEl('service_netloc').value;
            mm.setServiceNetloc(newServiceNetloc);
        });
    };

    var initTabNameField = function(tab) {
        getEl('nottaboptions').style.display = 'none';
        getEl('taboptions').style.display = 'block';
        getEl('monitor_name').value = tab.getName();
        initEvent('monitor_name_save', 'click', function(e) {
            var newName = getEl('monitor_name').value;
            tab.setName(newName);
        });
    };

    var initOpenTabsCount = function() {
        var count = mm.numMonitorTabs();
        var opentabs = getEl('opentabs');
        var text = "";

        if (count == 0) {
            opentabs.className = "nocontent";
            text = "There are no open monitor tabs.";
        } else if (count == 1) {
            text = "There is " + count + " open monitor tab.";
        } else {
            text = "There are " + count + " open monitor tabs.";
        }

        opentabs.innerText = text;
    }

    document.addEventListener('DOMContentLoaded', function () {
        initOpenButton();
        initDisableCheck();
        initServiceNetlocField();

        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            if (tabs.length != 1) {
                console.log("Well this is awkward.");
                return;
            }

            var tab = mm.getMonitorTab(tabs[0].id);

            if (tab) {
                initTabNameField(tab);
            };
        });

        initOpenTabsCount();
    });

})();
