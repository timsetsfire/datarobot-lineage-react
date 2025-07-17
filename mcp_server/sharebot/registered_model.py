from typing import List, Dict
import datarobot as dr
from .shareable import DataRobotShareable, AssetType
import asyncio


class RegisteredModel(DataRobotShareable):

    def __init__(self, asset_id: str, name: str, created_at: str):
        super().__init__(asset_id, AssetType.USE_CASE, asset_name=name, asset_created_at=created_at)

    def share(self, username: str, role: str = "USER") -> int:
        role = dr.enums.SHARING_ROLE.USER
        rm = dr.RegisteredModel.get(self.asset_id)
        try:
            rm.share(roles=[dr.SharingRole(role=role, share_recipient_type='user', username=username)])
            print(f"Successfully shared Registered Model {self.asset_id} with user {username}")
            return dict(status_code = 204, status_message = f"Successfully shared Registered Model {self.asset_id} with user {username}")
        except dr.errors.ClientError as e:
            print(f"Failed to share Registered Model")
            print(e)
            return dict(status_code = "error", status_message = f"Failed to share Registered Model.  Exception: {e}")


    def check_user_share(self, username: str): 
        url = f"registeredModels/{self.asset_id}/sharedRoles/"
        params = {
            "name": username
        }
        resp = self.client.get(url, params=params)
        data = resp.json()
        if data['totalCount'] == 1:
            return True
        else: 
            False
    
    def get_uri(self):
        # https://app.datarobot.com/registry/registered-models/66c76181dd9f05c02cec1271/info
        return self.client.endpoint.replace("/api/v2", "") + f"/registry/registered-models/{self.asset_id}/info"


    @staticmethod
    async def list() -> List['RegisteredModel']:
        client = dr.Client()
        api_resp = client.get("registeredModels/").json()['data']
        rms_to_share = filter(lambda rm: not rm['isGlobal'], api_resp )
        result =  [RegisteredModel(d['id'], d['name'], d['createdAt']) for d in sorted(rms_to_share, key=lambda d: d['createdAt'], reverse=True)]
        return result
    
