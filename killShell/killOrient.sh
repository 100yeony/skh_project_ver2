#!/bin/bash

pid=`ps -ef | grep orientdb | awk '{print$2}'`

kill -9 $pid

