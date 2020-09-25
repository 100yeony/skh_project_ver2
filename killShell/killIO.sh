#!/bin/bash

pid=`ps -ef | grep iotracer | awk '{print$2}'`

kill -2 $pid

