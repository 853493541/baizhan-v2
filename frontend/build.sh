sudo systemd-run --scope bash -lc '
cd /home/ubuntu/baizhan-v2/frontend &&
rm -rf .next &&
npm run build &&
chown -R ubuntu:ubuntu .next/cache || true
'
