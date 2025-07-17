from dotenv import load_dotenv
load_dotenv(dotenv_path="../.env", override = True)

from starlette.applications import Starlette
from starlette.routing import Mount, Host
from starlette.responses import JSONResponse, Response, PlainTextResponse, HTMLResponse
from starlette.routing import Route
from mcp.server.fastmcp import FastMCP

from openai import AsyncOpenAI
from prompts import SYSTEM_PROMPT_PLOTLY_CHART, PLOTLY_PROMPT_TEMPLATE, TEXT2CYPHER_PROMPT_TEMPLATE
from utils import parse_code
import pandas as pd
import os
import json
from io import StringIO

from plotly.utils import PlotlyJSONEncoder
import os
import yaml
import logging
import pandas as pd
import datarobot as dr 
from rapidfuzz import process
import markdown
from openai import OpenAI
from typing import Union, Any
from pathlib import Path
from utils import *
import datarobot as dr 
from sharebot import *
from bson.objectid import ObjectId

FILE_PATH = Path(__file__)
print(FILE_PATH.absolute())
CACHE_DIR = FILE_PATH.parent.parent / ".cache"
print(CACHE_DIR)



token = os.environ.get("DATAROBOT_API_TOKEN")
endpoint = os.environ.get("DATAROBOT_ENDPOINT")

mcp = FastMCP("MLOPS MCP 🚀")



@mcp.tool()
def share(asset_type: str, asset_id: str, username: str, use_case_id: str = None) -> dict:
    """share an asset with a datarobot user.  this will always share with a default role of READ_ONLY or USER.
    
    Args:
        asset_type (str): the asset type you are sharing. Possible values 'customApplications', 'customModels', 'datasets', 'deployments', 'registeredModels'
        asset_id (str): this id of the asset that you need to share.  
        username (str): this is the username that the assest should be shared with
        use_case_id (str): this is the id of the use case. This is not required for asset types 'customApplications', 'customModels', 'datasets', 'deployments', 'registeredModels'

    Returns: 
        dict:
            status_code: the status code of the response.  204 means successful.  Anything means something went wrong.
            status_message: message related to the status code.
    """ 

    ## validate id as bson 
    try:
        if use_case_id:
            object_id = ObjectId(use_case_id)
        else: 
            object_id = ObjectId(asset_id)
    except Exception as e:
        return {"status_code": 404, "status_message": f"{asset_id} is not a valid id for {asset_type}.  query the use case id and try again."}
    if asset_type in ['customApplications', 'customModels', 'datasets', 'deployments', 'registeredModels']:
        client = dr.Client(token = token, endpoint = endpoint)
        if asset_type == "customApplications":
            asset = CustomApplication(asset_id, asset_type, "dummy_create_date")
        elif asset_type == "customModels":
            asset = CustomModel(asset_id, asset_type, "dummy_create_date")
        elif asset_type == "deployments":
            asset = Deployment(asset_id, asset_type, "dummy_create_date") 
        elif asset_type == "registeredModels":
            asset = RegisteredModel(asset_id, asset_type, "dummy_create_date")  
        elif asset_type == "datasets":
            asset = Dataset(asset_id, asset_type, "dummy_create_date")  
    elif asset_type in ["recipes", "projects", "models", "datasets", "applications"]:
        if use_case_id:
            asset = UseCase(use_case_id, "useCase", "dummy_create_date") 
        else:
            return {"status_code": "error", "status_message": f"the use_case_id must be provided along with the id for {asset_type}.  query the use case id and try to share again."}
    resp = asset.share(username)
    return resp


@mcp.tool()
def execute_cypher(cypher_query: str) -> dict:
    """runs cypher query and returns result.
    
    Args:
        cypher_query (str): the cypher query to run against supported graph db (kuzu or neo4j)

    Returns: 
        dict:
            - result: dict
    """
    graphdb = os.environ.get("GRAPHDB")
    if graphdb == "neo4j":
        from langchain_neo4j import Neo4jGraph
        NEO4J_URI = os.environ.get("NEO4J_URL")
        NEO4J_USERNAME = "neo4j"
        NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD")
        graph = Neo4jGraph(url=NEO4J_URI, username=NEO4J_USERNAME, password=NEO4J_PASSWORD)
    elif graphdb == "kuzu":
        import kuzu
        from langchain_kuzu.graphs.kuzu_graph import KuzuGraph
        kuzu_path = os.environ.get("KUZU_PATH")
        gdb = kuzu.Database(kuzu_path)
        conn = kuzu.Connection(gdb)
        graph = KuzuGraph(db = gdb, allow_dangerous_requests=True)
    try:
        return dict(type = "data", result = graph.query(cypher_query))
    except Exception as e:
        return dict(result = f"there was an error {e}.  you probably should validate that the query is ")
    
