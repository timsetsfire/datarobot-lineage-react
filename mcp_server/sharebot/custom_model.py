from typing import List, Dict
import datarobot as dr
from .shareable import DataRobotShareable, AssetType
import asyncio


class CustomModel(DataRobotShareable):


    def __init__(self, asset_id: str, name: str, created_at: str):
        super().__init__(asset_id, AssetType.CUSTOM_MODEL, asset_name=name, asset_created_at=created_at)

    def share(self, username: str, role: str = "READ_ONLY") -> int:
        role = 'READ_ONLY'
        try:
            client = dr.Client()
            resp = client.patch(f'''customModels/{self.asset_id}/accessControl/''', json={
                'data': [{'role': role, 'username': username}]
            })
            print(f"Successfully shared Custom Model {self.asset_id} with user {username}")
            return dict(status_code = 204, status_message = f"Successfully shared Custom Model {self.asset_id} with user {username}")
        except dr.errors.ClientError as e:
            print(f"Failed to share Custom Model")
            print(e)
            return dict(status_code = "error", status_message = f"Failed to share Custom Model.  Exception: {e}")

    def check_user_share(self, username: str): 
        url = f'''customModels/{self.asset_id}/accessControl/'''
        resp = self.client.get(url)
        data = resp.json()['data']
        return any(map(lambda row: row['username'] == username, data))

    def get_uri(self):
        # https://app.datarobot.com/registry/custom-model-workshop/66c7933c42eff7c567ebb067/assemble
        return self.client.endpoint.replace("/api/v2", "") + f"/registry/custom-model-workshop/{self.asset_id}/assemble"

    @staticmethod
    async def list() -> List['CustomModel']:
        client = dr.Client()
        api_resp = client.get("customModels/").json()['data']
        result =  [CustomModel(d['id'], d['name'], d['latestVersion']['created']) for d in sorted(api_resp, key=lambda d: d['latestVersion']['created'], reverse=True)]
        return result
    
