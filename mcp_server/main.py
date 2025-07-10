from starlette.applications import Starlette
from starlette.routing import Mount, Host
from starlette.responses import JSONResponse, Response, PlainTextResponse, HTMLResponse
from starlette.routing import Route
from mcp.server.fastmcp import FastMCP

import os
import yaml
import logging
import pandas as pd
import datarobot as dr 
from rapidfuzz import process
from dotenv import load_dotenv
import markdown

load_dotenv(dotenv_path="../.env", override = True)

token = os.environ.get("DATAROBOT_API_TOKEN")
endpoint = os.environ.get("DATAROBOT_ENDPOINT")

mcp = FastMCP("MLOPS MCP 🚀")

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
        return dict (error = str(e), message = "deployment id not found?  are you sure you performed a deployment look up?")

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

