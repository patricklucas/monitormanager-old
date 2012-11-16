(function(mm) {

    var enabled = true;
    var service_netloc = mm.defaults.service_netloc;
    var monitorTabs = {};

    // Try to load global parameters from storage
    chrome.storage.local.get(['enabled', 'service_netloc'], function(items) {
        var toSet = {};

        if (items.enabled !== undefined) {
            enabled = items.enabled;
        } else {
            toSet.enabled = enabled;
        }

        if (items.service_netloc !== undefined) {
            service_netloc = items.service_netloc;
        } else {
            toSet.service_netloc = service_netloc;
        }

        // Set to defaults if unset
        if (toSet) {
            chrome.storage.local.set(toSet);
        }
    });

    mm.getEnabled = function(enable) {
        return enabled;
    };

    mm.setEnabled = function(enable) {
        if (enable == enabled) {
            return;
        }

        enabled = enable;

        // Save enabled state to storage
        chrome.storage.local.set({enabled: enabled});

        for (tabId in monitorTabs) {
            monitorTabs[tabId].setEnabled(enabled);
        }
    };

    mm.getServiceNetloc = function() {
        return service_netloc;
    };

    mm.setServiceNetloc = function(netloc) {
        // Save new netloc to storage
        chrome.storage.local.set({service_netloc: netloc});

        for (tabId in monitorTabs) {
            monitorTabs[tabId].setServiceNetloc(netloc);
        };
    };

    mm.getMonitorTab = function(tabId) {
        if (!tabId in monitorTabs) {
            return null;
        }

        return monitorTabs[tabId];
    };

    mm.numOpenMonitorTabs = function() {
        return Object.keys(monitorTabs).length;
    };

    // Time for some drinks
    mm.openMonitorTab = function() {
        var tab = new mm.MonitorTab({
            enabled: enabled,
            service_netloc: service_netloc,
            monitor_name: mm.defaults.monitor_name,
            monitor_url: mm.defaults.monitor_url,
            onCreate: function() {
                monitorTabs[tab.tab.id] = tab;
            },
            onRemove: function() {
                delete monitorTabs[tab.tab.id];
            }
        });
    };

})(window.mm);
