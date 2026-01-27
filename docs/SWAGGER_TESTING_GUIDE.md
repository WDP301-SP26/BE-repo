# WDP391 Backend API - Testing Guide

## Quick Start với Swagger UI

### 1. Khởi động server

```bash
npm run start:dev
```

### 2. Truy cập Swagger UI

Mở trình duyệt và truy cập: **http://localhost:3000/api**

---

## API Testing Guide

### 📌 A. Authentication - Email/Password

#### 1. Register (Đăng ký tài khoản)

**Endpoint**: `POST /auth/register`

**Request Body**:

```json
{
  "email": "student1@fpt.edu.vn",
  "password": "123456",
  "full_name": "Nguyễn Văn A",
  "student_id": "SE123456"
}
```

**Response** (201):

```json
{
  "user": {
    "id": "uuid",
    "email": "student1@fpt.edu.vn",
    "full_name": "Nguyễn Văn A",
    "student_id": "SE123456",
    "role": "STUDENT",
    "created_at": "2026-01-27T..."
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login (Đăng nhập)

**Endpoint**: `POST /auth/login`

**Request Body**:

```json
{
  "email": "student1@fpt.edu.vn",
  "password": "123456"
}
```

**Response** (200):

```json
{
  "user": { ... },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**💡 Lưu lại `access_token` để sử dụng cho các API yêu cầu authentication!**

---

### 🔐 B. Setup Authentication trong Swagger

Sau khi có `access_token`:

1. Click vào nút **"Authorize"** (biểu tượng ổ khóa) ở góc trên bên phải
2. Nhập vào ô `Value`: `Bearer <your_access_token>`  
   Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"** → **"Close"**

✅ Bây giờ tất cả request sẽ tự động gửi kèm token!

---

### 👤 C. Protected Endpoints (Cần Bearer Token)

#### 1. Get Current User Profile

**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
{
  "id": "uuid",
  "email": "student1@fpt.edu.vn",
  "full_name": "Nguyễn Văn A",
  "student_id": "SE123456",
  "role": "STUDENT",
  "avatar_url": null,
  "primary_provider": "EMAIL"
}
```

#### 2. Get Linked OAuth Accounts

**Endpoint**: `GET /auth/linked-accounts`

**Response** (200):

```json
[
  {
    "provider": "GITHUB",
    "provider_username": "nguyenvana",
    "provider_email": "student1@fpt.edu.vn",
    "created_at": "2026-01-27T..."
  }
]
```

#### 3. Unlink OAuth Account

**Endpoint**: `DELETE /auth/unlink/{provider}`

**Path Parameter**: `provider` = `GITHUB` hoặc `JIRA`

**Response** (200):

```json
{
  "message": "Đã hủy liên kết thành công"
}
```

---

### 🔗 D. OAuth Flows (GitHub & Jira)

> ⚠️ **Lưu ý**: OAuth flows không test được trực tiếp trên Swagger vì cần redirect qua browser

#### Setup OAuth Apps (Bắt buộc trước khi test):

**GitHub OAuth App:**

1. Truy cập: https://github.com/settings/developers
2. Click "New OAuth App"
3. Điền thông tin:
   - Application name: `WDP391 Local Dev`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy **Client ID** và **Client Secret**
5. Thêm vào file `.env`:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

**Jira/Atlassian OAuth App:**

1. Truy cập: https://developer.atlassian.com/console/myapps/
2. Create new app → OAuth 2.0 integration
3. Add callback URL: `http://localhost:3000/api/auth/jira/callback`
4. Add scopes: `read:me`, `offline_access`
5. Copy credentials vào `.env`:
   ```
   JIRA_CLIENT_ID=your_client_id
   JIRA_CLIENT_SECRET=your_client_secret
   ```

#### Test OAuth Login:

1. **Trường hợp 1: Login với GitHub** (chưa có tài khoản hệ thống)
   - Mở trình duyệt: `http://localhost:3000/api/auth/github`
   - Đăng nhập GitHub → Authorize app
   - Hệ thống tự động tạo tài khoản và redirect về frontend với token

2. **Trường hợp 2: Link GitHub vào tài khoản đã có**
   - Login vào hệ thống trước (lấy JWT token)
   - Thêm token vào header: `Authorization: Bearer <token>`
   - Mở: `http://localhost:3000/api/auth/github`  
     (với token trong session/cookie)
   - Sau khi authorize, GitHub sẽ được link vào tài khoản hiện tại

3. **Jira OAuth** - Tương tự như GitHub:
   - Login: `http://localhost:3000/api/auth/jira`
   - Link: Thêm token trước khi truy cập endpoint

---

## Swagger UI Features

### 📝 Try It Out

1. Click vào endpoint muốn test
2. Click nút **"Try it out"**
3. Điền request body/parameters
4. Click **"Execute"**
5. Xem kết quả trong phần **"Responses"**

### 🎯 Testing Flow Chuẩn

```
1. POST /auth/register     → Lấy access_token
2. Click "Authorize"       → Paste token
3. GET /auth/me            → Verify token hoạt động
4. Test các endpoints khác
```

---

## Common Errors & Solutions

### ❌ 401 Unauthorized

- **Nguyên nhân**: Token không hợp lệ hoặc không gửi token
- **Giải pháp**:
  - Click "Authorize" và nhập đúng token
  - Token format: `Bearer <token>` (có space giữa Bearer và token)

### ❌ 409 Conflict (Email already exists)

- **Nguyên nhân**: Email đã được đăng ký
- **Giải pháp**: Đổi email khác hoặc login

### ❌ 400 Bad Request

- **Nguyên nhân**: Dữ liệu gửi lên không đúng format
- **Giải pháp**: Kiểm tra lại request body theo schema trong Swagger

---

## Tips & Tricks

### 🔥 Hot Reload

Server tự động restart khi bạn sửa code (chạy `npm run start:dev`)

### 📊 Xem Database

```bash
npx prisma studio
```

Mở: **http://localhost:5555** để xem dữ liệu trực quan

### 🗄️ Reset Database

```bash
npx prisma migrate reset --force
```

### 🔍 Debug Token

Paste token vào: **https://jwt.io** để xem payload

---

## Next Steps

1. ✅ Test tất cả email/password endpoints
2. ✅ Setup GitHub OAuth app và test login flow
3. ✅ Setup Jira OAuth app và test link flow
4. ✅ Test account unlinking
5. 🚀 Deploy lên server thật và cập nhật callback URLs
