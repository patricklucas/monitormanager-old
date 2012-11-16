(function(mm) {

    var TabSocket = function(options) {
        // Refs
        this.ws = null;
        this.tab = null;

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

        this.setEnabled = function(enable) {
            if (enable) {
                this.enabled = true;
                this.connect();
            } else {
                this.enabled = false;
                this.ws.close();
                this.ws = null;
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

    mm.TabSocket = TabSocket;

})(window.mm);
