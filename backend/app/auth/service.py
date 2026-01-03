from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, RefreshToken
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    refresh_expires_at,
    verify_google_id_token,
)


class AuthError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    res = await db.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    res = await db.execute(select(User).where(User.id == user_id))
    return res.scalar_one_or_none()


async def register_user(db: AsyncSession, email: str, password: str) -> User:
    existing = await get_user_by_email(db, email)
    if existing:
        raise AuthError("Email already registered")

    u = User(email=email, hashed_password=hash_password(password))
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    u = await get_user_by_email(db, email)
    if not u or not u.is_active or not u.hashed_password:
        raise AuthError("Invalid credentials")
    if not verify_password(password, u.hashed_password):
        raise AuthError("Invalid credentials")
    return u


async def upsert_google_user(db: AsyncSession, google_id_token_str: str) -> User:
    info = verify_google_id_token(google_id_token_str)

    sub = info.get("sub")
    email = info.get("email")
    email_verified = info.get("email_verified")

    if not sub or not email:
        raise AuthError("Google token missing sub/email")
    if email_verified is False:
        raise AuthError("Google email not verified")

    res = await db.execute(select(User).where(User.google_sub == sub))
    u = res.scalar_one_or_none()
    if u:
        if not u.is_active:
            raise AuthError("Inactive user")
        if u.email != email:
            u.email = email
            await db.commit()
            await db.refresh(u)
        return u

    u_by_email = await get_user_by_email(db, email)
    if u_by_email:
        if not u_by_email.is_active:
            raise AuthError("Inactive user")
        u_by_email.google_sub = sub
        await db.commit()
        await db.refresh(u_by_email)
        return u_by_email

    u_new = User(email=email, hashed_password=None, google_sub=sub)
    db.add(u_new)
    await db.commit()
    await db.refresh(u_new)
    return u_new


async def issue_tokens(db: AsyncSession, user_id: int) -> tuple[str, str]:
    access = create_access_token(user_id)

    refresh_plain = create_refresh_token()
    rt = RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(refresh_plain),
        revoked=False,
        expires_at=refresh_expires_at(),
    )
    db.add(rt)
    await db.commit()

    return access, refresh_plain


async def refresh_tokens(db: AsyncSession, refresh_token_plain: str) -> tuple[str, str]:
    token_hash = hash_refresh_token(refresh_token_plain)
    res = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    row = res.scalar_one_or_none()

    if not row or row.revoked:
        raise AuthError("Invalid refresh token")

    if row.expires_at <= datetime.now(timezone.utc):
        raise AuthError("Refresh token expired")

    await db.execute(update(RefreshToken).where(RefreshToken.id == row.id).values(revoked=True))
    await db.commit()

    return await issue_tokens(db, row.user_id)
