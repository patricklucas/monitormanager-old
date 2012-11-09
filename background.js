(function() {
    const ws_url = "ws://dev22.706.yelpcorp.com:8123/";

    var ws,
        enabled = true,
        monitor_name = "default";

    var init = function() {
        ws = new WebSocket(ws_url + monitor_name);

        ws.onmessage = function(e) {
            console.log(e);
        };

        pollForConnect();
    };

    var reconnect = function() {
        ws.onclose = null; // Disable the reconnecting onclose handler
        ws.close();
        init();
    };

    var tryReconnect = function() {
        init();
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

    init();

    window.mm_send = function(message) {
        ws.send(message);
    }

    window.mm_enable = function(enable) {
        enabled = !!enable;

        if (enabled) {
            init();
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
})();
