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

    def post(self, monitor, action):
        if not monitor in monitors:
            return

        if action == 'reload':
            hard_str = self.get_argument('hard', "false")
            hard = (hard_str == "true")

            message = json.dumps({
                'action': "reload",
                'hard': hard
            })
        elif action == 'url':
            url = self.get_argument('url')

            message = json.dumps({
                'action': "url",
                'url': url
            })
        else:
            message = None

        if message:
            for conn in monitors[monitor]:
                conn.write_message(message)


application = tornado.web.Application([
    (r"/monitor/(.*)", MonitorSocketHandler),
    (r"/action/(.*)/(.*)", MonitorPingHandler),
    (r"/status", StatusHandler),
])

application.listen(8123)
tornado.ioloop.IOLoop.instance().start()
