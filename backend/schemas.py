from typing import Optional, List
from pydantic import BaseModel


class SessionUser(BaseModel):
    userId: str
    displayName: str
    email: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    displayName: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: SessionUser


class LoginResponse(BaseModel):
    user: SessionUser


class Food(BaseModel):
    foodId: str
    foodName: str
    category: str
    servingSize: float
    servingUnit: str
    caloriesPerServing: int
    proteinPerServing: float
    fatPerServing: float
    carbPerServing: float
    isCustom: bool
    createdBy: str
    createdAt: str
    updatedAt: str


class FoodCreate(BaseModel):
    foodName: str
    category: str
    servingSize: float
    servingUnit: str
    caloriesPerServing: int
    proteinPerServing: float
    fatPerServing: float
    carbPerServing: float
    isCustom: bool = False


class FoodUpdate(BaseModel):
    foodName: Optional[str] = None
    category: Optional[str] = None
    servingSize: Optional[float] = None
    servingUnit: Optional[str] = None
    caloriesPerServing: Optional[int] = None
    proteinPerServing: Optional[float] = None
    fatPerServing: Optional[float] = None
    carbPerServing: Optional[float] = None
    isCustom: Optional[bool] = None


class FoodListResponse(BaseModel):
    items: List[Food]
    total: int
    page: int
    totalPages: int


class Record(BaseModel):
    recordId: str
    userId: str
    mealType: str
    recordDate: str
    foodName: str
    foodId: Optional[str] = None
    servingAmount: float
    calories: int
    protein: float
    fat: float
    carbohydrate: float
    note: str = ""
    createdAt: str
    updatedAt: str


class RecordCreate(BaseModel):
    mealType: str
    recordDate: str
    foodName: str
    foodId: Optional[str] = None
    servingAmount: float
    calories: int
    protein: float = 0
    fat: float = 0
    carbohydrate: float = 0
    note: str = ""


class RecordUpdate(BaseModel):
    mealType: Optional[str] = None
    recordDate: Optional[str] = None
    foodName: Optional[str] = None
    foodId: Optional[str] = None
    servingAmount: Optional[float] = None
    calories: Optional[int] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrate: Optional[float] = None
    note: Optional[str] = None


class DailySummary(BaseModel):
    totalCalories: int
    totalProtein: float
    totalFat: float
    totalCarb: float


class RangeSummaryItem(BaseModel):
    date: str
    totalCalories: int
    totalProtein: float
    totalFat: float
    totalCarb: float
    hasData: bool


class UserProfile(BaseModel):
    userId: str
    displayName: str
    email: str
    gender: Optional[str] = None
    age: Optional[int] = None
    heightCm: Optional[float] = None
    weightKg: Optional[float] = None
    activityLevel: str
    dietGoal: str
    targetCalories: int
    targetProtein: float
    targetFat: float
    targetCarb: float


class ProfileUpdate(BaseModel):
    displayName: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    heightCm: Optional[float] = None
    weightKg: Optional[float] = None
    activityLevel: Optional[str] = None
    dietGoal: Optional[str] = None
    targetCalories: Optional[int] = None
    targetProtein: Optional[float] = None
    targetFat: Optional[float] = None
    targetCarb: Optional[float] = None


class Announcement(BaseModel):
    id: str
    title: str
    content: str
    startDate: str
    endDate: str
    isActive: bool
    createdAt: str
    updatedAt: str


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    startDate: str
    endDate: str
    isActive: bool = True


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    isActive: Optional[bool] = None


class AdminStats(BaseModel):
    todayActiveCount: int
    todayRecordCount: int
    weekRecordCount: int
    foodDbCount: int
    topFoods: List[dict]
    todayUsers: List[dict]


class AdminUser(BaseModel):
    userId: str
    displayName: str
    email: str
    role: str
    isActive: bool
    createdAt: str
    lastLoginAt: Optional[str] = None


class AdminRecord(BaseModel):
    recordId: str
    userId: str
    mealType: str
    recordDate: str
    foodName: str
    foodId: Optional[str] = None
    servingAmount: float
    calories: int
    protein: float
    fat: float
    carbohydrate: float
    note: str = ""
    createdAt: str
    updatedAt: str
    displayName: str
    userEmail: str


class MessageResponse(BaseModel):
    success: bool
    message: str


class LogEntry(BaseModel):
    timestamp: str
    user: str
    action: str
    detail: str
