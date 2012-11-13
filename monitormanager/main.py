# -*- coding: utf-8 -*-
from __future__ import absolute_import

from tornado.ioloop import IOLoop

from monitormanager import config, model
from monitormanager.application import MonitorManagerApplication

def main():
    config.load("config.yaml")

    engine = model.init_db()

    application = MonitorManagerApplication(engine)
    application.listen(int(config.port))

    IOLoop.instance().start()

if __name__ == '__main__':
    main()
