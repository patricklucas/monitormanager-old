(function(mm) {

    var enabled = true;
    var service_netloc = mm.defaults.service_netloc;
    var monitorTabs = {};

    mm.getEnabled = function(enable) {
        return enabled;
    };

    mm.setEnabled = function(enable) {
        if (enable == enabled) {
            return;
        }

        enabled = enable;

        for (tab in monitorTabs) {
            monitorTabs[tab].setEnabled(enabled);
        }
    };

    mm.getServiceNetloc = function() {
        return service_netloc;
    };

    mm.setServiceNetloc = function(netloc) {
        for (tab in monitorTabs) {
            monitorTabs[tab].setServiceNetloc(netloc);
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
