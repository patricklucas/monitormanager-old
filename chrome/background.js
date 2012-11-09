(function() {

    const ws_url = "ws://localhost:8123/monitor/";

    // Refs
    var ws,
        tab;

    // State
    var enabled = true,
        monitor_name = "default",
        monitor_url = "about:blank";

    var init = function() {
        connect();
        chrome.tabs.onRemoved.addListener(function(tabId) {
            if (tab.id == tabId) {
                tab = null;
            }
        });
    };

    var connect = function() {
        ws = new WebSocket(ws_url + monitor_name);

        ws.onmessage = function(e) {
            console.log(e.data);
        };

        pollForConnect();
    };

    var reconnect = function() {
        ws.onclose = null; // Disable the reconnecting onclose handler
        ws.close();
        connect();
    };

    var tryReconnect = function() {
        connect();
    };

    var pollForConnect = function() {
        if (ws.readyState == ws.OPEN) {
            ws.onclose = function() {
                if (enabled) {
                    setTimeout(tryReconnect, 1000);
                }
            };
        } else if (ws.readyState == ws.CONNECTING) {
            setTimeout(pollForConnect, 1000);
        } else { // CLOSED or CLOSING
            setTimeout(tryReconnect, 1000);
        }
    };

    window.mm_send = function(message) {
        ws.send(message);
    }

    window.mm_enable = function(enable) {
        enabled = !!enable;

        if (enabled) {
            connect();
            console.log("ENABLED");
        } else {
            ws.close();
            ws = null;
            console.log("DISABLED");
        }
    };

    window.mm_isEnabled = function() {
        return enabled;
    };

    window.mm_getName = function() {
        return monitor_name;
    };

    window.mm_setName = function(name) {
        if (!name) {
            return false;
        }

        monitor_name = name;
        reconnect();
    };

    window.mm_isTabOpen = function(callback) {
        return !!tab;
    };

    // Time for some drinks
    window.mm_openTab = function() {
        if (tab) {
            return;
        }

        chrome.tabs.create({url: monitor_url}, function(newTab) {
            tab = newTab;
        });
    };

    init();

})();
