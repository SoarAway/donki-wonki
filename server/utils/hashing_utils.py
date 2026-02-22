
import bcrypt

# Hash password with bcrypt
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()  # Generate a salt
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)  # Hash password with the salt
    return hashed_password.decode('utf-8')

# Verify password with bcrypt
def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
