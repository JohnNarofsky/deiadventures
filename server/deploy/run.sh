#!/bin/sh

. ./env.sh
mkdir -p "data/"
./server "$@"

