# Missing API Endpoints for Full Functionality

The following API endpoints are currently missing and need to be implemented on the backend to enable full functionality of the roles and permissions system:

## 1. User Permissions Endpoints

### 1.1 Get User Permissions
```
GET /api/v1/usuarios/{id}/permissions
```
**Purpose**: Retrieve all permissions for a specific user (both from roles and direct permissions)

**Expected Response**:
```json
{
  "role": {
    "id": 1,
    "name": "admin",
    "guard_name": "web",
    "permissions": [...]
  },
  "permissions": [
    {
      "id": 1,
      "name": "Dashboard.View",
      "guard_name": "web",
      "source": "role"
    }
  ]
}
```

### 1.2 Get User Permissions Detailed
```
GET /api/v1/usuarios/{id}/permissions/detailed
```
**Purpose**: Get detailed permission information with extra metadata

### 1.3 Get User Permissions Summary
```
GET /api/v1/usuarios/{id}/permissions/summary
```
**Purpose**: Get a summary of user permissions for quick overview

**Expected Response**:
```json
{
  "role": "admin",
  "totalPermissions": 25,
  "rolePermissions": 20,
  "directPermissions": 5,
  "categories": ["Dashboard", "Users", "Reports"]
}
```

### 1.4 Get User Permissions Categorized
```
GET /api/v1/usuarios/{id}/permissions/categorized
```
**Purpose**: Get permissions organized by categories

## 2. Permission Check Endpoints

### 2.1 Check Single Permission
```
POST /api/v1/usuarios/{id}/check-permission
```
**Request Body**:
```json
{
  "permissionName": "Dashboard.View"
}
```

**Expected Response**:
```json
{
  "hasPermission": true
}
```

### 2.2 Check Multiple Permissions
```
POST /api/v1/usuarios/{id}/check-permissions
```
**Request Body**:
```json
{
  "permissionNames": ["Dashboard.View", "Users.Create"],
  "mode": "any"
}
```

**Expected Response**:
```json
{
  "hasPermissions": true,
  "details": {
    "Dashboard.View": true,
    "Users.Create": false
  }
}
```

## 3. Role Management Endpoints

### 3.1 Assign Role to User
```
POST /api/v1/usuarios/{id}/assign-role
```
**Request Body**:
```json
{
  "roleId": 1
}
```

### 3.2 Get Available Roles
```
GET /api/v1/usuarios/available/roles
```
**Purpose**: Get all available roles in the system

**Expected Response**:
```json
[
  {
    "id": 1,
    "name": "admin",
    "guard_name": "web",
    "permissions": [...]
  }
]
```

## 4. Direct Permission Management Endpoints

### 4.1 Assign Direct Permission
```
POST /api/v1/usuarios/{id}/assign-permission
```
**Request Body**:
```json
{
  "permissionId": 5
}
```

### 4.2 Remove Direct Permission
```
DELETE /api/v1/usuarios/{id}/remove-permission/{permissionId}
```

### 4.3 Sync Direct Permissions
```
POST /api/v1/usuarios/{id}/sync-permissions
```
**Request Body**:
```json
{
  "permissionIds": [1, 3, 5, 7]
}
```

## 5. Permission Data Endpoints

### 5.1 Get Available Permissions
```
GET /api/v1/usuarios/available/permissions
```
**Purpose**: Get all available permissions in the system

**Expected Response**:
```json
[
  {
    "id": 1,
    "name": "Dashboard.View",
    "guard_name": "web",
    "category": "Dashboard"
  }
]
```

### 5.2 Get Available Permissions Grouped
```
GET /api/v1/usuarios/available/permissions/grouped
```
**Purpose**: Get permissions already organized by categories

**Expected Response**:
```json
{
  "Dashboard": [
    {
      "id": 1,
      "name": "Dashboard.View",
      "guard_name": "web"
    }
  ],
  "Users": [
    {
      "id": 10,
      "name": "Users.Create",
      "guard_name": "web"
    }
  ]
}
```

## 6. Bulk Operations Endpoints

### 6.1 Bulk Assign Roles
```
POST /api/v1/usuarios/bulk/assign-roles
```
**Request Body**:
```json
{
  "assignments": [
    {
      "userId": "123",
      "roleId": 1
    }
  ]
}
```

### 6.2 Bulk Assign Permissions
```
POST /api/v1/usuarios/bulk/assign-permissions
```
**Request Body**:
```json
{
  "assignments": [
    {
      "userId": "123",
      "permissionIds": [1, 3, 5]
    }
  ]
}
```

## 7. General Permission Endpoints

### 7.1 List All Permissions
```
GET /api/v1/permissions
```
**Purpose**: Get all permissions in the system

**Expected Response**:
```json
[
  {
    "id": 1,
    "name": "Dashboard.View",
    "guard_name": "web",
    "category": "Dashboard"
  }
]
```

### 7.2 List Permissions Grouped
```
GET /api/v1/permissions/grouped
```
**Purpose**: Get all permissions organized by categories

## Current Status

❌ **All endpoints listed above are currently missing and return 404 errors**

⚠️ **Impact**: 
- Permission management components are disabled
- User role assignment is not functional
- Permission-based access control is not working
- User permissions display is not available

## Recommendation

Implement these endpoints on the Laravel backend using Spatie Permission package or similar role/permission management system. The endpoints should follow RESTful conventions and provide proper error handling and validation.