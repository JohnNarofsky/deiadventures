#!/bin/sh

# This is NOT fully automated. This script requires some human intervention.
# It is mostly just a record so it is known what I did to setup the server,
# so someone other than me could do it again easily.

# This script runs the appropriate installations on a Ubuntu 22.04 server.
# Setting this up in lieu of a Docker container because these are bodging hours.

# Before you run this script, ensure that the following are true:
# 1. You have assigned a public IPv4 address to the server.
# 2. You have configured a DNS A record to point to the server.
# 3. Both port 80 and port 443 on the network interface to which the
#    public IPv4 address is bound are open.

sudo apt install nginx -y

sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# TODO: copy over nginx configuration before running certbot
#       Currently this relies on manual setup, but it doesn't have to

sudo certbot --nginx
# Typed in FQDNs
