# ระบบ Queue API

## Installation

```
git clone https://gitlab.com/moph/queue/queue-api
cd queue-api
cp config.txt config
npm install
```

Edit `config` file for connection/h4u configuration.

## Running

```
nodemon
```
## Modify

download oracle client to ```oracle/``` folder

I add code for connect His that use oracleDB. in app.ts

Need to rebuild images that user in mophos/queue
1. mophos/mmis-nginx in ```mmis-nginx.Dockerfile```
2. mophos/queue in ```Dockerfile``` in the docker file 
- modify queue-api
- add : oracle client install
- add : npm i oracledb --save or add in package.json 
3. use ```docker-compose.yml``` to deploy