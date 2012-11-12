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


class ManageHandler(RequestHandler):

    def get(self):
        self.render("manage.html")


class ManageMonitorsHandler(RequestHandler):

    def get(self):
        session = Session()
        monitors = [monitor.todict() for monitor in session.query(Monitor)]
        self.write({'monitors': monitors})


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


    def delete(self, monitor_name):
        session = Session()

        deleted  = session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .delete()

        if not deleted:
            session.rollback()
            raise HTTPError(404)

        session.commit()


class ManageMonitorReloadHandler(RequestHandler):

    def post(self, monitor_name):
        session = Session()

        monitor = session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .first()

        if not monitor:
            raise HTTPError(404)

        data = json.loads(self.request.body)

        if 'hard' not in data:
            raise HTTPError(400)

        message = json.dumps({
            'action': "reload",
            'hard': data['hard']
        })

        send_to_monitors(monitor.name, message)


class StatusHandler(RequestHandler):

    def get(self):
        self.write('yep')


application = Application([
    (r"/monitor/(.*)", MonitorSocketHandler),
    (r"/manage", ManageHandler),
    (r"/manage/monitors", ManageMonitorsHandler),
    (r"/manage/monitor/(.*)/reload", ManageMonitorReloadHandler),
    (r"/manage/monitor/(.*)", ManageMonitorHandler),
    (r"/status", StatusHandler),
], template_path="templates")

application.listen(8123)
tornado.ioloop.IOLoop.instance().start()
