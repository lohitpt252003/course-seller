# Utility Functions

Helper functions used across the application.

- **`auth.py`**:
  - `verify_password(plain_password, hashed_password)`: Verifies user passwords.
  - `get_password_hash(password)`: Hashes passwords using bcrypt.
  - `create_access_token(data, expires_delta)`: Generates JWT tokens.
  - `get_current_user(token, db)`: Decodes JWT tokens and retrieves current user.
  - `require_role(role)`: Dependency to restrict access based on user role.
