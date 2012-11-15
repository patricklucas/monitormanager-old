(function() {

    var TabSocket = function(options) {
        // Refs
        this.ws = null;
        this.tab = null;

        // State
        this.enabled = options && options.enabled || true;
        this.service_url = options && options.service_url || "ws://localhost:8123/monitor/";
        this.monitor_name = options && options.monitor_name || "InfraTopLeft";
        this.monitor_url = options && options.monitor_url || "about:blank";

        // Callbacks
        this.onmessage = options && options.onmessage;

        this.init = function() {
            this.connect();
        };

        this.connect = function() {
            this.ws = new WebSocket(this.service_url + this.monitor_name);
            this.ws.onmessage = this.onmessage.bind(this);
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

        this.init();
    };

    var MonitorTab = function() {
        this.socket = null;
        this.tab = null;

        this.init = function() {
            chrome.tabs.onRemoved.addListener(function(tabId) {
                if (this.tab && this.tab.id == tabId) {
                    delete window.tabses[this.tab.id];
                    this.tab = null;
                }
            });

            this.socket = new TabSocket({
                onmessage: this.onmessage.bind(this)
            });
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
            return this.socket.enabled;
        };

        this.enable = function(enable) {
            enable = !!enable;

            if (this.socket.enabled === enable) {
                return;
            };

            if (enable) {
                this.socket.enabled = true;
                this.socket.connect();
            } else {
                this.socket.enabled = false;
                this.socket.ws.close();
                this.socket.ws = null;
            }
        };

        this.getServiceUrl = function() {
            return this.socket.service_url;
        };

        this.setServiceUrl = function(url) {
            this.socket.service_url = url;
            this.socket.reconnect();
        };

        this.getName = function() {
            return this.socket.monitor_name;
        };

        this.setName = function(name) {
            if (!name) {
                return false;
            }

            this.socket.monitor_name = name;
            this.socket.reconnect();
        };

        this.isTabOpen = function() {
            return !!bar.tab;
        };

        this.init();
    };

    window.tabses = {};

    // Time for some drinks
    window.mm_openTab = function() {
        var monTab = new MonitorTab();

        chrome.tabs.create({url: monTab.socket.monitor_url}, function(newTab) {
            monTab.tab = newTab;
            window.tabses[newTab.id] = monTab;
        });
    };

})();
