from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.auth.schemas import RegisterIn, TokenOut, UserOut, GoogleAuthIn
from app.auth.service import (
    AuthError,
    register_user,
    authenticate_user,
    issue_tokens,
    refresh_tokens,
    upsert_google_user,
)
from app.auth.deps import get_current_user
from app.auth.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: RegisterIn, db: AsyncSession = Depends(get_db)):
    try:
        return await register_user(db, payload.email, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.post("/login", response_model=TokenOut)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    try:
        u = await authenticate_user(db, form.username, form.password)
        access, refresh = await issue_tokens(db, u.id)
        return TokenOut(access_token=access, refresh_token=refresh)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)


@router.post("/google", response_model=TokenOut)
async def login_google(payload: GoogleAuthIn, db: AsyncSession = Depends(get_db)):
    try:
        u = await upsert_google_user(db, payload.id_token)
        access, refresh = await issue_tokens(db, u.id)
        return TokenOut(access_token=access, refresh_token=refresh)
    except (AuthError, ValueError) as e:
        msg = e.message if isinstance(e, AuthError) else str(e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)


@router.post("/refresh", response_model=TokenOut)
async def refresh(payload: dict, db: AsyncSession = Depends(get_db)):
    try:
        refresh_token = payload.get("refresh_token")
        if not isinstance(refresh_token, str) or not refresh_token:
            raise HTTPException(status_code=422, detail="refresh_token required")
        access, new_refresh = await refresh_tokens(db, refresh_token)
        return TokenOut(access_token=access, refresh_token=new_refresh)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
