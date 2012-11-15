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
            getEl('open_monitor_tab').disabled = bg.mm_isTabOpen();
        },

        initEvents: function() {
            initEvent('disable_check', 'change', this.disableEvent);
            initEvent('monitor_name_save', 'click', this.changeNameEvent);
            initEvent('service_url_save', 'click', this.changeServiceUrlEvent);
            initEvent('open_monitor_tab', 'click', this.openMonitorTabEvent);
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

        openMonitorTabEvent: function(e) {
            bg.mm_openTab();
            e.srcElement.disabled = true;
        }

    });

    document.addEventListener('DOMContentLoaded', function () {
        tabctl = new TabControl();
    });

})();
