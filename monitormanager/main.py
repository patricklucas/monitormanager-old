from collections import defaultdict

import tornado.ioloop
import tornado.web
import tornado.websocket

from weakset import WeakSet

monitors = defaultdict(WeakSet)

class MonitorSocketHandler(tornado.websocket.WebSocketHandler):

    def open(self, monitor):
        print "open:", monitor
        self._monitor = monitor
        monitors[self._monitor].add(self)

    def on_message(self, message):
        print message

    def on_close(self):
        print "close:", self._monitor
        monitors[self._monitor].remove(self)
        if not monitors[self._monitor]:
            del monitors[self._monitor]


class StatusHandler(tornado.web.RequestHandler):

    def get(self):
        self.write('yep')


class MonitorPingHandler(tornado.web.RequestHandler):

    def get(self, monitor):
        if not monitor in monitors:
            return

        for conn in monitors[monitor]:
            conn.write_message("refresh")


application = tornado.web.Application([
    (r"/monitor/(.*)", MonitorSocketHandler),
    (r"/ping/(.*)", MonitorPingHandler),
    (r"/status", StatusHandler),
    (r"/", StatusHandler)
])

application.listen(8123)
tornado.ioloop.IOLoop.instance().start()
