import "neo4j-driver";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import dotenv from "dotenv";

dotenv.config();

let neo4jGraph = null;

async function getOrCreateNeo4jGraph() { 
    if (!neo4jGraph) {
        const NEO4J_URL = process.env.NEO4J_URL;
        const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
        const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

        neo4jGraph = Neo4jGraph.initialize({
            url: NEO4J_URL,
            username: NEO4J_USERNAME,
            password: NEO4J_PASSWORD,
        });
    }
    return neo4jGraph;
}
