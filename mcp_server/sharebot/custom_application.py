from typing import List, Dict
import datarobot as dr
from .shareable import DataRobotShareable, AssetType
import asyncio


class CustomApplication(DataRobotShareable):

    def __init__(self, asset_id: str, name: str, created_at: str):
        super().__init__(asset_id, AssetType.APPLICATION, asset_name=name, asset_created_at=created_at)

    def share(self, username: str, role: str = "CONSUMER") -> int:
        role = 'CONSUMER'
        try:
            client = dr.Client()
            resp = client.patch(f'''customApplications/{self.asset_id}/sharedRoles/''', json={'operation': 'updateRoles', 
                'roles':[{'shareRecipientType':'user', 'role': 'CONSUMER', 'username': username}]
            })
            print(f"Successfully shared Custom Application {self.asset_id} with user {username}")
            return dict(status_code = 204, status_message = f"Successfully shared Custom Application {self.asset_id} with user {username}")
        except dr.errors.ClientError as e:
            print(f"Failed to share Custom Application")
            print(e)
            return dict(status_code = "error", status_message = f"Failed to share Custom Application.  Exception: {e}")

    def check_user_share(self, username: str): 
        url = f"customApplications/{self.asset_id}/sharedRoles/"
        params = {
            "name": username
        }
        resp = self.client.get(url, params=params)
        data = resp.json()
        if data['totalCount'] == 1:
            return True
        else: 
            return False

    def get_uri(self) -> str:
        resp = self.client.get(f"customApplications/{self.asset_id}")
        return resp.json()['applicationUrl']
    

    @staticmethod
    async def list() -> List['CustomApplication']:
        client = dr.Client()
        api_resp = client.get("customApplications/").json()['data']
        result =  [CustomApplication(d['id'], d['name'], d['createdAt']) for d in sorted(api_resp, key=lambda d: d['createdAt'], reverse=True)]
        return result
    
