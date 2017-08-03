#!/bin/bash
git clone ${REPOSITORY} susi_slackbot
cd susi_slackbot
git checkout ${BRANCH}

if [ -v COMMIT_HASH ]; then
    git reset --hard ${COMMIT_HASH}
fi

npm install --no-shrinkwrap
