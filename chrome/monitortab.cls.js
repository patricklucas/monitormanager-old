(function(mm) {

    var MonitorTab = function(options, callback) {
        this.socket = null;
        this.tab = null;

        this.monitor_url = options.monitor_url;

        this.init = function() {
            // Don't connect until we have a tab
            chrome.tabs.create({url: this.monitor_url}, function(newTab) {
                this.tab = newTab;

                chrome.tabs.onRemoved.addListener(function(tabId) {
                    if (this.tab && this.tab.id == tabId) {
                        delete monitorTabs[this.tab.id];
                        this.tab = null;
                    }
                }.bind(this));

                this.socket = new mm.TabSocket({
                    enabled: options.enabled,
                    service_netloc: options.service_netloc,
                    monitor_name: options.monitor_name,
                    onmessage: this.onmessage.bind(this)
                });

                callback(this.tab.id);
            }.bind(this));
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
