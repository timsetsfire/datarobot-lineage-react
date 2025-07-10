import { AzureChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { GraphCypherQAChain } from "@langchain/community/chains/graph_qa/cypher"
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { StateGraph, MessagesAnnotation, END, START, MemorySaver } from "@langchain/langgraph";
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {SSEClientTransport} from '@modelcontextprotocol/sdk/client/sse.js';
import {loadMcpTools} from '@langchain/mcp-adapters';
import dotenv from "dotenv";
import { getOrCreateNeo4jGraph } from "./gdb.js";

dotenv.config();
// const { AzureChatOpenAI } = require("@langchain/openai");
// const { AIMessage, HumanMessage, SystemMessage } = require("@langchain/core/messages");
// const { tool } = require('@langchain/core/tools');
// const { z } = require('zod');
// const { Neo4jGraph } = require("@langchain/community/graphs/neo4j_graph");
// const { GraphCypherQAChain } = require("@langchain/community/chains/graph_qa/cypher");
// const { ToolNode } = require('@langchain/langgraph/prebuilt');
// const { StateGraph, MessagesAnnotation, END, START } = require("@langchain/langgraph");

const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
const AZURE_OPENAI_API_INSTANCE_NAME = process.env.AZURE_OPENAI_API_INSTANCE_NAME;
const AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o"
const NEO4J_URL = process.env.NEO4J_URL;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const MCP_PORT = process.env.MCP_PORT || 8000;

let agent = null;

export async function getOrCreateGraphChatAgent() {

    if (!agent) {

        // initialize mcp client 

        const sseClient = new Client({name: 'dr tools', version: '0.1.0'});
        const url = new URL(`http://0.0.0.0:${MCP_PORT}/sse`)
        const transport = new SSEClientTransport(url );
        await sseClient.connect(transport);
        const mcpTools = await loadMcpTools('dr tools', sseClient)

        const llm = new AzureChatOpenAI({
            model: "gpt-4o",
            azureOpenAIEndpoint: AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: AZURE_OPENAI_API_KEY,
            azureOpenAIApiVersion: AZURE_OPENAI_API_VERSION,
            azureOpenAIApiInstanceName: AZURE_OPENAI_API_INSTANCE_NAME,
            azureOpenAIApiDeploymentName: AZURE_OPENAI_DEPLOYMENT_NAME,
        })

        const graph = await getOrCreateNeo4jGraph()

        await graph.refreshSchema();

        const graphCypherQAChain = GraphCypherQAChain.fromLLM({ cypherLLM: llm, qaLLM: llm, graph: graph, verbose: true, returnIntermediateSteps: true });

        const queryGraph = tool(async (input) => {
            console.log("in query_graph_database tool")
            console.log(`input has value ${input.query}`)
            let res = await graphCypherQAChain.invoke({ query: input.query });
            try {
                return { userQuery: input.query, cypherQL: res.intermediateSteps[0].query, context: JSON.stringify(res.intermediateSteps[1].context) }
            } catch {
                return { userQuery: input.query, cypherQL: res.intermediateSteps[0].query, context: JSON.stringify([]) }
            }
        }, {
            name: 'query_graph_database',
            description: 'this tool queries the graph database and should be used when asked questions about relationships between item.  You might also use this to grab necessary ids such as model ids, project ids, deployment ids, etc',
            schema: z.object({
                query: z.string().describe("The user query that should be passed to the graph chain"),
            })
        })

        const interpretResults = tool(async (input) => {
            console.log("in interpret_result tool")
            let aiMessage = new AIMessage({ content: `assume that context contains the answer to userQuery\nuserQuery: ${input.userQuery}\ncontext: ${input.context}\n\nyour answer:` })
            let res = await llm.invoke([aiMessage])
            return res
        },
            {
                name: 'interpret_results',
                description: 'use this tool to systhesis and interpret results that are obtained from query_graph_database tool',
                schema: z.object({
                    userQuery: z.string().describe("The original user query"),
                    context: z.string().describe("context obtained from the graph query"),
                })
            })

        const tools = [queryGraph, interpretResults, ...mcpTools]

        const llmWithTools = new AzureChatOpenAI({
            model: "gpt-4o",
            azureOpenAIEndpoint: AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: AZURE_OPENAI_API_KEY,
            azureOpenAIApiVersion: AZURE_OPENAI_API_VERSION,
            azureOpenAIApiInstanceName: AZURE_OPENAI_API_INSTANCE_NAME,
            azureOpenAIApiDeploymentName: AZURE_OPENAI_DEPLOYMENT_NAME,
        }).bindTools(tools);

        const toolNodeForGraph = new ToolNode(tools)

        const shouldContinue = (state) => {
            const { messages } = state;
            const lastMessage = messages[messages.length - 1];
            if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls?.length) {
                return "tools";
            }
            return END;
        }

        const callModel = async (state) => {
            const { messages } = state;
            const response = await llmWithTools.invoke(messages);
            return { messages: response };
        }

        const workflow = new StateGraph(MessagesAnnotation).addNode("agent", callModel).addNode("tools", toolNodeForGraph).addEdge(START, "agent").addConditionalEdges("agent", shouldContinue, ["tools", END]).addEdge("tools", "agent")
        const checkpointer = new MemorySaver();
        agent = workflow.compile({checkpointer})
    }
    return agent
}