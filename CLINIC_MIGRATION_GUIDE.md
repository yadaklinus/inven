# Clinic Management System Migration Guide

This guide will help you convert your inventory management system to a clinic management system.

## Overview

The migration involves transforming:
- **Customers** → **Students** (with medical information)
- **Sales** → **Consultations** (with diagnosis and symptoms)
- **Sale Items** → **Consultation Items** (with medicine dosage information)

## Database Schema Changes

### 1. Customer → Student Model

**New Fields Added:**
- `matricNumber` (String, unique) - Student's matriculation number
- `bloodGroup` (String) - Blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `genotype` (String) - Genotype (AA, AS, SS)
- `allergies` (String) - Comma-separated list of allergies
- `emergencyContact` (String) - Emergency contact name
- `emergencyPhone` (String) - Emergency contact phone
- `department` (String) - Student's department/faculty
- `level` (String) - Academic level (100, 200, 300, etc.)

**Removed Fields:**
- `companyName` (replaced with department)
- `type` (no longer needed for students)

### 2. Sale → Consultation Model

**New Fields Added:**
- `diagnosis` (String) - What is wrong with the student
- `symptoms` (String) - Symptoms described
- `consultantNotes` (String) - Additional notes from consultant

**Renamed Fields:**
- `selectedCustomerId` → `selectedStudentId`
- `saleItems` → `consultationItems`

### 3. SaleItem → ConsultationItem Model

**New Fields Added:**
- `dosage` (String) - How the medicine should be taken
- `frequency` (String) - How often to take (e.g., "twice daily")
- `duration` (String) - How long to take (e.g., "5 days")
- `instructions` (String) - Additional instructions

**Renamed Fields:**
- `saleId` → `consultationId`
- `customerId` → `studentId`

## API Changes

### New Endpoints Created:
- `/api/student/*` - Student management
- `/api/consultation/*` - Consultation management

### Updated Endpoints:
- Dashboard API now returns clinic metrics
- All customer references changed to student

## Frontend Changes

### Components Updated:
- `CustomersPage` → `StudentsPage`
- `AddSalesPage` → `AddConsultationPage`
- Dashboard updated with clinic terminology

### New Features Added:
- Student medical information display
- Diagnosis and symptoms input
- Medicine dosage tracking
- Blood group and genotype display
- Allergy warnings

## Migration Steps

### 1. Database Migration

```bash
# Run the migration script
node scripts/migrate-to-clinic.js

# Update Prisma schema
npx prisma generate

# Apply database changes
npx prisma migrate dev --name convert-to-clinic
```

### 2. Data Transformation

After running the migration script, you'll need to manually update the data:

#### For Students:
1. Add matriculation numbers for each student
2. Add blood group information
3. Add genotype information
4. Add any known allergies
5. Add emergency contact information
6. Add department and level information

#### For Consultations:
1. Add diagnosis information for each consultation
2. Add symptoms if available
3. Add consultant notes

#### For Consultation Items:
1. Add dosage information for each medicine
2. Add frequency (how often to take)
3. Add duration (how long to take)
4. Add any special instructions

### 3. Application Updates

All the application code has been updated to use the new terminology and models. The key changes include:

- All "customer" references changed to "student"
- All "sale" references changed to "consultation"
- Medical fields added to student forms
- Diagnosis fields added to consultation forms
- Dosage fields added to medicine prescriptions

## Testing Checklist

- [ ] Students can be registered with medical information
- [ ] Consultations can be created with diagnosis
- [ ] Medicines can be prescribed with dosage information
- [ ] Dashboard shows clinic metrics
- [ ] Student medical information is displayed correctly
- [ ] Allergy warnings are shown
- [ ] Blood group and genotype are displayed
- [ ] All existing functionality works with new terminology

## Rollback Plan

If you need to rollback:

1. Restore the original Prisma schema
2. Run: `npx prisma migrate reset`
3. Restore your original application code
4. Import your data backup

## Support

If you encounter any issues during migration:

1. Check the migration report in `migration-report.json`
2. Verify all data transformations are complete
3. Test all functionality thoroughly
4. Check console logs for any errors

## Key Benefits After Migration

- **Medical Records**: Complete student medical information
- **Prescription Tracking**: Detailed medicine dosage and instructions
- **Diagnosis History**: Track of student health issues
- **Emergency Contacts**: Quick access to emergency information
- **Allergy Management**: Automatic allergy warnings
- **Blood Group Tracking**: For medical emergencies
- **Department Analytics**: Student health by department

The system is now fully converted to a clinic management system while maintaining all the original functionality for inventory and financial management.