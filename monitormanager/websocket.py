# -*- coding: utf-8 -*-
from __future__ import absolute_import

from collections import defaultdict

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


class WebSocketStore(object):
    """Handle pub/sub to a set of WebSocketHandler weakrefs"""

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
