(function() {
    var bg = chrome.extension.getBackgroundPage();

    var getEl = function(id) {
        return document.getElementById(id);
    };

    var initEvent = function(id, ev, callback) {
        getEl(id).addEventListener(ev, callback);
    };

    var TabControl = Backbone.Model.extend({

        initialize: function(monTab) {
            this.monTab = monTab;
            this.initFormFields();
            this.initEvents();
        },

        initFormFields: function() {
            getEl('monitor_name').value = this.monTab.getName();
        },

        initEvents: function() {
            initEvent('monitor_name_save', 'click', this.changeNameEvent.bind(this));
        },

        changeNameEvent: function() {
            var newName = getEl('monitor_name').value;
            this.monTab.setName(newName);
        }

    });

    var initOpenButton = function() {
        initEvent('open_monitor_tab', 'click', function(e) {
            bg.openMonitorTab();
            e.srcElement.disabled = true;
        });
    };

    var initDisableCheck = function() {
        getEl('disable_check').checked = !bg.getEnabled();
        initEvent('disable_check', 'change', function(e) {
            bg.setEnabled(!e.srcElement.checked);
        });
    };

    var initServiceNetlocInput = function() {
        getEl('service_netloc').value = bg.getServiceNetloc();
        initEvent('service_netloc_save', 'click', function(e) {
            var newServiceNetloc = getEl('service_netloc').value;
            bg.setServiceNetloc(newServiceNetloc);
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initOpenButton();
        initDisableCheck();
        initServiceNetlocInput();

        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            if (tabs.length != 1) {
                console.log("Well this is awkward.");
                return;
            }

            var tab = bg.getMonitorTab(tabs[0].id);

            if (tab) {
                var tabctl = new TabControl(tab);
            };
        });
    });

})();
