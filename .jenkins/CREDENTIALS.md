# Jenkins Pipeline Credentials Setup Guide

## Required Credentials in Jenkins

Navigate to: **Jenkins → Manage Jenkins → Manage Credentials → (global)**

### 1. Docker Registry Credentials

**ID**: `docker-registry-credentials`  
**Type**: Username with password  
**Username**: Your Docker registry username  
**Password**: Your Docker registry password or access token  

### 2. Docker Registry URL

**ID**: `docker-registry-url`  
**Type**: Secret text  
**Secret**: `registry.example.com` (replace with your registry)  

### 3. TimescaleDB User

**ID**: `timescale-user`  
**Type**: Secret text  
**Secret**: `agrotrace_admin`  

### 4. TimescaleDB Password

**ID**: `timescale-password`  
**Type**: Secret text  
**Secret**: `Agr0Tr@ce2024!Secure`  

### 5. MinIO Root User

**ID**: `minio-root-user`  
**Type**: Secret text  
**Secret**: `agrotrace_minio`  

### 6. MinIO Root Password

**ID**: `minio-root-password`  
**Type**: Secret text  
**Secret**: `M1n10Secure2024!Key`  

---

## Using Credentials in Jenkinsfile

```groovy
environment {
    DOCKER_REGISTRY = credentials('docker-registry-url')
    DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
    TIMESCALE_USER = credentials('timescale-user')
    TIMESCALE_PASSWORD = credentials('timescale-password')
}
```

Access in steps:
```groovy
sh "echo ${DOCKER_CREDENTIALS_PSW} | docker login -u ${DOCKER_CREDENTIALS_USR} --password-stdin"
```

---

## Security Best Practices

✅ Never commit credentials to version control  
✅ Use Jenkins Credentials Store  
✅ Rotate credentials regularly  
✅ Use least privilege access  
✅ Enable audit logging  
