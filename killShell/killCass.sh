#!/bin/bash

pid=`ps -ef | grep cassandra | awk '{print$2}'`

kill -9 $pid

