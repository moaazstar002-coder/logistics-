import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

if __package__:
    from . import models
    from .database import get_db
else:
    import models
    from database import get_db

COOKIE_NAME = "logistics_session"
SESSION_DURATION = timedelta(days=7)
COOKIE_SECURE = os.getenv("LOGISTICS_COOKIE_SECURE", "false").lower() == "true"
PASSWORD_HASHER = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)
_DUMMY_PASSWORD_HASH = PASSWORD_HASHER.hash("not-a-real-user-password")


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if (
        len(normalized) > 254
        or normalized.count("@") != 1
        or any(character.isspace() for character in normalized)
        or "." not in normalized.rsplit("@", 1)[-1]
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="أدخل بريداً إلكترونياً صالحاً.",
        )
    return normalized


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(
    response: Response, user: models.UserModel, db: Session
) -> None:
    token = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    expires_at = now + SESSION_DURATION
    db.query(models.AuthSessionModel).filter(
        models.AuthSessionModel.expires_at <= now
    ).delete(synchronize_session=False)
    session = models.AuthSessionModel(
        user_id=user.id,
        token_hash=hash_session_token(token),
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    cookie_expires_at = datetime.now(timezone.utc) + SESSION_DURATION
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=int(SESSION_DURATION.total_seconds()),
        expires=cookie_expires_at,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> models.UserModel:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="يرجى تسجيل الدخول للمتابعة.",
        )

    session = (
        db.query(models.AuthSessionModel)
        .filter(
            models.AuthSessionModel.token_hash == hash_session_token(token),
            models.AuthSessionModel.expires_at > datetime.utcnow(),
        )
        .first()
    )
    user = db.query(models.UserModel).filter_by(id=session.user_id).first() if session else None
    if not session or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.",
        )
    return user


def authenticate_user(
    email: str, password: str, db: Session
) -> models.UserModel | None:
    normalized_email = normalize_email(email)
    user = db.query(models.UserModel).filter_by(email=normalized_email).first()
    password_hash = user.password_hash if user else _DUMMY_PASSWORD_HASH
    try:
        password_matches = PASSWORD_HASHER.verify(password_hash, password)
    except (InvalidHashError, VerifyMismatchError):
        password_matches = False
    return user if user and password_matches else None


def revoke_session(request: Request, response: Response, db: Session) -> None:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        db.query(models.AuthSessionModel).filter_by(
            token_hash=hash_session_token(token)
        ).delete(synchronize_session=False)
        db.commit()
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
