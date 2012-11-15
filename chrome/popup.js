(function() {
    var bg = chrome.extension.getBackgroundPage();

    var getEl = function(id) {
        return document.getElementById(id);
    };

    var initEvent = function(id, ev, callback) {
        getEl(id).addEventListener(ev, callback);
    };

    var TabControl = Backbone.Model.extend({

        initialize: function() {
            this.initFormFields();
            this.initEvents();
        },

        initFormFields: function() {
            getEl('disable_check').checked = !bg.mm_isEnabled();
            getEl('monitor_name').value = bg.mm_getName();
            getEl('service_url').value = bg.mm_getServiceUrl();
        },

        initEvents: function() {
            initEvent('disable_check', 'change', this.disableEvent);
            initEvent('monitor_name_save', 'click', this.changeNameEvent);
            initEvent('service_url_save', 'click', this.changeServiceUrlEvent);
        },

        disableEvent: function(e) {
            bg.mm_enable(!e.srcElement.checked);
        },

        changeNameEvent: function() {
            var newName = getEl('monitor_name').value;
            bg.mm_setName(newName);
        },

        changeServiceUrlEvent: function() {
            var newServiceUrl = getEl('service_url').value;
            bg.mm_setServiceUrl(newServiceUrl);
        },
    });

    var initOpenButton = function() {
        initEvent('open_monitor_tab', 'click', function(e) {
            bg.mm_openTab();
            e.srcElement.disabled = true;
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        var tabctl;

        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            if (tabs.length != 1) {
                console.log("Well this is awkward.");
                return;
            }

            var tab = tabs[0];

            if (tab.id in bg.tabses) {
                var tabctl = new TabControl(tab);
            };
        });

        initOpenButton();
    });

})();
