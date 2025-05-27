# User Management API Documentation

## Overview
This backend provides comprehensive user management functionality for the forum application, including admin controls for managing users and system statistics.

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Admin-only endpoints also require the authenticated user to have `isAdmin = 1` in the database.

---

## User Management Endpoints

### GET /users
**Purpose**: Retrieve users with pagination and search
**Admin Required**: Yes
**Parameters**:
- `search` (optional): Search term for username, displayName, or email
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Number of users per page

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-05-26T10:00:00Z",
      "lastOnline": "2025-05-26T12:00:00Z",
      "isOnline": 1,
      "isAdmin": 0,
      "avatar": "/path/to/avatar.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}
```

### PATCH /users
**Purpose**: Update user information
**Admin Required**: Yes
**Body**:
```json
{
  "userId": 123,
  "updates": {
    "isAdmin": 1,
    "displayName": "New Display Name",
    "email": "newemail@example.com"
  }
}
```

**Notes**:
- Only specific fields are allowed: `isAdmin`, `displayName`, `email`
- Admins cannot remove their own admin status
- Automatically updates `updatedAt` timestamp

**Response**:
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

### DELETE /users
**Purpose**: Delete a user account
**Admin Required**: Yes
**Body**:
```json
{
  "userId": 123
}
```

**Notes**:
- Admins cannot delete their own account
- May fail if user has associated data (threads, comments) due to foreign key constraints
- Consider implementing cascading deletion or soft deletion in production

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Admin Dashboard Endpoints

### GET /admin?action=stats
**Purpose**: Get system statistics
**Admin Required**: Yes

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1500,
    "totalThreads": 450,
    "totalComments": 3200,
    "adminCount": 5,
    "onlineUsers": 25,
    "recentActivity": {
      "newUsers": 12,
      "newThreads": 8,
      "newComments": 45
    }
  }
}
```

### GET /admin?action=recent-activity
**Purpose**: Get recent system activity
**Admin Required**: Yes

**Response**:
```json
{
  "success": true,
  "activity": {
    "recentUsers": [
      {
        "id": 123,
        "username": "newuser",
        "displayName": "New User",
        "createdAt": "2025-05-26T10:00:00Z",
        "isAdmin": 0
      }
    ],
    "recentThreads": [
      {
        "id": 456,
        "title": "New Thread Title",
        "createdAt": "2025-05-26T11:00:00Z",
        "username": "threadcreator",
        "displayName": "Thread Creator"
      }
    ],
    "recentComments": [
      {
        "id": 789,
        "content": "Comment content (truncated to 100 chars)",
        "createdAt": "2025-05-26T12:00:00Z",
        "threadId": 456,
        "threadTitle": "Thread Title",
        "username": "commenter",
        "displayName": "Commenter"
      }
    ]
  }
}
```

### POST /admin
**Purpose**: Perform admin actions
**Admin Required**: Yes

#### Promote User to Admin
**Body**:
```json
{
  "action": "promote-user",
  "data": {
    "userId": 123
  }
}
```

#### Demote User from Admin
**Body**:
```json
{
  "action": "demote-user",
  "data": {
    "userId": 123
  }
}
```

**Notes**:
- Admins cannot demote themselves
- Checks if user is already admin/not admin before proceeding

#### Bulk Update Users
**Body**:
```json
{
  "action": "bulk-update-users",
  "data": {
    "userIds": [123, 456, 789],
    "updates": {
      "isAdmin": 1
    }
  }
}
```

**Notes**:
- Only `isAdmin` field is currently supported for bulk updates
- Returns detailed results for each user operation

**Response**:
```json
{
  "success": true,
  "message": "Bulk update completed. 3 successful, 0 failed.",
  "results": [
    {
      "userId": 123,
      "success": true,
      "user": { /* updated user object */ }
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (invalid parameters, validation errors)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not admin)
- `404`: Not Found (user not found)
- `500`: Internal Server Error

---

## Security Features

1. **Admin-only Access**: All endpoints require admin privileges
2. **Self-protection**: Admins cannot delete or demote themselves
3. **Input Validation**: Only specific fields allowed for updates
4. **Error Handling**: Proper error messages for foreign key constraints
5. **Pagination**: Prevents overwhelming responses for large user lists
6. **Search Functionality**: Secure search across username, displayName, and email

---

## Database Schema Considerations

The user management system works with the following user table structure:
- `id`: Primary key
- `username`: Unique username
- `displayName`: Display name
- `email`: Email address
- `isAdmin`: Integer flag (0 = regular user, 1 = admin)
- `isOnline`: Integer flag (0 = offline, 1 = online)
- `createdAt`: Registration timestamp
- `updatedAt`: Last update timestamp
- `lastOnline`: Last activity timestamp
- `avatar`: Profile picture path

---

## Usage Examples

### Making a user admin:
```javascript
const response = await fetch('/users', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    userId: 123,
    updates: { isAdmin: 1 }
  })
});
```

### Getting system statistics:
```javascript
const response = await fetch('/admin?action=stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Bulk promoting users:
```javascript
const response = await fetch('/admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    action: 'bulk-update-users',
    data: {
      userIds: [123, 456, 789],
      updates: { isAdmin: 1 }
    }
  })
});
```
