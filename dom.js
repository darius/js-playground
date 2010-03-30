// Cross-platform DOM stuff, from Eloquent Javascript

function $(id) {
    return document.getElementById(id);
}

function registerEventHandler(node, event, handler) {
    if (typeof node.addEventListener === 'function')
        node.addEventListener(event, handler, false);
    else
        node.attachEvent('on' + event, handler);
}

function unregisterEventHandler(node, event, handler) {
    if (typeof node.removeEventListener === 'function')
        node.removeEventListener(event, handler, false);
    else
        node.detachEvent('on' + event, handler);
}
