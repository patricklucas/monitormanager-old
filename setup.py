# -*- coding: utf-8 -*-
from setuptools import setup

setup(
    name="monitormanager",
    version="0.1",
    author="Patrick Lucas",
    author_email="plucas@yelp.com",
    description="Monitor management service",
    long_description="Controls the URL of a tab running in a browser "
        "connected via websockets.",
    packages=["monitormanager"],
    install_requires=[
        "PyStaticConfiguration",
        "PyYAML",
        "SQLAlchemy",
        "simplejson",
        "tornado",
    ]
)
