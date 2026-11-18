from typing import List, Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = ""
    ward: Optional[str] = "Ward 4 - Central Promenade"

class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = ""
    ward: Optional[str] = ""
    department: Optional[str] = ""
    status: Optional[str] = "active"

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class LocationSchema(BaseModel):
    lat: float
    lng: float
    address: str
    ward: Optional[str] = "Ward 4 - Central Promenade"
    landmark: Optional[str] = ""

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    priority: Optional[str] = "Medium"
    location: LocationSchema
    images: Optional[List[str]] = []
    isAnonymous: Optional[bool] = False
    citizenId: Optional[str] = "user_citizen_1"
    citizenName: Optional[str] = "Citizen"

class ComplaintResponse(BaseModel):
    id: str
    ticketNumber: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    location: LocationSchema
    images: List[str]
    citizenId: str
    citizenName: str
    isAnonymous: bool
    departmentAssigned: str
    officerAssigned: str
    upvotes: int
    createdAt: str
    updatedAt: str

class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = ""
    officerId: Optional[str] = ""
    officerName: Optional[str] = ""

class FeedbackCreate(BaseModel):
    rating: int
    comments: Optional[str] = ""
    citizenName: Optional[str] = "Citizen"

class AIAnalyzeRequest(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    imageBase64: Optional[str] = None
    location: Optional[LocationSchema] = None

class AIAnalyzeResponse(BaseModel):
    detectedCategory: str
    suggestedPriority: str
    recommendedDepartment: str
    fakeScore: int
    isFakeOrSpam: bool
    duplicateFound: bool
    duplicateComplaintId: Optional[str] = None
    summary: str
    keyKeywords: List[str]

class AIChatRequest(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    reply: str

class SimilarityMatch(BaseModel):
    ticketNumber: str
    title: str
    category: str
    ward: str
    status: str
    similarityScore: int

class AISimilarityRequest(BaseModel):
    imageBase64: Optional[str] = None
    category: Optional[str] = None
    ward: Optional[str] = None
