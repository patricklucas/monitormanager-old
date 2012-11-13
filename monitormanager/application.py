# -*- coding: utf-8 -*-
from __future__ import absolute_import

import simplejson as json
from sqlalchemy.orm import scoped_session, sessionmaker
from tornado.web import Application, RequestHandler, HTTPError, URLSpec
from tornado.websocket import WebSocketHandler

from monitormanager import config
from .model import Monitor
from .websocket import reload_message, url_message, WebSocketStore

websockets = WebSocketStore()


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
        desc = (self.get_argument('desc', "false") == "true")

        order_by = Monitor.name
        if desc:
            order_by = order_by.desc()

        query = self.db.query(Monitor) \
            .order_by(order_by)

        monitors = [monitor.todict() for monitor in query]
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
            'template_path': "templates",
            'debug': config.debug,
        }

        super(MonitorManagerApplication, self).__init__(handlers, **settings)

        self.db = scoped_session(sessionmaker(bind=engine))
