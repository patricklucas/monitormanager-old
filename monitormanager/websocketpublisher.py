from collections import defaultdict

from .weakset import WeakSet


class WebSocketPublisher(object):

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
