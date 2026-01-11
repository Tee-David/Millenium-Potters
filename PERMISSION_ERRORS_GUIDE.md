# Insufficient Permissions Error - Investigation Guide

## Issue Description
Credit officers are receiving "insufficient permissions" errors when trying to view loans or members created by admins.

## Root Cause Analysis

This is a **backend authorization issue**, not a frontend problem. The backend API is checking permissions and denying credit officers access to resources they should be able to view.

## Where to Check (Backend)

### 1. Authorization Middleware
**Location**: `backend/src/middleware/auth.ts` or similar

Check for role-based access control that might be too restrictive:
```typescript
// ❌ WRONG - Only allows creator to view
if (loan.createdBy !== req.user.id) {
  throw new ForbiddenError("Insufficient permissions");
}

// ✅ CORRECT - Allows credit officers to view loans they created or are assigned to
if (req.user.role === 'CREDIT_OFFICER' &&
    (loan.createdById === req.user.id || loan.assignedOfficerId === req.user.id)) {
  // Allow access
}
```

### 2. Loan/Member Controllers
**Locations to check**:
- `backend/src/controllers/loanController.ts`
- `backend/src/controllers/unionMemberController.ts`
- `backend/src/controllers/customerController.ts`

Look for permission checks like:
```typescript
// ❌ WRONG - Restricts to creator only
if (loan.createdById !== userId) {
  return res.status(403).json({ message: "Insufficient permissions" });
}

// ✅ CORRECT - Allows viewing by role and ownership/assignment
const userRole = req.user.role;
const userId = req.user.id;
const userBranchId = req.user.branchId;

if (userRole === 'CREDIT_OFFICER') {
  // Credit officers can view loans they created or are assigned to
  if (loan.createdById === userId || loan.assignedOfficerId === userId) {
    // Allow access
  }
} else if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
  // Admins and supervisors can view all loans
  // Allow access
} else if (userRole === 'BRANCH_MANAGER') {
  // Branch managers can view all loans in their branch
  if (loan.branchId === userBranchId) {
    // Allow access
  }
}
```

### 3. Database Queries
Check if queries are filtering by creator:
```typescript
// ❌ WRONG - Only returns loans created by the user
const loans = await prisma.loan.findMany({
  where: {
    createdById: req.user.id
  }
});

// ✅ CORRECT - Returns loans based on role, ownership, and assignment
const where: any = {};

if (req.user.role === 'CREDIT_OFFICER') {
  where.OR = [
    { createdById: req.user.id },
    { assignedOfficerId: req.user.id }
  ];
} else if (req.user.role === 'BRANCH_MANAGER') {
  where.branchId = req.user.branchId;
}
// Admins and supervisors see all loans, no additional filter needed

const loans = await prisma.loan.findMany({ where });
```

## Recommended Fix Strategy

### Step 1: Identify the Exact Error
Add logging in the backend to see where the error originates:
```typescript
console.log(`[Permission Check] User ${req.user.id} (${req.user.role}) attempting to access loan ${loanId}`);
console.log(`[Permission Check] Loan details:`, {
  branchId: loan.branchId,
  createdById: loan.createdById
});
```

### Step 2: Update Permission Logic
Modify the permission checks to follow this hierarchy:

**Viewing Permissions:**
- **ADMIN/SUPERVISOR**: Can view ALL records across all branches
- **CREDIT_OFFICER**: Can view records they created OR records assigned to them by admin
- **BRANCH_MANAGER**: Can view ALL records in their branch

**Editing Permissions:**
- **ADMIN**: Can edit ALL records
- **SUPERVISOR**: Can edit records in their assigned branches
- **CREDIT_OFFICER**: Can edit records they created or are assigned to

### Step 3: Test Scenarios
After fixing, test these scenarios:

1. ✅ Admin creates loan and assigns to Credit Officer A → Credit Officer A views it → Should work
2. ✅ Credit Officer A creates loan → Credit Officer A views it → Should work
3. ❌ Admin creates loan (not assigned) → Credit Officer B tries to view it → Should NOT work
4. ❌ Credit Officer A creates loan → Credit Officer B (different officer) views it → Should NOT work
5. ✅ Branch Manager views any loan in their branch → Should work

## Quick Backend Fix Template

In your loan/member GET endpoint:
```typescript
// Example: Get loan by ID
async getLoanById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userBranchId = req.user.branchId;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
        assignedOfficer: true,
      }
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // ✅ PROPER PERMISSION CHECK
    const hasAccess =
      userRole === 'ADMIN' ||
      userRole === 'SUPERVISOR' ||
      (userRole === 'CREDIT_OFFICER' && (loan.createdById === userId || loan.assignedOfficerId === userId)) ||
      (userRole === 'BRANCH_MANAGER' && loan.branchId === userBranchId);

    if (!hasAccess) {
      return res.status(403).json({
        message: "Insufficient permissions to view this loan"
      });
    }

    return res.json({ success: true, data: loan });
  } catch (error) {
    console.error("Error fetching loan:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
```

## Frontend Changes (Not Needed)
The frontend is correctly sending requests and handling responses. No frontend changes are required for this issue.

## Testing After Fix

1. Login as admin, create a loan
2. Logout, login as credit officer in the same branch
3. Navigate to the loan list
4. Click on the admin-created loan
5. ✅ Should be able to view details without "insufficient permissions" error

## Additional Notes

- Make sure the `branchId` is properly populated on users and resources
- Check that branch assignments are working correctly
- Verify that the JWT token includes role and branchId claims
- Consider adding audit logs for permission checks to aid debugging

---

**Status**: Investigation guide completed
**Next Steps**: Apply fixes in the backend codebase based on findings above
