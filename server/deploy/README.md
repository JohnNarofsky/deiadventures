# Deployment Configuration
This directory houses some example configuration for the DEI Adventures backend.
(Currently, it matches what we use for our staging instance.)
(There are other ways to manage your deployment than what we do; this one is just
an example which is known to work.)

We use NGINX primarily for the ease of using Certbot with it, for TLS certificate issuance.

We're using Ubuntu 22.04 with the following APT packages installed:
- `nginx-core`
- `cerbot`
- `python3-certbot-nginx`

Start by creating a DNS entry which points at the machine
you're going to be running your API instance on.

You'll also want to make sure ports 80 and 443 are open, and end up being routed to NGINX.
It's conceivable to adjust this configuration to run NGINX as a non-root user and use `iptables`
to route those ports to NGINX. We do not do this simply because we did not research how, and
we're allocating single purpose VMs for this anyway.

On Ubuntu,
1. Copy `systemd/system/dei_server.service` to `/etc/systemd/system/dei_server.service`.
2. Copy `systemd/sysusers/dei.conf` to `/usr/lib/sysusers.d/dei.conf`.
3. Run `sudo systemctl restart systemd-sysusers.service`.
   This ensures the system user configured in `systemd/sysusers/dei.conf` is loaded.
4. Run `sudo mkdir /home/dei_api`.
   We could probably do this with the sysuser configuration, but we don't.
5. Copy `env.sh` to `/home/dei_api/env.sh`.
6. Copy `run.sh` to `/home/dei_api/run.sh`.
7. Copy the built `server` binary to `/home/dei_api/server`.
8. Run `sudo chown -R dei_api:dei_api /home/dei_api`.
9. Run `sudo systemctl start dei_server.service`.

You may run `systemctl status dei_server.service` to see if the server started successfully.

At this point, we move to configuring NGINX and getting a TLS cert issued.

10. Copy `nginx/sites-available/api.staging.deiadventures.quest` into the `/etc/nginx/sites-available`
    directory, editing the `server_name` field in it and renaming the file both to match your API instance's
    fully qualified domain name.
11. Symlink `nginx/sites-available/<your API FQDN>` to `nginx/sites-enabled/<your API FQDN>`.
12. Run `sudo nginx -s reload`.
13. Run `sudo certbot --nginx`, and follow its instructions. (This step is interactive.)

Congratulations, you're done!
