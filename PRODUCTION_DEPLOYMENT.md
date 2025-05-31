# Image Upload Production Deployment Guide

## Environment Setup

### 1. Upload Directory Configuration

The application supports multiple upload directory configurations:

1. **Default**: `static/uploads` (relative to project root)
2. **Environment Variable**: Set `UPLOAD_DIR` environment variable for custom path
3. **Fallback**: System temp directory if primary locations fail

### 2. Environment Variables

Add these to your production environment:

```bash
# Optional: Custom upload directory (absolute path recommended)
UPLOAD_DIR=/var/app/uploads

# Required: Database and auth secrets
DATABASE_URL=your_database_url
SECRET=your_jwt_secret
```

### 3. File System Permissions

Ensure the application has:
- Read/write permissions to the upload directory
- Permission to create directories (for automatic setup)

### 4. Production Considerations

#### Vercel/Netlify (Serverless)
- File uploads to local filesystem won't persist
- Consider cloud storage (AWS S3, Cloudinary, etc.)
- Use environment variable to point to cloud storage adapter

#### Traditional Hosting (VPS/Dedicated)
- Ensure upload directory is outside web root for security
- Set up proper backup for uploaded files
- Configure nginx/apache to serve static files efficiently

#### Docker Deployment
```dockerfile
# Ensure upload directory exists and has correct permissions
RUN mkdir -p /app/uploads && chown node:node /app/uploads
VOLUME ["/app/uploads"]
```

### 5. Debugging Production Issues

Access the debug endpoint (admin only):
```
GET /images/debug
```

This provides:
- Upload directory path and existence
- Write permissions test
- Environment information
- Platform details

### 6. Security Checklist

- [ ] Upload directory is not publicly accessible via web
- [ ] File type validation is enforced
- [ ] File size limits are appropriate
- [ ] Image processing (Sharp) is working correctly
- [ ] Rate limiting on upload endpoints
- [ ] User authentication is required

### 7. Performance Optimization

- [ ] Image compression is enabled (Sharp processing)
- [ ] CDN is configured for static file serving
- [ ] Proper caching headers for uploaded images
- [ ] Consider image lazy loading on frontend

### 8. Monitoring

Monitor these metrics:
- Upload success/failure rates
- Disk space usage
- Image processing performance
- Error logs for upload failures

## Troubleshooting Common Issues

### "Error uploading images" in production

1. Check debug endpoint: `/images/debug`
2. Verify directory permissions
3. Check available disk space
4. Review server logs for detailed errors
5. Test with small image files first

### Files not persisting (Serverless)

- Implement cloud storage adapter
- Update image serving logic for cloud URLs
- Configure environment variables for cloud provider

### Performance issues

- Check Sharp installation and native binaries
- Monitor memory usage during image processing
- Consider async job queue for large images
