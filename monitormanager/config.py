# -*- coding: utf-8 -*-
from __future__ import absolute_import

import staticconf

port = staticconf.get_int('port')
db_uri = staticconf.get_string('db_uri')
debug = staticconf.get_bool('debug', False)

def load(path):
	staticconf.YamlConfiguration(path, error_on_unknown=True)
