# TPME Invest Maroc – Backend

Backend API for the **TPME Invest Maroc** platform, built with **Spring Boot 3**, **Spring Security**, **JWT**, **Google OAuth2**, and **MariaDB**.

This service handles user authentication and authorization for the application, including:

- local registration and login
- Google OAuth2 login
- JWT access token generation
- refresh token management
- authenticated user profile retrieval
- CORS configuration for frontend integration

---

## Tech Stack

- **Java 21**
- **Spring Boot 3.5.12**
- **Spring Security**
- **Spring Data JPA**
- **MariaDB**
- **JWT (JJWT 0.12.5)**
- **OAuth2 Client (Google)**
- **Lombok**
- **Maven**

---

## Project Structure

```bash
src/main/java/Cri/Tpme/Back_end
├── config/                 # Security and CORS configuration
├── controller/             # REST controllers
├── dto/                    # Request / response DTOs
├── entity/                 # JPA entities
├── exception/              # Custom exceptions and global handler
├── repository/             # Spring Data repositories
├── security/               # JWT filter, token provider, user details service
├── security/oauth2/        # Google OAuth2 services and handlers
└── service/                # Business logic
```

---

## Main Features

### 1. Local Authentication
Users can create an account and log in with:

- **name**
- **email**
- **password**

Passwords are encrypted using **BCrypt**.

### 2. Google OAuth2 Authentication
Users can also authenticate using their Google account.

After a successful OAuth2 login:

- the backend creates or updates the user
- generates a **JWT access token**
- generates a **refresh token**
- redirects the user to the frontend callback URL

### 3. JWT Authentication
Protected routes require a valid token in the header:

```http
Authorization: Bearer <access_token>
```

### 4. Refresh Token Support
The backend supports refresh tokens so the frontend can request a new access token without asking the user to log in again.

### 5. Current User Endpoint
Authenticated users can retrieve their own profile information.

---

## API Endpoints

Base path:

```http
/api/auth
```

### Register
```http
POST /api/auth/register
```

**Request body**

```json
{
  "name": "Mohamed Belmaizi",
  "email": "mohamed@example.com",
  "password": "password123"
}
```

### Login
```http
POST /api/auth/login
```

**Request body**

```json
{
  "email": "mohamed@example.com",
  "password": "password123"
}
```

### Refresh Access Token
```http
POST /api/auth/refresh
```

**Request body**

```json
{
  "refreshToken": "your-refresh-token"
}
```

### Logout
```http
POST /api/auth/logout
```

**Headers**

```http
Authorization: Bearer <access_token>
```

### Get Current User
```http
GET /api/auth/me
```

**Headers**

```http
Authorization: Bearer <access_token>
```

### Google OAuth2 Login
```http
GET /oauth2/authorize/google
```

After success, the backend redirects to the frontend callback URL with:

- `token`
- `refreshToken`

Example:

```http
http://localhost:3000/oauth2/redirect?token=...&refreshToken=...
```

---

## Authentication Flow

### Local login flow
1. User registers or logs in with email/password.
2. Backend authenticates the user.
3. Backend returns:
   - access token
   - refresh token
   - user information
4. Frontend stores the tokens and sends the access token in protected requests.

### Google login flow
1. Frontend redirects the user to:
   ```http
   /oauth2/authorize/google
   ```
2. User authenticates with Google.
3. Backend creates or updates the user.
4. Backend generates tokens.
5. Backend redirects to the frontend callback URL.

---

## Database Schema

### `users`
Stores application users.

Main fields:

- `id`
- `email`
- `password`
- `name`
- `imageUrl`
- `provider` (`LOCAL` or `GOOGLE`)
- `providerId`
- `role` (`USER` or `ADMIN`)
- `enabled`
- `createdAt`
- `updatedAt`

### `refresh_tokens`
Stores one refresh token per user.

Main fields:

- `id`
- `user_id`
- `token`
- `expiryDate`

---

## Environment Variables

Create environment variables before running the project:

```env
DB_HOST=localhost
DB_NAME=tpme_db
DB_USER=root
DB_PASS=your_password
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000
```

### Recommended secret configuration
For better security, sensitive values should also be moved to environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_base64_secret
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000
OAUTH2_REDIRECT_URI=http://localhost:3000/oauth2/redirect
```

Then wire them in `application.properties` like this:

```properties
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=${JWT_EXPIRATION_MS:86400000}
app.jwt.refresh-expiration-ms=${JWT_REFRESH_EXPIRATION_MS:604800000}
app.oauth2.authorized-redirect-uri=${OAUTH2_REDIRECT_URI:http://localhost:3000/oauth2/redirect}
```

---

## Configuration

Current server port:

```properties
server.port=${PORT:8080}
```

Allowed frontend origins:

```properties
app.cors.allowed-origins=${ALLOWED_ORIGINS:http://localhost:3000}
```

Database connection:

```properties
spring.datasource.url=jdbc:mariadb://${DB_HOST}:3306/${DB_NAME}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASS}
```

---

## Run the Project Locally

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd dispo-tpme-back
```

### 2. Configure the database
Create a MariaDB database, for example:

```sql
CREATE DATABASE tpme_db;
```

### 3. Set environment variables
Configure the required database and security variables.

### 4. Run the application
Using Maven wrapper:

```bash
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

Or build the JAR:

```bash
./mvnw clean package
java -jar target/Back-end-0.0.1-SNAPSHOT.jar
```

---

## Testing with Postman

### Register
```http
POST http://localhost:8080/api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### Login
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Current user
```http
GET http://localhost:8080/api/auth/me
Authorization: Bearer <access_token>
```

### Refresh token
```http
POST http://localhost:8080/api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "<refresh_token>"
}
```

---

## Deployment

The project already includes:

- `Procfile`
- `system.properties`

This suggests it is ready for simple deployment on platforms that support Java applications.

Example `Procfile`:

```procfile
web: java -jar target/*.jar
```

---

## Security Notes

Before publishing or deploying this project:

1. **Remove hardcoded secrets** from `application.properties`.
2. Use **environment variables** for:
   - Google OAuth client ID and secret
   - JWT secret
   - database credentials
3. Restrict CORS origins in production.
4. Consider adding:
   - email verification
   - password reset
   - rate limiting
   - audit logging
   - role-based access control for admin endpoints

---

## Future Improvements

Possible next improvements for this backend:

- admin management endpoints
- user profile update endpoint
- password reset flow
- email verification
- refresh token revocation strategy
- Docker support
- Swagger / OpenAPI documentation
- CI/CD pipeline
- production profiles (`dev`, `prod`)

---

## Author

Developed as the backend authentication service for the **TPME Invest Maroc** project.

