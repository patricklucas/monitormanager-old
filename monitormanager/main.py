# -*- coding: utf-8 -*-
from __future__ import absolute_import

from collections import defaultdict

try:
    import json
except ImportError:
    import simplejson as json

from sqlalchemy.orm import scoped_session, sessionmaker
from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler, HTTPError, URLSpec
from tornado.websocket import WebSocketHandler

from monitormanager import config, model
from .model import Monitor
from .weakset import WeakSet

monitor_dict = defaultdict(WeakSet)

def send_to_monitors(monitor_name, message):
    for monitor in monitor_dict[monitor_name]:
        monitor.write_message(message)


class BaseRequestHandler(RequestHandler):

    @property
    def db(self):
        return self.application.db


class BaseWebSocketHandler(WebSocketHandler):

    @property
    def db(self):
        return self.application.db


class MonitorSocketHandler(BaseWebSocketHandler):

    _monitor_name = None

    def open(self, monitor_name):
        self._monitor_name = monitor_name
        monitor_dict[self._monitor_name].add(self)

        monitor = Monitor.get(self.db, monitor_name)

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
        monitor_dict[self._monitor_name].remove(self)
        if not monitor_dict[self._monitor_name]:
            del monitor_dict[self._monitor_name]


class ManageHandler(BaseRequestHandler):

    def get(self):
        self.render("manage.html")


class ManageMonitorsHandler(BaseRequestHandler):

    def get(self):
        monitors = [monitor.todict() for monitor in Monitor.getall(self.db)]
        self.write({'monitors': monitors})


class ManageMonitorHandler(BaseRequestHandler):

    def get(self, monitor_name):
        monitor = Monitor.get(self.db, monitor_name)

        if not monitor:
            raise HTTPError(404)

        self.write(monitor.todict())

    def post(self, monitor_name):
        monitor = Monitor.get(self.db, monitor_name)

        if not monitor:
            raise HTTPError(404)

        data = json.loads(self.request.body)

        if 'url' not in data:
            raise HTTPError(400)

        monitor.url = data['url']

        self.db.commit()

        message = json.dumps({
            'action': "url",
            'url': monitor.url
        })

        send_to_monitors(monitor.name, message)

        self.redirect(self.reverse_url("manage_monitor", monitor.name),
            status=303)

    def put(self, monitor_name):
        monitor = Monitor.get(self.db, monitor_name)

        if monitor:
            raise HTTPError(400)

        data = json.loads(self.request.body)

        if 'url' not in data:
            raise HTTPError(400)

        # Disallow '/', '#', and '?' from names
        if frozenset(['/', '#', '?']) & frozenset(monitor_name):
            raise HTTPError(400)

        new_monitor = Monitor(
            name=monitor_name,
            url=data['url'],
        )

        self.db.add(new_monitor)
        self.db.commit()

        message = json.dumps({
            'action': "url",
            'url': new_monitor.url
        })

        send_to_monitors(new_monitor.name, message)

        self.redirect(self.reverse_url("manage_monitor", new_monitor.name),
            status=303)


    def delete(self, monitor_name):
        deleted = Monitor.delete(self.db, monitor_name)

        if not deleted:
            self.db.rollback()
            raise HTTPError(404)

        self.db.commit()


class ManageMonitorReloadHandler(BaseRequestHandler):

    def post(self, monitor_name):
        monitor = Monitor.get(self.db, monitor_name)

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


class StatusHandler(BaseRequestHandler):

    def get(self):
        self.write('yep')


class RootHandler(BaseRequestHandler):

    def get(self):
        self.redirect(self.reverse_url("manage"))


class MonitorManagerApplication(Application):

    def __init__(self, engine):
        handlers = [
            (r"/monitor/(.*)", MonitorSocketHandler),
            URLSpec(r"/manage", ManageHandler, name="manage"),
            (r"/manage/monitors", ManageMonitorsHandler),
            (r"/manage/monitor/(.*)/reload", ManageMonitorReloadHandler),
            URLSpec(r"/manage/monitor/(.*)", ManageMonitorHandler,
                name="manage_monitor"),
            (r"/status", StatusHandler),
            (r"/", RootHandler),
        ]

        settings = {
            'template_path': "templates"
        }

        super(MonitorManagerApplication, self).__init__(handlers, **settings)

        self.db = scoped_session(sessionmaker(bind=engine))

def main():
    config.load("config.yaml")

    engine = model.init_db()

    application = MonitorManagerApplication(engine)
    application.listen(int(config.port))

    IOLoop.instance().start()

if __name__ == '__main__':
    main()
