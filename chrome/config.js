(function(root) {

    var mm = {};

    var config = {
        enabled: true,
        service_netloc: "localhost:8123",
        default_monitor_name: "default",
        default_monitor_url: "about:blank"
    };

    var storageConfigKeys = ['enabled', 'service_netloc'];

    var configLoaded = false;
    var readyCallback = null;

    // Simple "wait for config from storage" mechanism
    mm.ready = function(callback) {
        if (configLoaded) {
            callback();
        } else {
            readyCallback = callback;
        }
    };

    mm.getConfig = function(key) {
        return config[key];
    };

    mm.setConfig = function(key, value) {
        if (!key in storageConfigKeys) {
            return;
        }

        config[key] = value;

        var toSet = {};
        toSet[key] = value;
        chrome.storage.local.set(toSet);
    };

    var loadConfig = function() {
        chrome.storage.local.get(storageConfigKeys, function(items) {
            storageConfigKeys.forEach(function(key) {
                if (items[key] !== undefined) {
                    config[key] = items[key];
                } else {
                    mm.setConfig(key, config[key]);
                }
            });

            configLoaded = true;
            if (readyCallback) {
                readyCallback();
            }
        });
    };

    loadConfig();

    root.mm = mm;

})(window);