@mcp.tool()
def text2cypher(query_text) -> dict:
    """Converts query_text to a Cypher query using an LLM.  You will need to use this tool when you are asked anything that might be specific to a system or database.  For example, what types of assets are available?  What is the relationship between different assets, etcs

    Args:
        query_text (str): The natural language query used to search the Neo4j database.
        prompt_params (Dict[str, Any]): additional values to inject into the custom prompt, if it is provided. If the schema or examples parameter is specified, it will overwrite the corresponding value passed during initialization. Example: {'schema': 'this is the graph schema'}


    Returns:
        dict: 
            - type: code
            - codeType: the type of data returned, which will be "cypher".
            - code: string containing the generate cypher
    """
    graphdb = os.environ.get("GRAPHDB")
    if graphdb == "neo4j":
        from langchain_neo4j import Neo4jGraph
        NEO4J_URI = os.environ.get("NEO4J_URL")
        NEO4J_USERNAME = "neo4j"
        NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD")
        graph = Neo4jGraph(url=NEO4J_URI, username=NEO4J_USERNAME, password=NEO4J_PASSWORD)
    elif graphdb == "kuzu":
        import kuzu
        from langchain_kuzu.graphs.kuzu_graph import KuzuGraph
        kuzu_path = os.environ.get("KUZU_PATH")
        gdb = kuzu.Database(kuzu_path)
        conn = kuzu.Connection(gdb)
        graph = KuzuGraph(db = gdb, allow_dangerous_requests=True)
    graph.refresh_schema()

    text2cypher_prompt = TEXT2CYPHER_PROMPT_TEMPLATE.render(schema = graph.schema, examples = None, query_text = query_text)
    client = OpenAI(
        base_url="https://app.datarobot.com/api/v2/deployments/682cb3448a869c36cea3a77f",
        api_key=os.environ["DATAROBOT_API_TOKEN"],
    )
    response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": text2cypher_prompt}
            ]
        )
    cypher_code = response.choices[0].message.content
    cypher_code = extract_cypher(cypher_code)
    return dict(type = "cypher", result = cypher_code)

@mcp.tool()
def generate_plotly(prompt: str, path: str) -> dict:
    """use this function to generate a plotly chart based on a prompt.  The prompt should be a description of the chart you want to generate.  The path is the path of the data that the chart code will be execute against.
    This will return a dictionary containing the plotly chart code, the execute chart as html, which can be rendered in a web page, and a cache_id which will be the cached id of the plotly chart.

    Args:
        prompt: the prompt that will be used to gernate code which will be run to generate a plotly chart
        path: path to the data that the chart code will be executed against

    Returns:
        dict: 
            - plotType: the type of data returned, which will be "plotly" for plotly charts.
            - plotPath: path to the plotly chart json file that can be used to render the chart in a web page.


    """
    try:
        client = OpenAI(
            base_url="https://app.datarobot.com/api/v2/deployments/682cb3448a869c36cea3a77f",
            api_key=os.environ["DATAROBOT_API_TOKEN"],
        )

        df = pd.read_csv(path) 
        buffer = StringIO()
        df.info(buf=buffer)
        info_str = buffer.getvalue()
        plotly_prompt = PLOTLY_PROMPT_TEMPLATE.render(question = prompt, dataframe =df.head().to_csv(index = False), metadata = info_str)
        plotly_code = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_PLOTLY_CHART},
                {"role": "user", "content": plotly_prompt}
            ]
        )
        response = plotly_code.choices[0].message.content
        parsed_python_code = parse_code(response, code = "python")
        local_namespace = {}
        exec(parsed_python_code, {}, local_namespace)
        func = local_namespace.get("create_charts")
        plotly_json =  func(df).to_plotly_json()
        output_path = CACHE_DIR / "plotly_chart.json"
        with open(output_path, "w") as f:
            json.dump(plotly_json, f, cls=PlotlyJSONEncoder)
        return {
            "type": "plotly",
            "code": parsed_python_code,
            "path": output_path,
            }
    except Exception as e:
        print(f"Error generating plotly chart: {e}")
        return {"error": f"""there was an error generating the plolty chart.  Please try again but maybe add the error so the llm can try better.  Here is the error: {e}"""}

