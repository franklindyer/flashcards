#!/bin/bash

conda create -y -c conda-forge -n pfeil-dev --file dev-spec.txt
conda activate pfeil-dev

npm audit fix
npm install --save @types/jest
npm install nunjucks
