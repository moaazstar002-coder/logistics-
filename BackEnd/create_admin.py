from getpass import getpass

from argon2 import PasswordHasher
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

if __package__:
    from . import models
    from .auth import normalize_email
    from .database import SessionLocal, initialize_database
else:
    import models
    from auth import normalize_email
    from database import SessionLocal, initialize_database


def main() -> None:
    initialize_database()
    try:
        email = normalize_email(input("Admin email: "))
    except HTTPException as error:
        raise SystemExit(error.detail) from error
    password = getpass("Password (minimum 12 characters): ")
    confirmation = getpass("Confirm password: ")

    if not 12 <= len(password) <= 128:
        raise SystemExit("Password must contain between 12 and 128 characters.")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    db = SessionLocal()
    try:
        if db.query(models.UserModel).filter_by(email=email).first():
            raise SystemExit("An account with this email already exists.")
        admin = models.UserModel(
            email=email,
            password_hash=PasswordHasher(
                time_cost=3, memory_cost=65536, parallelism=2
            ).hash(password),
        )
        db.add(admin)
        db.flush()
        db.query(models.ShipmentModel).filter(
            models.ShipmentModel.owner_id.is_(None)
        ).update({"owner_id": admin.id}, synchronize_session=False)
        db.commit()
        print(f"Admin account created for {email}.")
    except IntegrityError as error:
        db.rollback()
        raise SystemExit("Unable to create the admin account.") from error
    finally:
        db.close()


if __name__ == "__main__":
    main()
