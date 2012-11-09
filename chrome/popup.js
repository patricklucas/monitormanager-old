(function() {
    var bg = chrome.extension.getBackgroundPage();

    var getEl = function(id) {
        return document.getElementById(id);
    };

    var disableEvent = function(e) {
        bg.mm_enable(!e.srcElement.checked);
    };

    var changeNameEvent = function() {
        var newName = getEl('monitor_name').value;
        bg.mm_setName(newName);
    };

    var changeServiceUrlEvent = function() {
        var newServiceUrl = getEl('service_url').value;
        bg.mm_setServiceUrl(newServiceUrl);
    };

    var openMonitorTabEvent = function(e) {
        bg.mm_openTab();
        e.srcElement.disabled = true;
    };

    var initEvent = function(id, ev, callback) {
        getEl(id).addEventListener(ev, callback);
    };

    var initEvents = function() {
        initEvent('disable_check', 'change', disableEvent);
        initEvent('monitor_name_save', 'click', changeNameEvent);
        initEvent('service_url_save', 'click', changeServiceUrlEvent);
        initEvent('open_monitor_tab', 'click', openMonitorTabEvent);
    };

    var initFormFields = function() {
        getEl('disable_check').checked = !bg.mm_isEnabled();
        getEl('monitor_name').value = bg.mm_getName();
        getEl('service_url').value = bg.mm_getServiceUrl();
        getEl('open_monitor_tab').disabled = bg.mm_isTabOpen();
    };

    document.addEventListener('DOMContentLoaded', function () {
        initEvents();
        initFormFields();
    });
})();
