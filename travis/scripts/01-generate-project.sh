#!/bin/bash
set -ev
#-------------------------------------------------------------------------------
# Generate the project with yo jhipster
#-------------------------------------------------------------------------------
mv -f $JHIPSTER_SAMPLES/$JHIPSTER $HOME/
cd $HOME/$JHIPSTER
if [ $GRUNT == 1 ]; then
  rm -Rf $HOME/$JHIPSTER/node_modules/*gulp*
else
  rm -Rf $HOME/$JHIPSTER/node_modules/*grunt*
fi
npm link generator-jhipster
yo jhipster --force --no-insight
yo jhipster-docker default --force --no-insight
ls -al $HOME/$JHIPSTER
ls -al $HOME/$JHIPSTER/node_modules/generator-jhipster/
ls -al $HOME/$JHIPSTER/node_modules/generator-jhipster/entity/
#-------------------------------------------------------------------------------
# Display the docker-compose files
#-------------------------------------------------------------------------------
if [ -a docker-compose.yml ]; then
  cat docker-compose.yml
fi
if [ -a docker-compose-prod.yml ]; then
  cat docker-compose-prod.yml
fi
