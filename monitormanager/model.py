# -*- coding: utf-8 -*-
from __future__ import absolute_import

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

from monitormanager import config
 
Base = declarative_base()


class Monitor(Base):

    __tablename__ = 'monitors'

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)
    url = Column(String, nullable=False)

    def __init__(self, name, url="about:blank"):
        self.name = name
        self.url = url

    @classmethod
    def get(cls, session, monitor_name):
        return session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .first()

    @classmethod
    def delete(cls, session, monitor_name):
        return bool(session.query(Monitor) \
            .filter(Monitor.name == monitor_name) \
            .delete())

    def todict(self):
        return {
            'name': self.name,
            'url': self.url,
        }

    def __repr__(self):
        return "<Monitor(%s %s)>" % (self.name, self.url)


def init_db():
    return create_engine(config.db_uri.value)

def main():
    """Run python -m monitormanager.model to initialize the database"""
    config.load("config.yaml")
    engine = init_db()
    Base.metadata.create_all(engine)

if __name__ == '__main__':
    main()
