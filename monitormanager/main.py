# -*- coding: utf-8 -*-
from __future__ import absolute_import

import optparse
import os

from tornado.ioloop import IOLoop

from monitormanager import config, model
from monitormanager.application import MonitorManagerApplication

DEFAULT_CONFIG_PATH = "config.yaml"

def main():
    parser = optparse.OptionParser()
    parser.add_option('-c', '--config', help='The path to the config file')
    parser.add_option('-a', '--address')
    parser.add_option('-p', '--port', type='int')
    parser.add_option('--debug', action='store_true')

    opts, args = parser.parse_args()
    if args:
        parser.error("No positional arguments")

    if opts.config and not os.path.exists(opts.config):
        parser.error("Config file not found at '%s'" % opts.config)

    config_path = opts.config if opts.config else DEFAULT_CONFIG_PATH
    config.load(config_path)

    if opts.address:
        config.address = opts.address

    if opts.port:
        config.port = opts.port

    if opts.debug:
        config.debug = opts.debug

    engine = model.init_db()
    application = MonitorManagerApplication(engine)
    application.listen(config.port.value, config.address.value)

    IOLoop.instance().start()

if __name__ == '__main__':
    main()
