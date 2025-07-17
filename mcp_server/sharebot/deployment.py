from typing import List, Dict
import datarobot as dr
from .shareable import DataRobotShareable, AssetType
import asyncio


class Deployment(DataRobotShareable):
    def __init__(self, asset_id: str, name: str, created_at: str):
        super().__init__(asset_id, AssetType.DEPLOYMENT, asset_name=name, asset_created_at=created_at)

    def share(self, username: str, role: str = "USER") -> dict:
        
        url = f"deployments/{self.asset_id}/sharedRoles/"
        payload = {
            "operation": "updateRoles",
            "roles": [
                {
                    "shareRecipientType": "user",
                    "role": role,
                    "username": username
                }
            ]
        }
        
        response = self.client.patch(url, json=payload)
        
        if response.status_code == 204:
            print(f"Successfully shared deployment {self.asset_id} with user {username}")
            return {"status_code": 204, "status_message": f"Successfully shared deployment {self.asset_id} with user {username}"}
            
        else:
            print(f"Failed to share deployment. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return {"status_code": response.status_code, "status_message": response.text}
        

    def check_user_share(self, username: str): 
        url = f"deployments/{self.asset_id}/sharedRoles/"
        params = {
            "name": username
        }
        resp = self.client.get(url, params=params)
        data = resp.json()
        if data['totalCount'] == 1:
            return True
        else: 
            return False

    def get_uri(self):
        # https://app.datarobot.com/console-nextgen/deployments/668d576dc4b2a0f9d1bb0364/overview
        return self.client.endpoint.replace("/api/v2", "") + f"/console-nextgen/deployments/{self.asset_id}/overview"

    @staticmethod
    async def list() -> List['Deployment']:
        client = dr.Client()
        api_deployments = client.get("deployments/").json()['data']
        return [Deployment(d['id'], d['label'], d['createdAt']) for d in sorted(api_deployments, key=lambda d: d['createdAt'], reverse=True)]
    
