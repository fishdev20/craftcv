#!/bin/sh
# Turns the raw captures from capture-app.mjs (website/.capture) into the screenshots the home
# page's "How it works" list shows (website/public/app). Needs ffmpeg.
#
#   sh website/scripts/encode-app.sh     (from the repository root)
set -eu
cd "$(dirname "$0")/.."
in=.capture
out=public/app
mkdir -p "$out"

for name in job-check cv evidence review; do
  ffmpeg -loglevel error -y -i "$in/$name.png" -q:v 3 "$out/$name.jpg"
done
# the first step's picture: the opening frame of the recorded run
ffmpeg -loglevel error -y -i "$in/frames/00000.jpg" -q:v 3 "$out/run-poster.jpg"

ls -la "$out"
