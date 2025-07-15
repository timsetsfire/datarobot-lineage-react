import "neo4j-driver";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import dotenv, { populate } from "dotenv";
import { clearLine } from "readline";

dotenv.config();

const GRAPHDB = process.env.GRAPHDB

let neo4jGraph = null;

Object.flatten = function (data) {
    var result = {};
    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (var i = 0, l = cur.length; i < l; i++)
                recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + "." + p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

Object.unflatten = function (data) {
    "use strict";
    if (Object(data) !== data || Array.isArray(data))
        return data;
    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
        resultholder = {};
    for (var p in data) {
        var cur = resultholder,
            prop = "",
            m;
        while (m = regex.exec(p)) {
            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
            prop = m[2] || m[1];
        }
        cur[prop] = data[p];
    }
    return resultholder[""] || resultholder;
};

function sanitizeForNeo4jPropertyName(input) {
    // Remove any leading and trailing whitespaces
    input = input.trim();
    // Replace all non-alphanumeric characters (except _ and $) with underscores
    input = input.replace(/[^a-zA-Z0-9_$]/g, '_');
    // If the string starts with a number, prepend an underscore
    if (/^\d/.test(input)) {
        input = '_' + input;
    }
    // Ensure the string is not empty after sanitizing
    if (input === "") {
        input = "_empty"; // You can modify this to whatever default you'd like
    }
    return input;
}
function removeEmptyValues(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        // Check for empty object or empty array
        if (!(value === null) &&  
            !(Array.isArray(value) && value.length === 0) &&
            !(Object.prototype.toString.call(value) === '[object Object]' && Object.keys(value).length === 0)
        ) {
            result[key] = value;
        }
    }
    return result;
}
function prepareDataForNeo4j(nodeData) {
    const nodes = nodeData.map(node => {
        delete node.parents; 
        const flatObject = Object.flatten(node);
        const flatObject2 = removeEmptyValues(flatObject)
        const payload = Object.entries(flatObject2).map(([key, value]) => `${sanitizeForNeo4jPropertyName(key)}: ${JSON.stringify(value)}`).join(", ")
        return `(n: ${node.label} {${payload}})`
    })
    return nodes
  }   ;

export async function getOrCreateNeo4jGraph() {
    if (!neo4jGraph) {
        const NEO4J_URL = process.env.NEO4J_URL;
        const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
        const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

        neo4jGraph = await Neo4jGraph.initialize({
            url: NEO4J_URL,
            username: NEO4J_USERNAME,
            password: NEO4J_PASSWORD,
        });
    }
    return neo4jGraph;
}

async function clearNeo4jGraph(graph) {
    await graph.query(`match (m)-[r]-(n) delete m,n,r`)
    await graph.query(`match (n) delete n;`)
    graph.refreshSchema()
}

export async function populateNeo4jGraph(graph) {
    const nodeData = graph.nodes
    const edgeData = graph.edges
    const neo4jGraph = await getOrCreateNeo4jGraph();
    await clearNeo4jGraph(neo4jGraph)
    const createNodeStmts = prepareDataForNeo4j(nodeData).map(stmt => `CREATE ${stmt}`)
    const edgeCreationStmts = edgeData.map(edge => `match (n {id: "${edge.from}"}), (m {id: "${edge.to}"}) create (n)-[r:${edge.type} {id: "${edge.from}-${edge.to}"}]->(m)`)
    await Promise.all(createNodeStmts.map(async (stmt) => {
        try {
            await neo4jGraph.query(stmt)
        } catch (error) {
            console.error(stmt)
        }
    }))
    await Promise.all(edgeCreationStmts.map(async (stmt) => {
        try {
            await neo4jGraph.query(stmt)
        } catch (error) {
            console.error(stmt)
        }
    }))
    await neo4jGraph.refreshSchema()
}