from contextlib import asynccontextmanager
import os

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

if __package__:
    from . import auth, models, schemas
    from .database import get_db, initialize_database
else:
    import auth, models, schemas
    from database import get_db, initialize_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="Logistics & Fleet API",
    version="1.0",
    lifespan=lifespan,
)


@app.post(
    "/auth/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    credentials: schemas.UserCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    email = auth.normalize_email(credentials.email)
    if db.query(models.UserModel).filter_by(email=email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="يوجد حساب مسجل بهذا البريد الإلكتروني.",
        )

    user = models.UserModel(
        email=email,
        password_hash=auth.PASSWORD_HASHER.hash(credentials.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="يوجد حساب مسجل بهذا البريد الإلكتروني.",
        ) from error
    db.refresh(user)
    auth.create_session(response, user, db)
    return user


@app.post("/auth/login", response_model=schemas.UserResponse)
def login(
    credentials: schemas.AuthCredentials,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        user = auth.authenticate_user(
            credentials.email, credentials.password, db
        )
    except HTTPException:
        user = None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        )
    auth.create_session(response, user, db)
    return user


@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(user: models.UserModel = Depends(auth.get_current_user)):
    return user


@app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    auth.revoke_session(request, response, db)


@app.get("/shipments", response_model=list[schemas.ShipmentResponse])
def get_shipments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=1000),
    db: Session = Depends(get_db),
    user: models.UserModel = Depends(auth.get_current_user),
):
    shipments = (
        db.query(models.ShipmentModel)
        .filter(models.ShipmentModel.owner_id == user.id)
        .order_by(models.ShipmentModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return shipments

@app.post("/shipments", response_model=schemas.ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(
    shipment: schemas.ShipmentCreate,
    db: Session = Depends(get_db),
    user: models.UserModel = Depends(auth.get_current_user),
):
    existing = db.query(models.ShipmentModel).filter(models.ShipmentModel.tracking_number == shipment.tracking_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="رقم التتبع هذا موجود مسبقاً")
    
    new_shipment = models.ShipmentModel(**shipment.model_dump(), owner_id=user.id)
    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    return new_shipment

@app.put("/shipments/{shipment_id}", response_model=schemas.ShipmentResponse)
def update_shipment(
    shipment_id: int,
    shipment_update: schemas.ShipmentCreate,
    db: Session = Depends(get_db),
    user: models.UserModel = Depends(auth.get_current_user),
):
    shipment = (
        db.query(models.ShipmentModel)
        .filter(
            models.ShipmentModel.id == shipment_id,
            models.ShipmentModel.owner_id == user.id,
        )
        .first()
    )
    if not shipment:
        raise HTTPException(status_code=404, detail="الشحنة غير موجودة")
    
    for key, value in shipment_update.model_dump().items():
        setattr(shipment, key, value)
    
    db.commit()
    db.refresh(shipment)
    return shipment

@app.delete("/shipments/{shipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    user: models.UserModel = Depends(auth.get_current_user),
):
    shipment = (
        db.query(models.ShipmentModel)
        .filter(
            models.ShipmentModel.id == shipment_id,
            models.ShipmentModel.owner_id == user.id,
        )
        .first()
    )
    if not shipment:
        raise HTTPException(status_code=404, detail="الشحنة غير موجودة")
    
    db.delete(shipment)
    db.commit()
    return {"message": "تم حذف الشحنة بنجاح"}


if os.getenv("VERCEL"):
    app.frontend(
        "/",
        directory="FrontEnd/dist",
        fallback="index.html",
    )