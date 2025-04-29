## DataRobot Lineage App

Focused on building dependency graphs for DataRobot Use Cases

Uses react and a node.js backend.  

## Usage 

```
npm install
cd ./client && npm install && npm run build
cd ..
npm start
```

## Utilizing chat (in process)

need a running instance of neo4j

```
docker run \
    -p 7474:7474 -p 7687:7687 \
    --name neo4j-apoc \
    -e NEO4J_apoc_export_file_enabled=true \
    -e NEO4J_apoc_import_file_enabled=true \
    -e NEO4J_apoc_import_file_use__neo4j__config=true \
    -e NEO4J_PLUGINS=\[\"apoc\"\] \
    neo4j:2025.01
```

every time you start the docker image, you should login to the neo4j UI at localhost:7474.  user and pword is neo4j.  You MUST reset the password and update `.env` before using the chat piece of the app

TODO: add a mechanism to push data to neo4j from server.js


