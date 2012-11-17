(function(mm) {
    /**
     * Establishes and maintains a websocket connection to the server.
     *
     * Connects to the endpoint defined by service_netloc and monitor_name,
     * letting the owner handle onmessage events.
     *
     * Is resiliant to service interruptions and intelligently handles changes
     * to the enabled state, service_netloc, and monitor_name.
     *
     * If enabled and the websocket closes, retry every 1000ms until connected
     * or disabled.
     */

    var MonitorSocket = function(options) {
        this.ws = null;

        // State
        this.enabled = options.enabled || true;
        this.service_netloc = options.service_netloc;
        this.monitor_name = options.monitor_name;

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

        this.disconnect = function() {
            this.ws.onclose = null; // Disable the reconnecting onclose handler
            this.ws.close();
            this.ws = null;
        };

        this.reconnect = function() {
            this.disconnect();
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

        this.setEnabled = function(enable) {
            if (enable) {
                this.enabled = true;
                this.connect();
            } else {
                this.enabled = false;
                this.disconnect();
            }
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

    mm.MonitorSocket = MonitorSocket;

})(window.mm);
