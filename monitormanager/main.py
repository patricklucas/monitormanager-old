from __future__ import absolute_import

from collections import defaultdict

try:
    import json
except ImportError:
    import simplejson as json

from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler, HTTPError, URLSpec
from tornado.websocket import WebSocketHandler

from monitormanager import config, model
from .model import Monitor
from .weakset import WeakSet

monitors = defaultdict(WeakSet)

def send_to_monitors(monitor_name, message):
    for monitor in monitors[monitor_name]:
        monitor.write_message(message)


class MonitorSocketHandler(WebSocketHandler):

    def open(self, monitor_name):
        self._monitor_name = monitor_name
        monitors[self._monitor_name].add(self)

        session = Session()
        monitor = Monitor.get(session, monitor_name)

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
        monitors = [monitor.todict() for monitor in Monitor.getall(session)]
        self.write({'monitors': monitors})


class ManageMonitorHandler(RequestHandler):

    def get(self, monitor_name):
        session = Session()
        monitor = Monitor.get(session, monitor_name)

        if not monitor:
            raise HTTPError(404)

        self.write(monitor.todict())

    def post(self, monitor_name):
        session = Session()
        monitor = Monitor.get(session, monitor_name)

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

        self.redirect(self.reverse_url("manage_monitor", monitor.name),
            status=303)

    def put(self, monitor_name):
        session = Session()
        monitor = Monitor.get(session, monitor_name)

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

        session.add(new_monitor)
        session.commit()

        message = json.dumps({
            'action': "url",
            'url': new_monitor.url
        })

        send_to_monitors(new_monitor.name, message)

        self.redirect(self.reverse_url("manage_monitor", new_monitor.name),
            status=303)


    def delete(self, monitor_name):
        session = Session()
        deleted = Monitor.delete(session, monitor_name)

        if not deleted:
            session.rollback()
            raise HTTPError(404)

        session.commit()


class ManageMonitorReloadHandler(RequestHandler):

    def post(self, monitor_name):
        session = Session()
        monitor = Monitor.get(session, monitor_name)

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


class RootHandler(RequestHandler):

    def get(self):
        self.redirect(self.reverse_url("manage"))


def main():
    config.load("config.yaml")
    model.init_db()

    # TODO: is there a better way than this?
    global Session
    from .model import Session

    application = Application([
        (r"/monitor/(.*)", MonitorSocketHandler),
        URLSpec(r"/manage", ManageHandler, name="manage"),
        (r"/manage/monitors", ManageMonitorsHandler),
        (r"/manage/monitor/(.*)/reload", ManageMonitorReloadHandler),
        URLSpec(r"/manage/monitor/(.*)", ManageMonitorHandler,
            name="manage_monitor"),
        (r"/status", StatusHandler),
        (r"/", RootHandler),
    ], template_path="templates")

    application.listen(int(config.port))
    IOLoop.instance().start()

if __name__ == '__main__':
    main()
