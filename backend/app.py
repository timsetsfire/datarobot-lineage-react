from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import logging
import datarobot as dr
import os
import json 
from pathlib import Path
from create_graph_from_use_case import build_graph, write_edges, write_nodes

logger = logging.getLogger(name = "backend-debugger")
logger.setLevel("INFO")
app = Flask(__name__)
CORS(app, origins = ["http://127.0.0.1:3000", "http://localhost:3000", "http://0.0.0.0:3000"])  # Enable CORS for all routes
local_storage = "./storage"

@app.route('/ping', methods=['GET'])
@cross_origin(origins = ["http://127.0.0.1:3000", "http://localhost:3000", "http://0.0.0.0:3000"])
def get_data():
    return jsonify({'message': 'pong'})

@app.route('/getUseCases', methods=['GET'])
@cross_origin(origins = ["http://127.0.0.1:3000", "http://localhost:3000", "http://0.0.0.0:3000"])
def get_use_cases():
    headers = request.headers 
    token = headers.get('Authorization', "").replace("Bearer ", "")
    endpoint = headers.get("Endpoint")
    client = dr.Client(token=token, endpoint=endpoint)
    use_cases = dr.UseCase.list()
    use_cases_list = [dict(name = u.name, id = u.id) for u in use_cases]
    return jsonify(use_cases_list)

@app.route("/getUseCaseGraph", methods = ["GET"])
@cross_origin(origins = ["http://127.0.0.1:3000", "http://localhost:3000", "http://0.0.0.0:3000"])
def build_use_case_graph():
    use_case_id = request.args.get("useCaseId")
    edge_output_file = os.path.join(local_storage,f"{use_case_id}_edges.json")
    node_output_file = os.path.join(local_storage,f"{use_case_id}_nodes.json")
    if Path(edge_output_file).exists():
        pass
    else:
        headers = request.headers 
        token = headers.get('token', "").replace("Bearer ", "")
        endpoint = headers.get("endpoint")
        try:
            client = dr.Client(token=token, endpoint=endpoint)
            nodes, edges = build_graph(client, use_case_id)
            write_edges(use_case_id, edges, edge_output_file)
            write_nodes(use_case_id, nodes, node_output_file)
        except Exception as e:
            return jsonify(f"{str(e)}")
    return jsonify(f"use case {use_case_id} retrieved successfully")

@app.route("/getEdges", methods = ["GET"])
@cross_origin(origins = ["http://127.0.0.1:3000", "http://localhost:3000", "http://0.0.0.0:3000"])
def get_edges():
    use_case_id = request.args.get("useCaseId")
    with open(os.path.join(local_storage,f"{use_case_id}_edges.json"), "r") as f:
        edges = json.load(f)
    return jsonify(edges)   

@app.route("/getNodes", methods = ["GET"])
@cross_origin(origins = ["http://127.0.0.1:3000", "http://localhost:3000", "http://0.0.0.0:3000"])
def get_nodes():
    use_case_id = request.args.get("useCaseId")
    with open(os.path.join(local_storage, f"{use_case_id}_nodes.json"), "r") as f:
        nodes = json.load(f)
    return jsonify(nodes)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)