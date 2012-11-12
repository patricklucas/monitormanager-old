from collections import defaultdict

try:
    import json
except ImportError:
    import simplejson as json

import tornado.ioloop
from tornado.web import Application, RequestHandler, HTTPError
import tornado.websocket

from model import Session, Monitor
from requesthandler import RequestHandler
from weakset import WeakSet

monitors = defaultdict(WeakSet)

def send_to_monitors(monitor_name, message):
    for monitor in monitors[monitor_name]:
        monitor.write_message(message)


class MonitorSocketHandler(tornado.websocket.WebSocketHandler):

    def open(self, monitor_name):
        self._monitor_name = monitor_name
        monitors[self._monitor_name].add(self)

        session = Session()

        monitor = session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .first()

        if not monitor:
            return

        message = json.dumps({
            'action': "url",
            'url': monitor.url
        })

        self.write_message(message)

    def on_message(self, message):
        pass

    def on_close(self):
        monitors[self._monitor_name].remove(self)
        if not monitors[self._monitor_name]:
            del monitors[self._monitor_name]


class MonitorPingHandler(RequestHandler):

    def post(self, monitor_name, action):
        if not monitor_name in monitors:
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
            send_to_monitors(monitor_name, message)


class ManageMonitorHandler(RequestHandler):

    def get(self, monitor_name):
        session = Session()

        monitor = session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .first()

        if not monitor:
            raise HTTPError(404)

        self.write(monitor.todict())

    def post(self, monitor_name):
        session = Session()

        monitor = session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .first()

        if not monitor:
            raise HTTPError(404)

        data = json.loads(self.request.body)

        if 'url' not in data:
            raise HTTPError(400)

        monitor.url = data['url']

        session.commit()

        message = json.dumps({
            'action': "url",
            'url': monitor.url
        })

        send_to_monitors(monitor.name, message)

        self.redirect("/manage/monitor/%s" % monitor.name, status=303)

    def put(self, monitor_name):
        session = Session()

        monitor = session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .first()

        if monitor:
            raise HTTPError(400)

        data = json.loads(self.request.body)

        if 'url' not in data:
            raise HTTPError(400)

        new_monitor = Monitor(
            name=monitor_name,
            url=data['url'],
        )

        session.add(new_monitor)
        session.commit()

        message = json.dumps({
            'action': "url",
            'url': new_monitor.url
        })

        send_to_monitors(new_monitor.name, message)

        self.redirect("/manage/monitor/%s" % new_monitor.name, status=303)


class StatusHandler(RequestHandler):

    def get(self):
        self.write('yep')


application = Application([
    (r"/monitor/(.*)", MonitorSocketHandler),
    (r"/action/(.*)/(.*)", MonitorPingHandler),
    (r"/manage/monitor/(.*)", ManageMonitorHandler),
    (r"/status", StatusHandler),
])

application.listen(8123)
tornado.ioloop.IOLoop.instance().start()
