#!/bin/bash

pid=`ps -ef | grep arango | awk '{print$2}'`

kill -9 $pid

