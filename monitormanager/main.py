from collections import defaultdict

try:
    import json
except ImportError:
    import simplejson as json

import tornado.ioloop
import tornado.web
import tornado.websocket

from weakset import WeakSet

monitors = defaultdict(WeakSet)

class MonitorSocketHandler(tornado.websocket.WebSocketHandler):

    def open(self, monitor):
        self._monitor = monitor
        monitors[self._monitor].add(self)

    def on_message(self, message):
        pass

    def on_close(self):
        monitors[self._monitor].remove(self)
        if not monitors[self._monitor]:
            del monitors[self._monitor]


class StatusHandler(tornado.web.RequestHandler):

    def get(self):
        self.write('yep')


class MonitorPingHandler(tornado.web.RequestHandler):

    def get(self, monitor, action):
        if not monitor in monitors:
            return

        if action == 'reload':
            message = json.dumps({
                'action': "reload"
            })
        elif action == 'url':
            message = json.dumps({
                'action': "url",
                'url': "http://www.google.com"
            })
        else:
            message = None

        if message:
            for conn in monitors[monitor]:
                conn.write_message(message)


application = tornado.web.Application([
    (r"/monitor/(.*)", MonitorSocketHandler),
    (r"/ping/(.*)/(.*)", MonitorPingHandler),
    (r"/status", StatusHandler),
    (r"/", StatusHandler)
])

application.listen(8123)
tornado.ioloop.IOLoop.instance().start()
