(function() {

    var TabControl = function() {
        // Refs
        this.ws = null;
        this.tab = null;

        // State
        this.enabled = true;
        this.service_url = "ws://localhost:8123/monitor/";
        this.monitor_name = "default";
        this.monitor_url = "about:blank";

        this.init = function() {
            chrome.tabs.onRemoved.addListener(function(tabId) {
                if (this.tab && this.tab.id == tabId) {
                    this.tab = null;
                }
            });

            this.connect();
        };

        this.connect = function() {
            this.ws = new WebSocket(this.service_url + this.monitor_name);
            this.ws.onmessage = this.ws_onmessage.bind(this);
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

        this.ws_onmessage = function(e) {
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

        this.init();
    };

    var foo = new TabControl();

    window.mm_isEnabled = function() {
        return foo.enabled;
    };

    window.mm_enable = function(enable) {
        enable = !!enable;

        if (foo.enabled === enable) {
            return;
        };

        if (enable) {
            foo.enabled = true;
            foo.connect();
        } else {
            foo.enabled = false;
            foo.ws.close();
            foo.ws = null;
        }
    };

    window.mm_getServiceUrl = function() {
        return foo.service_url;
    };

    window.mm_setServiceUrl = function(url) {
        foo.service_url = url;
        foo.reconnect();
    };

    window.mm_getName = function() {
        return foo.monitor_name;
    };

    window.mm_setName = function(name) {
        if (!name) {
            return false;
        }

        foo.monitor_name = name;
        foo.reconnect();
    };

    window.mm_isTabOpen = function() {
        return !!foo.tab;
    };

    // Time for some drinks
    window.mm_openTab = function() {
        if (foo.tab) {
            return;
        }

        chrome.tabs.create({url: foo.monitor_url}, function(newTab) {
            foo.tab = newTab;
        });
    };

})();
