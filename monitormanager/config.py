import staticconf

port = staticconf.get_int('port')
db_uri = staticconf.get_string('db_uri')

def load(path):
	staticconf.YamlConfiguration(path, error_on_unknown=True)