@mcp.tool()
def deployment_health_check(deployment_id: str) -> dict:
    """use this to check the health of a deployment.  will return a dictionary containing info on model health (drift and accuray) as well as service health.  only use this if you have an available deployment id

    Args:
        deployment_id: the id of the datarobot deployment to check
    """
    client = dr.Client(token = token, endpoint = endpoint)
    logging.info(f"deployment health check called with id {deployment_id}")
    try:
        deployment = dr.Deployment.get(deployment_id)
        model_health = deployment.model_health
        service_health = deployment.service_health 
        accuracy_health = deployment.accuracy_health
        return dict( service_health = service_health, model_health = model_health, accuracy_health = accuracy_health)
    except Exception as e:
        logging.error(e)
        return dict (error = str(e), message = "something went wrong when retreiving the health with deployment id {deployment_id}. The error is {e}")

# @mcp.tool()
# def deployment_look_up(deployment_name: str) -> list: 
#     """use this function to find a list of deployments that "match" the provided deployment_name. 
#        will return a list of dictionaries, were each dictionary has keys name and id.  name corresponds to the deployment name and id corresponds to the deployment id

#     Args:
#         deployment_name: the name of the datarobot deployment to look up
#     """
#     try:
#         logging.info(f"deployment look up called with name {deployment_name}")
#         client = dr.Client(token = token, endpoint = endpoint)
#         deployments = dr.Deployment.list(search = deployment_name)
#         logging.info(f"found {len(deployments)} deployments with name {deployment_name}")
#         logging.info(deployments)
#         return [dict(name = dep.label, id = dep.id) for dep in deployments]
#     except Exception as e:
#         logging.error(e)
#         return dict (error = str(e), message = "deployment name not found?  are you sure you performed a deployment look up?")

@mcp.tool()
def retrieve_model_feature_impact(model_id: str, project_id: str) -> dict:
    """retrieve the feature impact for a given datarobot model.  The feature impact tells you what features are most impactiful for accurate predictions.  A csv of feature impact is returned with first column is the feature name and second is the feature impact.  The csv is sorted in descending order based on feature ipact
    
    Args:
        model_id: the id of the datarobot model to retrieve feature impact for
        project_id: the id of the datarobot project that contains the model

    Return: 
        dict:
            type: dataset 
            path: path to dataset
    """
    client = dr.Client(token = token, endpoint = endpoint)
    model = dr.Model.get(project_id, model_id)
    feature_impact = model.get_or_request_feature_impact() 
    output_path = str(CACHE_DIR / "feature_impact.csv")
    feature_impact_df = pd.DataFrame(feature_impact).sort_values("impactNormalized", ascending=False)[["featureName", "impactNormalized"]]
    feature_impact_df.to_csv(output_path, index = False)
    return dict( type = "data", path = output_path)

@mcp.tool()
def retrieve_model_feature_effect(model_id: str, project_id: str) -> list:
    """retrieve the feature effects aka partial dependence for a given datarobot model.  The partial dependence shows marginal effect of a feature on the target variable after accounting for the average effects of all other predictive features.  It indicates how, holding all other variables except the feature of interest as they were, the value of this feature affects your prediction.   
    
    Args:
        model_id: the id of the datarobot model to retrieve feature effects for
        project_id: the id of the datarobot project that contains the model
    """
    client = dr.Client(token = token, endpoint = endpoint)
    model = dr.Model.get(project_id, model_id)                
    if isinstance(model, dr.DatetimeModel):
        feature_effect = model.get_or_request_feature_effect(source = "validation", backtest_index = "0")
    else:
        feature_effect = model.get_or_request_feature_effect(source = "validation")
    return feature_effect.feature_effects

def render_with_style(markdown_text):
    html_body = markdown.markdown(markdown_text)
    return f"""
    <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');
                body {{
                    font-family: 'Roboto Mono', monospace;
                    padding: 2rem;
                    background: #f9f9f9;
                    color: #333;
                }}
                h1, h2, h3 {{
                    color: #2c3e50;
                }}
            </style>
        </head>
        <body>
            {html_body}
        </body>
    </html>
    """

async def homepage(request):
    tools = await mcp.list_tools() 
    show = ["# MCP Servier is running",  "##Tools available"]
    show.extend( [f"\n###{tool.name}\n{tool.description}" for tool in tools])
    md_text = "\n".join(show)
    return HTMLResponse(render_with_style(md_text))

# Mount the SSE server to the existing ASGI server
app = Starlette(
    routes=[
        Route('/', homepage),
        Mount('/', app=mcp.sse_app()),
    ]
)

# or dynamically mount as host
app.router.routes.append(Host('mcp.server', app=mcp.sse_app()))

