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


import "neo4j-driver";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";

const url = process.env.NEO4J_URI;
const username = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;
const graph = await Neo4jGraph.initialize({ url, username, password });

// Import movie information
const moviesQuery = `LOAD CSV WITH HEADERS FROM 
'https://raw.githubusercontent.com/tomasonjo/blog-datasets/main/movies/movies_small.csv'
AS row
MERGE (m:Movie {id:row.movieId})
SET m.released = date(row.released),
    m.title = row.title,
    m.imdbRating = toFloat(row.imdbRating)
FOREACH (director in split(row.director, '|') | 
    MERGE (p:Person {name:trim(director)})
    MERGE (p)-[:DIRECTED]->(m))
FOREACH (actor in split(row.actors, '|') | 
    MERGE (p:Person {name:trim(actor)})
    MERGE (p)-[:ACTED_IN]->(m))
FOREACH (genre in split(row.genres, '|') | 
    MERGE (g:Genre {name:trim(genre)})
    MERGE (m)-[:IN_GENRE]->(g))`;

await graph.query(moviesQuery);