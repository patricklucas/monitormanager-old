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
            console.log(this.monTab);
            getEl('disable_check').checked = !this.monTab.isEnabled();
            getEl('monitor_name').value = this.monTab.getName();
            getEl('service_url').value = this.monTab.getServiceUrl();
        },

        initEvents: function() {
            initEvent('disable_check', 'change', this.disableEvent.bind(this));
            initEvent('monitor_name_save', 'click', this.changeNameEvent.bind(this));
            initEvent('service_url_save', 'click', this.changeServiceUrlEvent.bind(this));
        },

        disableEvent: function(e) {
            this.monTab.enable(!e.srcElement.checked);
        },

        changeNameEvent: function() {
            var newName = getEl('monitor_name').value;
            this.monTab.setName(newName);
        },

        changeServiceUrlEvent: function() {
            var newServiceUrl = getEl('service_url').value;
            this.monTab.setServiceUrl(newServiceUrl);
        },
    });

    var initOpenButton = function() {
        initEvent('open_monitor_tab', 'click', function(e) {
            bg.openMonitorTab();
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

            var tab = bg.getMonitorTab(tabs[0].id);

            if (tab) {
                var tabctl = new TabControl(tab);
            };
        });

        initOpenButton();
    });

})();
