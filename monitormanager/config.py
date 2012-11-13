# -*- coding: utf-8 -*-
from __future__ import absolute_import

import staticconf

address = staticconf.get_string('address', "")
port = staticconf.get_int('port', 8123)
db_uri = staticconf.get_string('db_uri')
template_path = staticconf.get_string('template_path', "templates")
debug = staticconf.get_bool('debug', False)

def load(path):
	staticconf.YamlConfiguration(path, error_on_unknown=True)
