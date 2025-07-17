from typing import List, Dict
import datarobot as dr
from .shareable import DataRobotShareable, AssetType
import asyncio
import requests as r


class UseCase(DataRobotShareable):

    def __init__(self, asset_id: str, name: str, created_at: str):
        super().__init__(asset_id, AssetType.USE_CASE, asset_name=name, asset_created_at=created_at)

    def share(self, username: str, role: str = dr.enums.SHARING_ROLE.CONSUMER) -> int:
        url = f"useCases/{self.asset_id}/sharedRoles/"
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
            print(f"Successfully shared UseCase {self.asset_id} with user {username}")
            return {"status_code": 204, "status_message": f"Successfully shared Use Case {self.asset_id} with user {username}"}
        else:
            print(f"Failed to share UseCase. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return {"status_code": response.status_code, "status_message": response.text}
        

    def check_user_share(self, username: str): 
        url = f"useCases/{self.asset_id}/sharedRoles/"
        all_users = []
        params = {
            "limit": 100, 
            "offset": 0
        }
        def unpack_users(url):
            resp = self.client.get(url, params=params)
            resp_data = resp.json()
            data = resp_data['data']
            [all_users.append(u) for u in data]
            if resp_data['next']:
                params['offset'] += 100
                unpack_users(url)
        unpack_users(url)
        c = any(map(lambda row: row['name'] == username, all_users))
        return c 

    def get_uri(self):
        # https://app.datarobot.com/usecases/6682c5591e2d342acd004f45/overview/recent
        return self.client.endpoint.replace("/api/v2", "") + f"/usecases/{self.asset_id}/overview/recent"

        
    @staticmethod
    async def list() -> List['UseCase']:
        client = dr.Client()
        api_resp = client.get("useCasesWithShortenedInfo/").json()['data']
        return [UseCase(d['id'], d['name'], d['createdAt']) for d in sorted(api_resp, key=lambda d: d['createdAt'], reverse=True)]
    
