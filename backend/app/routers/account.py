"""
Phase 11 — Account, Authentication & User Engagement Endpoints.
AST-XGB Real Estate Platform (GharDhundo)

Implements backend-managed authentication, server-side PBKDF2-SHA256 password hashing,
session-token authentication, rate-limited property inquiries, saved property sync,
and persistent owner listing management.
"""

import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Request, status, Depends
from pydantic import BaseModel, Field, EmailStr
from backend.app.services.db_service import (
    UserService,
    SessionService,
    SavedPropertiesService,
    InquiryService,
    OwnerListingService,
)

router = APIRouter(prefix="/api/v1", tags=["Account & User Engagement"])


# ================= SCHEMAS =================

class SignupRequest(BaseModel):
    email: str = Field(..., example="buyer@example.com", description="User email address")
    password: str = Field(..., min_length=8, example="Secret123!", description="Account password (min 8 characters)")
    name: str = Field(..., min_length=2, example="Aarav Sharma", description="Full name")
    phone: Optional[str] = Field(None, example="+91 9876543210", description="Contact phone number")
    role: Optional[str] = Field("Buyer", example="Buyer", description="User role: Buyer, Owner, or Agent")


class LoginRequest(BaseModel):
    email: str = Field(..., example="buyer@example.com")
    password: str = Field(..., example="Secret123!")


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    notification_prefs: Optional[Dict[str, bool]] = None
    search_prefs: Optional[Dict[str, Any]] = None


class InquiryRequest(BaseModel):
    property_id: str = Field(..., example="prop-blr-01")
    property_title: str = Field(..., example="3 BHK High-Rise Flat in Whitefield")
    name: str = Field(..., min_length=2, example="Priya Verma")
    phone: str = Field(..., example="+91 9876543210")
    email: str = Field(..., example="priya@example.com")
    message: Optional[str] = Field("", example="I am interested in scheduling a site visit this weekend.")
    preferred_bhk: Optional[str] = Field(None, example="3 BHK")


class SavedSyncRequest(BaseModel):
    property_ids: List[str]


# ================= AUTH DEPENDENCY =================

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please sign in."
        )
    token = authorization.split("Bearer ", 1)[1].strip()
    user = SessionService.get_user_from_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please re-authenticate."
        )
    return user


def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ", 1)[1].strip()
    return SessionService.get_user_from_token(token)


# ================= AUTHENTICATION ROUTES =================

@router.post("/auth/signup")
async def signup(req: SignupRequest):
    # Validate email format
    email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.match(email_regex, req.email.strip()):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    try:
        user = UserService.create_user(
            email=req.email,
            password=req.password,
            name=req.name,
            phone=req.phone,
            role=req.role or "Buyer"
        )
        session = SessionService.create_session(user["id"])
        return {
            "status": "success",
            "message": "Account created successfully.",
            "user": user,
            "session": session
        }
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.post("/auth/login")
async def login(req: LoginRequest):
    user = UserService.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )
    session = SessionService.create_session(user["id"])
    return {
        "status": "success",
        "message": "Authenticated successfully.",
        "user": user,
        "session": session
    }


@router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        SessionService.terminate_session(token)
    return {"status": "success", "message": "Signed out successfully."}


@router.get("/auth/me")
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "status": "success",
        "user": current_user
    }


@router.put("/auth/profile")
async def update_my_profile(req: ProfileUpdateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    updated = UserService.update_profile(
        user_id=current_user["id"],
        name=req.name,
        phone=req.phone,
        role=req.role,
        notification_prefs=req.notification_prefs,
        search_prefs=req.search_prefs
    )
    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "user": updated
    }


# ================= SAVED PROPERTIES & SYNC =================

@router.get("/user/saved-properties")
async def get_saved_properties(current_user: Dict[str, Any] = Depends(get_current_user)):
    saved_ids = SavedPropertiesService.get_saved(current_user["id"])
    return {
        "status": "success",
        "saved_property_ids": saved_ids
    }


@router.post("/user/saved-properties/{property_id}")
async def save_property(property_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    updated_ids = SavedPropertiesService.save_property(current_user["id"], property_id)
    return {
        "status": "success",
        "saved_property_ids": updated_ids
    }


@router.delete("/user/saved-properties/{property_id}")
async def remove_saved_property(property_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    updated_ids = SavedPropertiesService.remove_property(current_user["id"], property_id)
    return {
        "status": "success",
        "saved_property_ids": updated_ids
    }


@router.post("/user/saved-properties/sync")
async def sync_saved_properties(req: SavedSyncRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    merged = SavedPropertiesService.sync_local_saved(current_user["id"], req.property_ids)
    return {
        "status": "success",
        "saved_property_ids": merged
    }


# ================= RATE-LIMITED INQUIRIES =================

@router.post("/inquiries")
async def submit_inquiry(req: InquiryRequest, request: Request, opt_user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    # Validate phone format (+91 or 10 digits)
    phone_clean = re.sub(r"[^\d+]", "", req.phone)
    if len(phone_clean) < 10:
        raise HTTPException(status_code=400, detail="Invalid telephone number format. Please provide a valid 10-digit mobile number.")

    # Validate email
    email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.match(email_regex, req.email.strip()):
        raise HTTPException(status_code=400, detail="Invalid email address format.")

    # Rate limiting: max 10 inquiries per 15 minutes per IP or user
    client_ip = request.client.host if request.client else "127.0.0.1"
    rate_key = opt_user["id"] if opt_user else client_ip
    
    if not InquiryService.check_rate_limit(rate_key, max_requests=10, window_seconds=900):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: You have submitted multiple inquiries recently. Please wait 15 minutes before submitting another inquiry."
        )

    user_id = opt_user["id"] if opt_user else None
    result = InquiryService.create_inquiry(
        property_id=req.property_id,
        property_title=req.property_title,
        name=req.name,
        phone=req.phone,
        email=req.email,
        message=req.message or "",
        preferred_bhk=req.preferred_bhk,
        user_id=user_id,
        ip_address=client_ip
    )

    return {
        "status": "success",
        "message": "Property inquiry submitted and recorded in platform database.",
        "inquiry": result
    }


@router.get("/user/inquiries")
async def get_my_inquiries(current_user: Dict[str, Any] = Depends(get_current_user)):
    inquiries = InquiryService.get_user_inquiries(current_user["id"])
    return {
        "status": "success",
        "inquiries": inquiries,
        "gateway_notice": "External SMS/Email dispatch is unconfigured in development environment. Records are held in internal advisory queues."
    }


# ================= OWNER LISTING MANAGEMENT =================

@router.get("/user/listings")
async def get_my_listings(current_user: Dict[str, Any] = Depends(get_current_user)):
    listings = OwnerListingService.get_user_listings(current_user["id"])
    return {
        "status": "success",
        "listings": listings
    }


@router.post("/user/listings")
async def save_owner_listing(listing_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    saved = OwnerListingService.create_or_sync_listing(current_user["id"], listing_data)
    return {
        "status": "success",
        "message": "Owner listing persisted to server database.",
        "listing": saved
    }


@router.delete("/user/listings/{listing_id}")
async def delete_owner_listing(listing_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    success = OwnerListingService.delete_listing(current_user["id"], listing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found or unauthorized.")
    return {
        "status": "success",
        "message": "Listing removed successfully."
    }
