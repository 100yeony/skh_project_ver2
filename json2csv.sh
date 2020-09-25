#!/bin/bash

jq -r '(["metric", "measurement", "value", "operation"]) as $cols | $cols, map(. as $row | $cols | map($row[.]))[] | @csv' $1 > $1_temp.csv

tr -d '"' <$1_temp.csv >$1.csv
rm -f $1_temp.csv
chmod +x . $1.csv
