# -*- coding: utf-8 -*-
from distutils.core import setup

setup(
    name='monitormanager',
    version='0.1',
    provides=['monitormanager'],
    author="Patrick Lucas",
    author_email="plucas@yelp.com",
    description="Monitor management service",
    packages=['monitormanager'],
    long_description="Controls the URL of a tab running in a browser "
        "connected via websockets.",
)
