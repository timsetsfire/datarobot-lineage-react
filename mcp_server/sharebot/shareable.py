from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, Type
import datarobot as dr
import datetime

class AssetType(Enum):
    USE_CASE = "USE_CASE"
    DEPLOYMENT = "DEPLOYMENT"
    CUSTOM_MODEL = "CUSTOM_MODEL"
    REGISTERED_MODEL = "REGISTERED_MODEL"
    APPLICATION = "APPLICATION"
    NO_CODE_APPLICATION = "NO_CODE_APPLICATION"

class DataRobotShareable(ABC):
    def __init__(self, asset_id: str, asset_type: AssetType, asset_name: str, asset_created_at: str):
        self.asset_id = asset_id
        self.asset_type = asset_type
        self.client = dr.Client()
        self.name = asset_name
        self.created_at = asset_created_at

    @abstractmethod
    def share(self, username: str, role: str) -> int:
        """
        Share the asset with a specified user.
        
        :param username: The username of the user to share with
        :param role: The role to assign to the user
        """
        pass

    @abstractmethod
    def check_user_share(self, username: str): 
        pass
    
    @abstractmethod
    def get_uri(self)-> str:
        pass



def datarobot_shareable_encoder(obj: DataRobotShareable) -> Dict[str, Any]:
    if isinstance(obj, DataRobotShareable):
        return {
            "class_name": obj.__class__.__name__,
            "asset_id": obj.asset_id,
            "asset_name": obj.name,
            "asset_created_at": obj.created_at,
            "asset_uri": obj.get_uri()
        }
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def datarobot_shareable_decoder(json_dict: Dict[str, Any], class_name: Type[DataRobotShareable]) -> DataRobotShareable:
    # class_type = class_map[class_name]
    return class_name(
        asset_id=json_dict["asset_id"],
        name=json_dict["asset_name"],

        created_at=json_dict["asset_created_at"]
    )