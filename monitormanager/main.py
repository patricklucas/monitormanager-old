# -*- coding: utf-8 -*-
from __future__ import absolute_import

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
from .websocket import reload_message, url_message, Publisher

websockets = Publisher()


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
        websockets.add(monitor_name, self)

        monitor = Monitor.get(self.db, monitor_name)

        if not monitor:
            return

        self.write_message(url_message(monitor.url))

    def on_message(self, message):
        pass

    def on_close(self):
        websockets.remove(self._monitor_name, self)


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

        websockets.publish(monitor.name, url_message(monitor.url))

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

        websockets.publish(new_monitor.name, url_message(new_monitor.url))

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

        websockets.publish(monitor.name, reload_message(data['hard']))


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
