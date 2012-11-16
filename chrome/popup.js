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
            getEl('service_netloc').value = this.monTab.getServiceNetloc();
        },

        initEvents: function() {
            initEvent('disable_check', 'change', this.disableEvent.bind(this));
            initEvent('monitor_name_save', 'click', this.changeNameEvent.bind(this));
            initEvent('service_netloc_save', 'click', this.changeServiceNetlocEvent.bind(this));
        },

        disableEvent: function(e) {
            this.monTab.enable(!e.srcElement.checked);
        },

        changeNameEvent: function() {
            var newName = getEl('monitor_name').value;
            this.monTab.setName(newName);
        },

        changeServiceNetlocEvent: function() {
            var newServiceNetloc = getEl('service_netloc').value;
            this.monTab.setServiceNetloc(newServiceNetloc);
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
