from typing import List, Dict
import datarobot as dr
from .shareable import DataRobotShareable, AssetType
import asyncio


class Dataset(DataRobotShareable):
    def __init__(self, asset_id: str, name: str, created_at: str):
        super().__init__(asset_id, AssetType.DEPLOYMENT, asset_name=name, asset_created_at=created_at)

    def share(self, username: str, role: str = "CONSUMER") -> dict:
        client = dr.Client()
        dataset = dr.Dataset.get(self.asset_id)
        sharing_list = [dr.SharingAccess(username, role="CONSUMER", can_use_data=True)]
        
        try:
            dataset.share(sharing_list)
            return {"status_code": 204, "status_message": f"Successfully shared dataset {self.name} with id {self.asset_id} with user {username}"}
        except Exception as e:            
            print(f"Failed to share dataset. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return {"status_code": 404, "status_message": e}
        

    def check_user_share(self, username: str): 
        url = f"datasets/{self.asset_id}/sharedRoles/"
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
    async def list() -> List['Datasets']:
        client = dr.Client()
        api_datasets = client.get("datasets/").json()['data']
        return [Dataset(d['id'], d['label'], d['createdAt']) for d in sorted(api_datasets, key=lambda d: d['createdAt'], reverse=True)]
    
