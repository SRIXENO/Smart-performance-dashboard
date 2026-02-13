# 🚀 QUICK START GUIDE - SPID Enterprise Analytics Platform

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git installed

---

## 🔧 SETUP INSTRUCTIONS

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Verify .env file exists with correct MongoDB URI
# File: server/.env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://mrvssridhar3_db_user:srixeno@project-1.qxylrvv.mongodb.net/spid_development?retryWrites=true&w=majority&appName=PROJECT-1
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:5000**

---

### 2. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## 📊 ACCESSING THE PLATFORM

### Main Dashboard
```
http://localhost:3000/dashboard
```

### Features Available:
1. **Enterprise Dashboard** - Comprehensive analytics with 8 KPI cards and 8 charts
2. **Student Management** - CRUD operations
3. **Subject Management** - Assignment system
4. **Performance Tracking** - Marks and attendance
5. **SGPA/CGPA System** - Automatic calculations
6. **AI Analytics** - Risk assessment and predictions
7. **Activity Logs** - Complete audit trail

---

## 🎯 KEY ENDPOINTS TO TEST

### Dashboard Analytics
```bash
# Get comprehensive summary
GET http://localhost:5000/api/dashboard/summary

# Get attendance trend
GET http://localhost:5000/api/dashboard/attendance-trend

# Get department comparison
GET http://localhost:5000/api/dashboard/department-comparison

# Get CGPA distribution
GET http://localhost:5000/api/dashboard/cgpa-distribution

# Get performance growth
GET http://localhost:5000/api/dashboard/performance-growth

# Get difficult subjects
GET http://localhost:5000/api/dashboard/difficult-subjects

# Get at-risk students
GET http://localhost:5000/api/dashboard/at-risk-students
```

### Academic Records (SGPA/CGPA)
```bash
# Get student academic record
GET http://localhost:5000/api/academic/student/:studentId

# Update semester data
POST http://localhost:5000/api/academic/student/:studentId/semester
Body: {
  "semester": "1",
  "year": 1,
  "subjects": [
    {
      "subjectCode": "CS101",
      "subjectName": "Programming",
      "credits": 4,
      "marks": 85
    }
  ],
  "attendancePercentage": 90,
  "status": "completed"
}

# Get CGPA trend
GET http://localhost:5000/api/academic/student/:studentId/cgpa-trend

# Get top performers
GET http://localhost:5000/api/academic/top-performers?limit=10
```

### AI Analytics
```bash
# Get student AI analytics
GET http://localhost:5000/api/ai-analytics/student/:studentId

# Batch analyze students
POST http://localhost:5000/api/ai-analytics/batch-analyze?department=Computer%20Science

# Get at-risk students (AI)
GET http://localhost:5000/api/ai-analytics/at-risk?limit=20

# Get dashboard AI insights
GET http://localhost:5000/api/ai-analytics/dashboard-insights
```

### Activity Logs
```bash
# Get student timeline
GET http://localhost:5000/api/activities/student/:studentId?limit=50

# Get recent activities
GET http://localhost:5000/api/activities/recent?limit=100
```

---

## 🧪 TESTING THE SYSTEM

### 1. Create Test Student
```bash
POST http://localhost:5000/api/students
Body: {
  "studentId": "TEST001",
  "name": "Test Student",
  "email": "test@example.com",
  "department": "Computer Science",
  "year": 1,
  "dateOfBirth": "2000-01-01",
  "enrollmentDate": "2024-01-01",
  "status": "active"
}
```

### 2. Add Performance Data
```bash
POST http://localhost:5000/api/performance
Body: {
  "studentId": "<student_id>",
  "subjectName": "Programming",
  "attendancePercentage": 85,
  "marks": 78,
  "semester": "1"
}
```

### 3. Create Academic Record
```bash
POST http://localhost:5000/api/academic/student/<student_id>/semester
Body: {
  "semester": "1",
  "year": 1,
  "subjects": [
    {
      "subjectCode": "CS101",
      "subjectName": "Programming",
      "credits": 4,
      "marks": 85
    },
    {
      "subjectCode": "MA101",
      "subjectName": "Mathematics",
      "credits": 4,
      "marks": 78
    }
  ],
  "attendancePercentage": 85,
  "status": "completed"
}
```

### 4. Trigger AI Analysis
```bash
GET http://localhost:5000/api/ai-analytics/student/<student_id>
```

---

## 📱 FRONTEND PAGES

### Available Routes:
- `/dashboard` - Main enterprise dashboard
- `/students` - Student list
- `/students/[id]` - Student details
- `/students/[id]/edit` - Edit student
- `/students/[id]/analytics` - Student AI analytics (NEW)
- `/subjects` - Subject management
- `/performance` - Performance tracking

---

## 🎨 UI COMPONENTS

### New Components Created:
1. **EnhancedKPICard** - Advanced metrics with animations
2. **ChartCard** - Unified chart wrapper
3. **SmartFilter** - Advanced filtering system
4. **SkeletonLoader** - Loading states
5. **MultiLineChart** - Multiple datasets
6. **GradientLineChart** - Smooth gradients

---

## 🔍 TROUBLESHOOTING

### Backend Not Starting
```bash
# Check if MongoDB is accessible
# Verify .env file exists
# Check port 5000 is not in use
netstat -ano | findstr :5000
```

### Frontend Not Starting
```bash
# Clear cache
rm -rf .next
npm run dev
```

### Database Connection Issues
```bash
# Verify MongoDB URI in server/.env
# Check network connectivity
# Ensure IP is whitelisted in MongoDB Atlas
```

### API Errors
```bash
# Check backend console for errors
# Verify API endpoints are correct
# Check CORS settings
```

---

## 📊 SAMPLE DATA

### Grade Point System
```
O  = 10 (90-100%)
A+ = 9  (80-89%)
A  = 8  (70-79%)
B+ = 7  (60-69%)
B  = 6  (50-59%)
C  = 5  (40-49%)
P  = 4  (35-39%)
F  = 0  (<35%)
```

### SGPA Calculation Example
```
Subject 1: 4 credits, 85 marks → Grade A+ (9 points) → 36 credit points
Subject 2: 4 credits, 78 marks → Grade A (8 points) → 32 credit points
Subject 3: 3 credits, 92 marks → Grade O (10 points) → 30 credit points

Total Credits: 11
Total Credit Points: 98
SGPA = 98 / 11 = 8.91
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Environment Variables
```bash
# Update for production
NODE_ENV=production
MONGODB_URI=<production_mongodb_uri>
JWT_SECRET=<strong_secret_key>
FRONTEND_URL=<production_frontend_url>
```

### Build Commands
```bash
# Backend
cd server
npm start

# Frontend
npm run build
npm start
```

---

## 📞 SUPPORT

For issues or questions:
1. Check ENTERPRISE_TRANSFORMATION.md for detailed documentation
2. Review console logs for errors
3. Verify all dependencies are installed
4. Ensure MongoDB connection is active

---

## ✅ VERIFICATION CHECKLIST

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected successfully
- [ ] Dashboard loads with data
- [ ] Can create/edit students
- [ ] Performance data saves correctly
- [ ] SGPA/CGPA calculations work
- [ ] AI analytics generate insights
- [ ] Charts render properly
- [ ] Filters work correctly

---

**🎉 Your enterprise analytics platform is ready to use!**

Visit: http://localhost:3000/dashboard
