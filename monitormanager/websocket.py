from collections import defaultdict, namedtuple

try:
    import json
except ImportError:
    import simplejson as json

from .weakset import WeakSet

def reload_message(hard=False):
    return json.dumps({
        'action': "reload",
        'hard': hard,
    })

def url_message(url):
    return json.dumps({
        'action': "url",
        'url': url,
    })


class Publisher(object):

    def __init__(self):
        self._clients = defaultdict(WeakSet)

    def add(self, name, websocket):
        self._clients[name].add(websocket)

    def remove(self, name, websocket):
        self._clients[name].remove(websocket)
        if not self._clients[name]:
            del self._clients[name]

    def publish(self, name, message):
        if name in self._clients:
            for client in self._clients[name]:
                client.write_message(message)
