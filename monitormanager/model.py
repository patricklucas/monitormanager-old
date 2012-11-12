# -*- coding: utf-8 -*-
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
 
Base = declarative_base()


class Monitor(Base):

    __tablename__ = 'monitors'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)

    def __init__(self, name, url="about:blank"):
        self.name = name
        self.url = url

    def todict(self):
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
        }

    def __repr__(self):
        return "<Monitor(%s %s)>" % (self.name, self.url)


engine = create_engine('sqlite:////tmp/monitormanager.db')
Session = sessionmaker(bind=engine)

if __name__ == '__main__':
    Base.metadata.create_all(engine)
