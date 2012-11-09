(function() {
    var bg = chrome.extension.getBackgroundPage();

    var getEl = function(id) {
        return document.getElementById(id);
    };

    var disableEvent = function(e) {
        bg.mm_enable(!e.srcElement.checked);
    };

    var changeNameEvent = function(e) {
        var newName = getEl('monitor_name').value;
        bg.mm_setName(newName);
    };

    var sendMessageEvent = function() {
        bg.mm_send("hi");
    };

    var initEvent = function(id, ev, callback) {
        getEl(id).addEventListener(ev, callback);
    };

    var initEvents = function() {
        initEvent('disable_check', 'change', disableEvent);
        initEvent('monitor_name_save', 'click', changeNameEvent);
        initEvent('send_message', 'click', sendMessageEvent);
    };

    var initFormFields = function() {
        getEl('disable_check').checked = !bg.mm_isEnabled();
        getEl('monitor_name').value = bg.mm_getName();
    };

    document.addEventListener('DOMContentLoaded', function () {
        initEvents();
        initFormFields();
    });
})();
