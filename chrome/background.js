(function(mm) {

    mm.ready(function() {
        var monitorTabs = {}; // tabId -> MonitorTab

        mm.getEnabled = function() {
            return mm.getConfig('enabled');
        };

        mm.setEnabled = function(enable) {
            if (enable == mm.getConfig('enabled')) {
                return;
            }

            mm.setConfig('enabled', enable);

            for (var tabId in monitorTabs) {
                monitorTabs[tabId].setEnabled(enabled);
            }
        };

        mm.getServiceNetloc = function() {
            return mm.getConfig('service_netloc');
        };

        mm.setServiceNetloc = function(netloc) {
            mm.setConfig('service_netloc', netloc);

            for (var tabId in monitorTabs) {
                monitorTabs[tabId].setServiceNetloc(netloc);
            }
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

        // Time for some drinks (get it? tab? drinks?)
        mm.openMonitorTab = function() {
            var tab = new mm.MonitorTab({
                enabled: mm.getConfig('enabled'),
                service_netloc: mm.getConfig('service_netloc'),
                monitor_name: mm.getConfig('default_monitor_name'),
                monitor_url: mm.getConfig('default_monitor_url'),
                onCreate: function() {
                    monitorTabs[tab.tab.id] = tab;
                },
                onRemove: function() {
                    delete monitorTabs[tab.tab.id];
                }
            });
        };
    });

})(window.mm);
