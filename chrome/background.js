(function() {

    var TabSocket = function(options) {
        // Refs
        this.ws = null;
        this.tab = null;

        options = options || {};

        // State
        this.enabled = options.enabled || true;
        this.service_netloc = options.service_netloc || "localhost:8123";
        this.monitor_name = options.monitor_name || "InfraTopLeft";

        // Callbacks
        this.onmessage = options.onmessage;

        this.init = function() {
            this.connect();
        };

        this.service_uri = function() {
            var netloc = this.service_netloc;
            var name = this.monitor_name;
            return "ws://" + netloc + "/monitor/" + name;
        };

        this.connect = function() {
            this.ws = new WebSocket(this.service_uri());
            this.ws.onmessage = this.onmessage;
            this.pollForConnect();
        };

        this.reconnect = function() {
            this.ws.onclose = null; // Disable the reconnecting onclose handler
            this.ws.close();
            this.connect();
        };

        this.pollForConnect = function() {
            setTimeout(function() {
                var state = this.ws.readyState;
                if (state == WebSocket.OPEN) {
                    this.ws.onclose = function() {
                        if (this.enabled) {
                            this.connect();
                        }
                    }.bind(this);
                } else if (state == WebSocket.CONNECTING) {
                    this.pollForConnect();
                } else { // CLOSED or CLOSING
                    this.connect();
                }
            }.bind(this), 1000);
        };

        this.isEnabled = function() {
            return this.enabled;
        };

        this.enable = function(enable) {
            enable = !!enable;

            if (this.enabled === enable) {
                return;
            };

            if (enable) {
                this.enabled = true;
                this.connect();
            } else {
                this.enabled = false;
                this.ws.close();
                this.ws = null;
            }
        };

        this.getServiceNetloc = function() {
            return this.service_netloc;
        };

        this.setServiceNetloc = function(netloc) {
            this.service_netloc = netloc;
            this.reconnect();
        };

        this.getName = function() {
            return this.monitor_name;
        };

        this.setName = function(name) {
            this.monitor_name = name;
            this.reconnect();
        };

        this.init();
    };

    var MonitorTab = function(callback) {
        this.socket = null;
        this.tab = null;

        this.monitor_url = "about:blank";

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

                this.socket = new TabSocket({
                    onmessage: this.onmessage.bind(this)
                });

                callback(this.tab.id);
            }.bind(this));
        };

        this.actionReload = function(hard) {
            if (!this.tab) {
                return;
            }

            chrome.tabs.reload(this.tab.id, {bypassCache: hard});
        };

        this.actionUrl = function(url) {
            this.monitor_url = url;

            if (!this.tab) {
                return;
            }

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

        this.isEnabled = function() {
            return this.socket.isEnabled();
        };

        this.enable = function(enable) {
            return this.socket.enable(enable);
        };

        this.getServiceNetloc = function() {
            return this.socket.getServiceNetloc();
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

    var monitorTabs = {};

    window.getMonitorTab = function(tabId) {
        if (!tabId in monitorTabs)
            return null;

        return monitorTabs[tabId];
    };

    // Time for some drinks
    window.openMonitorTab = function() {
        var tab = new MonitorTab(function(tabId) {
            monitorTabs[tabId] = tab;
        });
    };

})();
