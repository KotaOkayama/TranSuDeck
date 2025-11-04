from pydantic import BaseModel
from typing import Optional

class Slide(BaseModel):
    id: str
    content: str
    order: int
    title: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "slide-1",
                "content": "## Sample Slide\n\n- Point 1\n- Point 2",
                "order": 0,
                "title": "Sample Slide"
            }
        }
