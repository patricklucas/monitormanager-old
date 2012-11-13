# -*- coding: utf-8 -*-
from __future__ import absolute_import

import weakref

class WeakSet(object):

    def __init__(self):
        super(WeakSet, self).__init__()
        self._items = weakref.WeakKeyDictionary()

    def add(self, obj):
        self._items[obj] = True

    def remove(self, obj):
        del self._items[obj]

    def __iter__(self):
        return iter(self._items)

    def __len__(self):
        return len(self._items)
