from starlette.applications import Starlette
from starlette.routing import Mount, Host
from starlette.responses import JSONResponse, Response, PlainTextResponse, HTMLResponse
from starlette.routing import Route
from mcp.server.fastmcp import FastMCP

from openai import AsyncOpenAI
from prompts import SYSTEM_PROMPT_PLOTLY_CHART, PLOTLY_PROMPT_TEMPLATE
from utils import parse_code
import pandas as pd
import os
import json
from io import StringIO


import os
import yaml
import logging
import pandas as pd
import datarobot as dr 
from rapidfuzz import process
from dotenv import load_dotenv
import markdown
from openai import OpenAI
from typing import Union, Any

load_dotenv(dotenv_path="../.env", override = True)

token = os.environ.get("DATAROBOT_API_TOKEN")
endpoint = os.environ.get("DATAROBOT_ENDPOINT")

mcp = FastMCP("MLOPS MCP 🚀")

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
        plotly_prompt = PLOTLY_PROMPT_TEMPLATE.render(question = prompt, dataframe =df.to_csv(index = False), metadata = df.dtypes.to_dict())
        plotly_code = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_PLOTLY_CHART},
                {"role": "user", "content": plotly_prompt}
            ]
        )
        response = plotly_code.choices[0].message.content
        response = parse_code(response, code = "json")
        parsed_python_code = json.loads(response)
        local_namespace = {}
        exec(parsed_python_code["code"], {}, local_namespace)
        func = local_namespace.get("create_charts")
        so = StringIO()
        ## plotly figure 
        # func(df)["fig1"].to_json()
        plotly_json =  func(df)["fig1"].to_json()
        plotly_json =  func(df)["fig1"].to_plotly_json()
        with open("../.cache/plotly_chart.json", "w") as f:
            json.dump(plotly_json, f)
        return {
            "plotType": "plotly", 
            "plotPath": "./.cache/plotly_chart.json",
            }
    except Exception as e:
        print(f"Error generating plotly chart: {e}")
        return {"error": f"""there was an error generating the plolty chart.  Please try again but maybe add the error so the llm can try better.  Here is the error: {e}"""}


@mcp.tool()
def deployment_health_check(deployment_id: str) -> dict:
    """use this to check the health of a deployment.  will return a dictionary containing info on model health (drift and accuray) as well as service health.

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
def retrieve_model_feature_impact(model_id: str, project_id: str) -> str:
    """retrieve the feature impact for a given datarobot model.  The feature impact tells you what features are most impactiful for accurate predictions.  A csv of feature impact is returned with first column is the feature name and second is the feature impact.  The csv is sorted in descending order based on feature ipact
    
    Args:
        model_id: the id of the datarobot model to retrieve feature impact for
        project_id: the id of the datarobot project that contains the model
    """
    client = dr.Client(token = token, endpoint = endpoint)
    model = dr.Model.get(project_id, model_id)
    feature_impact = model.get_or_request_feature_impact() 
    feature_impact_df = pd.DataFrame(feature_impact).sort_values("impactNormalized", ascending=False)[["featureName", "impactNormalized"]]
    return feature_impact_df.to_csv(index = False)

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

