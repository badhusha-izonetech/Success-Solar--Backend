from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.config import settings
from app.core.security import oauth2_scheme
from app.db.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.schema.auth import TokenPayload

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=int(user_id))
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_employee(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)) -> Employee:
    if not current_user.employee_id:
        raise HTTPException(status_code=403, detail="User is not linked to an employee profile")
    employee = db.query(Employee).filter(Employee.id == current_user.employee_id).first()
    if not employee or not employee.active:
        raise HTTPException(status_code=403, detail="Employee profile is inactive or not found")
    return employee

def check_role(required_role: str):
    def role_checker(employee: Employee = Depends(get_current_employee)):
        if employee.role.name != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return employee
    return role_checker
