(function(mm) {
    /**
     * Keeps the state of a single monitor tab.
     *
     * Handles onmessage events from a MonitorSocket. New tab control commands
     * should only need be implemented here.
     *
     * Keeps references to the Chrome tab object it represents and the current
     * URL. Proxies changes to monitor name or global enable and service_netloc
     * options to the MonitorSocket.
     */

    var MonitorTab = function(options) {
        this.socket = null;
        this.tab = null;

        this.monitor_url = options.monitor_url;

        this.init = function() {
            // Don't connect until we have a tab
            chrome.tabs.create({url: this.monitor_url}, function(newTab) {
                this.tab = newTab;

                chrome.tabs.onRemoved.addListener(function(tabId) {
                    if (this.tab.id == tabId) {
                        this.destroy();
                    }
                }.bind(this));

                this.socket = new mm.MonitorSocket({
                    enabled: options.enabled,
                    service_netloc: options.service_netloc,
                    monitor_name: options.monitor_name,
                    onmessage: this.onmessage.bind(this)
                });

                options.onCreate();
            }.bind(this));
        };

        this.destroy = function() {
            this.socket.disconnect();
            this.socket = null;
            options.onRemove();
            this.tab = null; // Nullify tab after onRemove
        };

        this.actionReload = function(hard) {
            chrome.tabs.reload(this.tab.id, {bypassCache: hard});
        };

        this.actionUrl = function(url) {
            if (url == this.monitor_url) {
                return;
            }

            this.monitor_url = url;

            chrome.tabs.update(this.tab.id, {url: url});
        };

        this.onmessage = function(e) {
            var data = JSON.parse(e.data);

            switch (data.action) {
            case 'reload':
                this.actionReload(data.hard);
                break;
            case 'url':
                this.actionUrl(data.url);
                break;
            default:
                console.log("Unknown action: " + data.action);
            };
        };

        this.setEnabled = function(enable) {
            return this.socket.setEnabled(enable);
        };

        this.setServiceNetloc = function(netloc) {
            return this.socket.setServiceNetloc(netloc);
        };

        this.getName = function() {
            return this.socket.getName();
        };

        this.setName = function(name) {
            return this.socket.setName(name);
        };

        this.init();
    };

    mm.MonitorTab = MonitorTab;

})(window.mm);
