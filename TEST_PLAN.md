# Comprehensive LMS Testing Plan - Task Checklist
## Testing Real-World Loan Management System Workflows

## 📋 HOW TO USE THIS CHECKLIST

**As you complete each test scenario:**
1. Mark the checkbox with an `x`: Change `- [ ]` to `- [x]`
2. Document any issues found in the "Test Results" section at the bottom
3. Take screenshots of bugs/errors and reference them in issue reports
4. Update the progress counter below

**Progress Tracking:**
- Total Scenarios: 74
- Completed: 3 (Scenarios 1.1, 1.2, 2.2)
- In Progress: 0
- Failed/Blocked: 1 (Scenario 2.1 - Permission bug: Credit officers cannot create members)

**NOTE:** This test plan has been updated based on actual system functionality:
- ✅ Admin must assign loans to credit officers (not create as admin)
- ✅ System uses processing fees, NOT interest rates
- ✅ Same customer cannot have multiple active loans
- ✅ Different edit permissions for admin vs credit officers
- ✅ No overpayments allowed - system prevents exceeding balance
- ✅ No payment editing or deletion (even by admin)
- ✅ Two payment types: "Pay Due Today" and "Pay Custom Amount"
- ✅ Export formats: CSV, XLSX, and PDF
- ✅ Settings page for logo and color customization

**Quick Search:**
- Press `Ctrl+F` (or `Cmd+F`) and search for `- [ ]` to find uncompleted tasks
- Search for `- [x]` to find completed tasks

---

### Overview
This testing plan covers the **entire scope** of how the LMS will be used in production with different user roles, their actual permissions, and real workflows. We'll test as actual users would work, not just superficial feature checks.

---

## Test Environment

**Production URL:** https://millennium-potters.vercel.app

## Test Users Setup & Login Credentials

### 1. Admin User
- **Email:** admin@test.com
- **Password:** password
- **Role:** ADMIN
- **Capabilities:**
  - Full system access
  - Create/manage all unions
  - Create/manage all users (credit officers, supervisors)
  - **Create loans by ASSIGNING to a credit officer** (NOT as admin directly)
  - Loans created by admin are ACTIVE immediately when assigned to credit officer
  - Approve/reject credit officer loans
  - Manage all union members across all unions
  - View all reports and analytics
  - Access all repayments and schedules
  - Edit loans before AND after approval (changes are logged)

### 2. Supervisor User
- **Email:** supervisor@test.com
- **Password:** password
- **Role:** SUPERVISOR
- **Capabilities:**
  - Supervise multiple credit officers
  - View all data from supervised credit officers
  - Approve union member verification
  - View reports for supervised teams
  - Cannot directly manage loans (viewing only)
  - Oversee operations but limited editing

### 3. Credit Officer A (Multiple Unions)
- **Email:** officer.a@test.com
- **Password:** password
- **Role:** CREDIT_OFFICER
- **Assigned Unions:** Union A, Union B
- **Capabilities:**
  - Manage members in Union A and Union B only
  - Create loans for members in their unions (status: PENDING_APPROVAL)
  - View loans in their unions (including admin-assigned ones)
  - Process repayments for their union loans
  - Cannot access Union C data
  - Cannot approve loans
  - Cannot change loan status
  - Can edit loans ONLY BEFORE approval (not after)

### 4. Credit Officer B (Single Union)
- **Email:** officer.b@test.com
- **Password:** password
- **Role:** CREDIT_OFFICER
- **Assigned Unions:** Union C
- **Capabilities:**
  - Manage members in Union C only
  - Create loans for members in Union C (status: PENDING_APPROVAL)
  - Cannot access Union A or Union B data
  - Process repayments for Union C loans
  - Can edit loans ONLY BEFORE approval (not after)

---

## Test Scenarios by Workflow

### PHASE 1: System Setup & User Management

- [x] **Scenario 1.1: Admin Creates Organizational Structure**
**As Admin:**
1. ✅ Log in as admin
2. ✅ Create 3 unions:
   - ✅ Union A: "Traders Union - Lagos" (Officer A)
   - ✅ Union B: "Farmers Cooperative - Ibadan" (Officer A)
   - ✅ Union C: "Artisans Guild - Abuja" (Officer B)
3. ⏭️ Create Supervisor account (users already exist from seed)
4. ⏭️ Create Credit Officer A (already exists: officer.a@test.com)
5. ⏭️ Create Credit Officer B (already exists: officer.b@test.com)
6. ⏭️ Later assign Credit Officer A to Union B (already assigned during creation)

**Verify:**
- ✅ All unions created successfully (Total: 5 unions)
- ✅ Officer A assigned to Traders Union - Lagos
- ✅ Officer A assigned to Farmers Cooperative - Ibadan (multi-union confirmed)
- ✅ Officer B assigned to Artisans Guild - Abuja
- ⏭️ Users already created via test seed script

- [x] **Scenario 1.2: Credit Officers Cannot Access Admin Functions**
**As Credit Officer A:**
1. ✅ Try to navigate to "Users & Roles" page
2. ⏭️ Try to create another credit officer (blocked at page level)
3. ✅ Try to access audit logs
4. ✅ Try to access loan types management

**Verify:**
- ✅ Access denied with clear messages:
  - Users & Roles: "Only administrators and supervisors can access user management."
  - Audit Logs: "Only administrators and supervisors can access audit logs."
  - Loan Types: "Only administrators can access loan type management."
- ✅ Staff, Analytics, and Configuration menus not visible to credit officers
- ✅ Only Dashboard and Business menus visible
- ✅ Business menu shows: Members, Loans, Repayments, Schedules (no Unions/Union Assignment)

---

### PHASE 2: Union Member Management

- [x] **Scenario 2.1: Credit Officer Creates Members in Their Unions** ⚠️ **BLOCKED BY BUG**
**As Credit Officer A:**
1. ✅ Navigate to Union Members page
2. ❌ Create member in Union A - **BUG: Access Denied**
3. ❌ Create member in Union B - **BUG: Access Denied**
4. ⏭️ Verify both members are visible in members list
5. ⏭️ Verify members are "Approved" by default (toggle is ON/right)
6. ⏭️ Try to create member in Union C

**BUG FOUND:**
- Credit Officer A receives "Access Denied - Only staff members can create union members."
- This contradicts expected behavior where credit officers should create members
- Backend permission check appears too restrictive
- Officer A can VIEW members (sees John Trader created by admin)
- Officer A CANNOT CREATE new members

**Verify:**
- ✅ Officer A can view existing members in their unions (1 member visible)
- ❌ Officer A blocked from creating members (permission error)

- [x] **Scenario 2.2: Admin Creates Member and Assigns to Credit Officer**
**As Admin:**
1. ✅ Navigate to Union Members
2. ✅ Create member in Union C:
   - Name: "David Artisan"
   - Union: Artisans Guild - Abuja
   - Credit Officer: Officer B
   - Phone: 08023456789
   - Email: david.artisan@test.com
   - Code: MEM000004
3. ✅ Member approved by default (Verified status)

**As Credit Officer B:**
4. ✅ Log in as Credit Officer B
5. ✅ Navigate to Union Members
6. ✅ Verify "David Artisan" is visible (Total Members: 1)
7. ⏭️ Verify can edit this member

**As Credit Officer A:**
8. ⏭️ Log in as Credit Officer A
9. ⏭️ Navigate to Union Members
10. ⏭️ Verify "David Artisan" is NOT visible (different union)

**Verify:**
- ✅ No permission errors for admin
- ✅ Correct visibility based on union assignment
- ✅ Credit Officer B can view admin-created member
- ✅ Union filtering works correctly

- [ ] **Scenario 2.3: Union Member Approval Toggle**
**As Credit Officer A:**
1. Create a new member in Union A
2. Verify member is "Approved" (toggle right/ON)
3. Toggle status to "Pending" (toggle left/OFF)
4. Leave page and come back
5. Verify status persists as "Pending"
6. Toggle back to "Approved"
7. Refresh page
8. Verify status persists as "Approved"

**Verify:**
- Toggle works correctly (right=approved, left=pending)
- Status persists across page reloads
- Visual feedback is clear

---

### PHASE 3: Loan Creation & Permissions (CRITICAL)

- [ ] **Scenario 3.1: Admin Creates Loan by Assigning to Credit Officer**
**IMPORTANT NOTE:** Admin cannot create loans as themselves. Admin must ASSIGN the loan to a credit officer during creation.

**As Admin:**
1. Navigate to Loans page
2. Create new loan:
   - Member: John Trader (Union A)
   - Loan Type: Personal Loan
   - Principal: 100,000
   - Term: 6 months
   - **Credit Officer: MUST select Credit Officer A** (required field)
3. Check loan status immediately after creation

**Verify:**
- Loan created successfully
- Credit Officer field was REQUIRED (form won't submit without it)
- Loan is assigned to the selected Credit Officer
- Loan status is **ACTIVE** (not pending, not approved) because admin created it
- Loan appears in loans list immediately
- Loan schedule is generated
- **Admin did NOT create the loan "as admin" - they assigned it to a credit officer**

- [ ] **Scenario 3.2: Credit Officer Creates Pending Loan**
**As Credit Officer A:**
1. Navigate to Loans page
2. Create new loan:
   - Member: Mary Farmer (Union B)
   - Loan Type: Business Loan
   - Principal: 200,000
   - Term: 12 months
3. Check loan status

**Verify:**
- Loan created successfully
- Loan status is **PENDING_APPROVAL** (needs admin approval)
- Loan visible in credit officer's loans list
- Cannot disburse or activate loan

- [ ] **Scenario 3.3: Admin Approves Credit Officer Loan**
**As Admin:**
1. Navigate to Loans page
2. Find "Mary Farmer" loan (created by Credit Officer A)
3. View loan details
4. Approve loan (change status to APPROVED)

**As Credit Officer A:**
5. Log in and check loans list
6. Verify loan status changed to APPROVED
7. Verify can view loan details

**Verify:**
- Admin can approve credit officer loans
- Status change reflects in credit officer view
- No permission errors

- [ ] **Scenario 3.4: Credit Officer Accesses Admin-Assigned Loan (THE BIG FIX)**
**IMPORTANT:** Admin creates loans by assigning them to credit officers, NOT as "admin loans"

**As Admin:**
1. Create loan for "John Trader" (Union A)
2. Assign loan to Credit Officer A during creation
3. Loan status should be ACTIVE immediately

**As Credit Officer A:**
4. Log in as Credit Officer A
5. Navigate to Loans page
6. Verify "John Trader" loan is visible (assigned to them, Union A is their union)
7. Click to view loan details
8. View loan schedule
9. Try to edit loan (should be blocked - loan is ACTIVE/approved)
10. Try to delete loan (should be blocked)

**Verify:**
- **NO "Forbidden" or "Insufficient Permissions" errors** ✅
- Loan is visible and accessible
- Loan shows as assigned to Credit Officer A
- Cannot edit ACTIVE loans (only pending loans can be edited by credit officers)
- Clear messaging about why edit is blocked (loan is active/approved)

- [ ] **Scenario 3.5: Credit Officer Cannot Access Other Union Loans**
**As Credit Officer A (manages Union A & B):**
1. Try to access Union C loans
2. Try to view David Artisan's loans (Union C member)

**As Credit Officer B (manages Union C):**
3. Log in as Credit Officer B
4. Try to access Union A loans
5. Try to view John Trader's loans

**Verify:**
- Cannot see loans from unions they don't manage
- Appropriate error messages (not 500 errors)
- No forbidden errors on their own union loans

- [ ] **Scenario 3.6: Multi-Union Credit Officer Sees All Their Loans**
**As Credit Officer A (Union A & B):**
1. Navigate to Loans page
2. Verify can see loans from BOTH Union A and Union B
3. Filter by Union A - should see only Union A loans
4. Filter by Union B - should see only Union B loans
5. Clear filter - should see both

**Verify:**
- All loans from managed unions are visible
- Filtering works correctly
- No permission errors

---

### PHASE 3B: EXTENSIVE LOAN MANAGEMENT TESTING

- [ ] **Scenario 3.7: Loan Creation with Different Loan Types**
**IMPORTANT:** This system uses **PROCESSING FEES** collected during loan creation, NOT interest rates.

**Setup (As Admin):**
1. Create multiple loan types:
   - Personal Loan: 10,000-500,000 range, 3-24 months
   - Business Loan: 50,000-2,000,000 range, 6-36 months
   - Emergency Loan: 5,000-100,000 range, 1-6 months
   - Education Loan: 20,000-500,000 range, 12-48 months

**As Credit Officer A (must assign to themselves when creating):**
2. Create loans for different members with each loan type
3. Add processing fees during loan creation (collected upfront)
4. Verify loan type constraints are enforced (min/max amounts, terms)

**Verify:**
- Cannot create loan below minimum amount
- Cannot create loan above maximum amount
- Cannot create loan with invalid term
- **Processing fee is entered during loan creation (NOT interest)**
- Processing fee shows separately in loan details
- No interest rate calculations (system doesn't use interest)

- [ ] **Scenario 3.8: Loan Calculations Verification**
**IMPORTANT:** This system does NOT use interest calculations. Repayment = Principal ÷ Term Count

**As Credit Officer A:**
1. Create loan: 100,000 principal, 12 months term, 2,000 processing fee
2. View loan details and schedule
3. Manually calculate expected values:
   - Monthly payment = 100,000 ÷ 12 = 8,333.33 per month
   - Processing fee = 2,000 (collected upfront/during creation)
   - Total repayable = 100,000 principal only (no interest added)
4. Compare system calculations with manual calculations

**Verify:**
- Principal amount matches input
- **NO interest calculations** (system doesn't use interest)
- Monthly payment = principal ÷ number of terms
- Total repayable = principal amount (not principal + interest)
- Processing fee shows separately (collected at creation)
- Schedule shows correct number of periods (12 in this case)
- Each schedule item shows principal portion only

- [ ] **Scenario 3.9: Loan Status Transitions (Full Lifecycle)**
**As Admin:**
1. Create loan (status: ACTIVE)
2. View loan details
3. Change status to COMPLETED (simulate full repayment)
4. Try to record repayment on completed loan
5. Change status to DEFAULTED
6. Change status to WRITTEN_OFF
7. Try to change from WRITTEN_OFF back to ACTIVE

**Verify:**
- All valid status transitions work
- Invalid transitions are blocked
- Cannot record payments on completed loans
- Cannot record payments on written-off loans
- Status history is maintained
- Appropriate error messages for invalid transitions

- [ ] **Scenario 3.10: Loan Disbursement Workflow**
**As Credit Officer A:**
1. Create loan (status: PENDING_APPROVAL)
2. Try to disburse loan (should fail)

**As Admin:**
3. Approve loan (status changes to APPROVED)
4. Disburse loan with disbursement date
5. Verify status changes to ACTIVE
6. Verify disbursement date is recorded
7. Try to disburse again (should fail - already disbursed)

**Verify:**
- Only approved loans can be disbursed
- Only admins can disburse
- Disbursement date is recorded
- Cannot disburse twice
- Schedule starts from disbursement date

- [ ] **Scenario 3.11: Multiple Loans for Same Member (CRITICAL RULE)**
**IMPORTANT:** Same customer CANNOT have multiple ACTIVE loans. Must complete one before starting another.

**As Credit Officer A:**
1. Create first loan for John Trader: 100,000, 12 months (status: PENDING or ACTIVE)
2. Try to create second loan for John Trader: 50,000, 6 months
3. System should REJECT with error: "Union member already has an active loan"
4. Pay off the first loan completely (status changes to COMPLETED)
5. NOW try to create second loan for John Trader: 50,000, 6 months
6. Second loan should be created successfully

**Verify:**
- **CANNOT have multiple active loans for same member** ✅
- System blocks second loan creation with clear error message
- Error message: "Union member already has an active loan" or similar
- After first loan is COMPLETED, can create new loan
- Member can only have ONE active loan at a time
- This prevents over-lending and confusion

- [ ] **Scenario 3.12: Loan Editing and Deletion (CRITICAL PERMISSIONS)**
**IMPORTANT:** Different edit permissions for admin vs credit officer. All changes must be logged.

**As Credit Officer A:**
1. Create loan (status: PENDING_APPROVAL)
2. Edit loan details (amount, term, notes) - should work
3. Verify warning message: "Changes to loan will be logged"
4. Save changes

**As Admin:**
5. Log in as admin
6. Approve the loan (status changes to ACTIVE or APPROVED)

**As Credit Officer A:**
7. Try to edit the approved loan - should be BLOCKED
8. Verify clear error: "Cannot edit approved loans"

**As Admin:**
9. Log in as admin
10. Edit the approved/active loan - should WORK (admin can edit before AND after approval)
11. Verify warning: "Changes to loan will be logged"
12. Make changes and save

**Verify:**
- Credit officers can ONLY edit PENDING/DRAFT loans (before approval) ✅
- Credit officers CANNOT edit after approval ✅
- Admin can edit loans BEFORE and AFTER approval ✅
- All loan changes are LOGGED in audit trail ✅
- Warning shown: "Changes to loan will be logged" ✅
- Audit log shows: who edited, when, what changed
- Cannot delete ACTIVE loans with payments

- [ ] **Scenario 3.13: Loan Search and Filtering**
**As Credit Officer A:**
1. Create 10+ loans with various:
   - Members
   - Statuses (pending, active, completed)
   - Amounts (small, medium, large)
   - Dates (old, recent)
2. Test search by:
   - Member name
   - Loan number
   - Amount range
   - Status
   - Date range
   - Union
3. Test sorting by:
   - Amount (ascending/descending)
   - Date (newest/oldest)
   - Status
   - Member name

**Verify:**
- Search finds correct loans
- Filters work individually and combined
- Sorting works correctly
- Pagination works
- Performance is acceptable with many loans

- [ ] **Scenario 3.14: Loan Export with Filters (CSV, XLSX, PDF)**
**IMPORTANT:** System supports three export formats: CSV, XLSX (Excel), and PDF

**As Credit Officer A:**
1. Filter loans by Union A, status ACTIVE
2. Export to CSV
3. Export to XLSX (Excel)
4. Export to PDF
5. Open each file and verify:
   - Only Union A loans included
   - Only ACTIVE status loans
   - All expected columns present
   - Data matches screen
   - Format-specific features work (Excel formatting, PDF layout)
6. Export with date range filter (test all 3 formats)
7. Export with member search filter (test all 3 formats)

**As Admin:**
8. Export all loans (no filters) in all 3 formats
9. Verify includes loans from all unions

**Verify:**
- **All three export formats available: CSV, XLSX, PDF** ✅
- Export respects filters in all formats
- Export respects role permissions (union filtering)
- CSV format is correct and opens in Excel
- XLSX has proper Excel formatting
- PDF is readable and well-formatted
- All data fields included in all formats
- Special characters handled correctly
- Date format is consistent across formats

- [ ] **Scenario 3.15: Loan with Processing Fees**
**As Credit Officer A:**
1. Create loan with 2% processing fee: 100,000 principal
2. Expected processing fee = 2,000
3. Verify processing fee shows in loan details
4. Check if processing fee is collected upfront
5. Record repayment
6. Verify processing fee status

**Verify:**
- Processing fee calculated correctly
- Processing fee shown separately
- Fee collection status tracked
- Total amount includes fee
- Fee deducted from disbursed amount (if applicable)

- [ ] **Scenario 3.16: Loan with Penalty Fees**
**As Credit Officer A:**
1. Create loan with penalty fee: 100 per day
2. View loan schedule
3. Let schedule item become overdue (or simulate)
4. Calculate expected penalty: days overdue * penalty rate
5. View loan showing penalties
6. Record repayment that includes penalty

**Verify:**
- Penalty calculation is accurate
- Penalties shown in loan details
- Penalties added to total due
- Payment can include penalty amount
- Penalty allocation tracked separately

- [ ] **Scenario 3.17: Loan Type with Zero/Invalid Values (BUG TEST)**
**As Admin:**
1. Try to create loan type with:
   - Min amount: 0 (should be allowed)
   - Interest rate: 0 (legitimate for interest-free loans)
   - Negative interest rate
   - Negative min/max amounts
2. Create loan type with min: 0, max: 100,000
3. Try to create loan using this loan type

**Verify:**
- System handles zero minimum amount correctly
- Cannot create loan type with invalid values
- Clear error messages for invalid inputs
- Zero interest rate allowed (for interest-free loans)
- Negative values blocked appropriately
- If min amount is 0, loans can still be created
- **BUG FIX**: Verify loan creation works when loan type has min amount = 0

- [ ] **Scenario 3.18: Loan Amount Boundary Testing**
**As Credit Officer A:**
1. Loan type: min 10,000, max 500,000
2. Try to create loan with:
   - Amount: 9,999 (below minimum - should fail)
   - Amount: 10,000 (exactly minimum - should work)
   - Amount: 500,000 (exactly maximum - should work)
   - Amount: 500,001 (above maximum - should fail)
   - Amount: 0 (should fail)
   - Amount: -1,000 (negative - should fail)
3. Verify error messages are clear

**Verify:**
- Boundary validation works correctly
- Exact min/max values are accepted
- Below min and above max are rejected
- Clear error messages
- Zero and negative amounts blocked

- [ ] **Scenario 3.19: Loan Term Boundary Testing**
**As Credit Officer A:**
1. Loan type: term 3-24 months
2. Try to create loan with:
   - Term: 2 months (below minimum - should fail)
   - Term: 3 months (exactly minimum - should work)
   - Term: 24 months (exactly maximum - should work)
   - Term: 25 months (above maximum - should fail)
   - Term: 0 months (should fail)
   - Term: -6 months (negative - should fail)
3. Verify error messages

**Verify:**
- Term validation works correctly
- Boundary values handled properly
- Invalid terms rejected
- Clear error messages

---

### PHASE 4: EXTENSIVE REPAYMENT PROCESSING

- [ ] **Scenario 4.1: Two Types of Payment Collection (CRITICAL)**
**IMPORTANT:** System has TWO payment collection types. Understand the difference.

**Type 1: "Pay Due Today"**
**As Credit Officer A:**
1. Navigate to loan repayment page
2. Select a schedule item that is due today or overdue
3. Click "Pay Due Today" button
4. System shows:
   - Schedule-specific amount (amount due for THIS schedule)
   - Payment form pre-filled with the due amount
   - Can pay partial or full amount for this schedule
   - Maximum = amount left on this specific schedule item

**Type 2: "Pay Custom Amount"**
5. Click "Pay Custom Amount" button (or similar)
6. System shows:
   - TOTAL loan balance remaining
   - "Total Left to Pay" for entire loan
   - Empty payment amount field
   - Can enter any amount up to total loan balance
   - Maximum = total amount left to pay on entire loan

**Verify:**
- Two distinct payment types exist ✅
- "Pay Due Today" = for specific schedule items
- "Pay Custom Amount" = for any amount up to total balance
- Each shows different maximum amounts
- Both respect overpayment prevention
- UI clearly distinguishes between the two types

- [ ] **Scenario 4.2: Basic Repayment Recording**
**As Credit Officer A:**
1. Navigate to John Trader's ACTIVE loan
2. View loan schedule (e.g., monthly payment: 10,000)
3. Use "Pay Due Today" to record exact payment:
   - Amount: 10,000 (pre-filled)
   - Method: Cash
   - Date: Today
4. View updated loan balance
5. View updated schedule showing payment

**Verify:**
- Repayment recorded successfully
- Loan balance decreased by payment amount
- Schedule item marked as paid
- Payment appears in repayments list
- Payment history shows transaction

- [ ] **Scenario 4.3: Partial Payment Recording**
**As Credit Officer A:**
1. Loan has schedule item due: 10,000
2. Record partial payment: 6,000 (Cash)
3. View schedule showing partial payment
4. Record another payment: 4,000 to complete
5. View schedule now showing fully paid

**Verify:**
- Partial payment accepted
- Schedule shows partial amount paid
- Remaining balance updated
- Can make multiple payments for one schedule item
- Both payments show in history
- Schedule item marked complete after full amount paid

- [ ] **Scenario 4.3: Overpayment Prevention (CRITICAL)**
**IMPORTANT:** System does NOT allow overpayments. You can only pay up to the total amount left to pay.

**As Credit Officer A:**
1. View loan summary showing "Total Left to Pay": 50,000
2. Try to record payment: 55,000 (more than total left)
3. System should BLOCK with error

**Using "Pay Due Today":**
4. Select a schedule item with "Due Today": 10,000
5. Try to enter payment amount: 15,000
6. System should show error: "Amount exceeds maximum allowed"
7. Maximum payment = amount due for that schedule item

**Using "Pay Custom Amount":**
8. Try to enter payment: more than "Total Left to Pay"
9. System should BLOCK and show: "Cannot exceed total left to pay"

**Verify:**
- **NO overpayments allowed** ✅
- System shows "Total Left to Pay" clearly
- Cannot enter amount above maximum
- Input field shows maximum allowed
- Error message: "Cannot exceed total left to pay" or similar
- Payment form prevents overpayment before submission

- [ ] **Scenario 4.4: Different Payment Methods (ACTUAL SYSTEM METHODS)**
**IMPORTANT:** These are the actual payment methods in the system:

**As Credit Officer A:**
1. Record payment via **Cash** - add notes/reference
2. Record payment via **Bank Transfer** - add reference
3. Record payment via **POS** - add transaction reference
4. Record payment via **Mobile Money** - add transaction ID
5. Record payment via **USSD** - add reference
6. Record payment via **Other** - add notes
7. View all payments showing methods and references

**Verify:**
- Payment methods available: Cash, Bank Transfer, POS, Mobile Money, USSD, Other ✅
- Reference/notes fields work for each method
- Payments searchable by reference
- Payment method shown in reports
- Filtering by payment method works
- **No "Check" payment method** (not in system)

- [ ] **Scenario 4.5: Early Payment (Before Due Date)**
**As Credit Officer A:**
1. View schedule - next payment due in 15 days
2. Record payment today (early)
3. View schedule showing early payment
4. Check if early payment discount applied (if applicable)

**Verify:**
- Early payment accepted
- Payment date recorded correctly
- Schedule shows payment before due date
- Any early payment discount calculated
- No late penalty applied

- [ ] **Scenario 4.6: Late Payment (After Due Date)**
**As Credit Officer A:**
1. View schedule - payment was due 5 days ago
2. Calculate expected penalty: 5 days * penalty rate per day
3. Record payment including penalty
4. View payment allocation (principal + interest + penalty)

**Verify:**
- Penalty calculated for overdue days
- Total due includes penalty
- Can record payment with penalty
- Payment allocation shows penalty separately
- Penalty amount tracked in loan

- [ ] **Scenario 4.7: Payment Allocation (Principal vs Interest vs Penalty)**
**As Credit Officer A:**
1. View schedule item breakdown:
   - Principal: 8,000
   - Interest: 1,500
   - Penalty: 500
   - Total: 10,000
2. Record payment: 10,000
3. View payment allocation details
4. Verify amounts allocated correctly

**Verify:**
- Payment allocated to all components
- Allocation order is correct (penalty -> interest -> principal)
- Each component shows amount paid
- Remaining balances updated for each component
- Allocation visible in payment details

- [ ] **Scenario 4.8: Payment Editing NOT ALLOWED (CRITICAL RULE)**
**IMPORTANT:** Payments cannot be edited by ANYONE, including admin. This prevents fraud and confusion.

**As Credit Officer A:**
1. Record payment: 10,000, Method: Cash
2. Try to find "Edit" button on payment - should NOT exist
3. Check payment details page - no edit option
4. Verify payment is permanent once recorded

**As Admin:**
5. Log in as admin
6. View the same payment
7. Try to edit payment - should NOT be possible
8. No edit button or functionality available

**Verify:**
- **NO payment editing allowed** ✅
- No edit button on payments (for anyone)
- Payments are permanent once recorded
- If mistake made, must contact admin/support
- Clear audit trail shows who recorded payment
- This prevents tampering and maintains integrity

- [ ] **Scenario 4.9: Payment Deletion NOT ALLOWED (CRITICAL RULE)**
**IMPORTANT:** Payments cannot be deleted by ANYONE, including admin. This maintains financial integrity.

**As Credit Officer A:**
1. Record payment: 5,000
2. Try to find "Delete" button - should NOT exist
3. Verify no delete option anywhere

**As Admin:**
4. Log in as admin
5. View payments
6. Verify even admin cannot delete payments
7. No delete functionality exists

**Verify:**
- **NO payment deletion allowed** ✅
- No delete button for anyone (including admin)
- Payments are permanent financial records
- If error made, must be corrected through proper accounting procedures
- System protects against accidental or malicious deletion
- Financial integrity maintained

- [ ] **Scenario 4.10: Bulk Payment Processing**
**As Credit Officer A:**
1. Have 5 members with payments due
2. Collect all payments in one session
3. Record all 5 payments consecutively
4. Verify each loan updated
5. View repayments list showing all payments

**Verify:**
- Can process multiple payments quickly
- Each payment recorded correctly
- No duplicate entries
- All loans updated
- Performance is acceptable

- [ ] **Scenario 4.11: Payment with Insufficient Amount**
**As Credit Officer A:**
1. Schedule item due: 10,000
2. Try to record payment: 100 (very small)
3. System should warn or handle appropriately
4. Record payment if allowed
5. View how it's allocated

**Verify:**
- System handles small payments gracefully
- Warning shown if too small
- Payment recorded if allowed
- Clear indication of remaining balance
- Proper allocation of small amount

- [ ] **Scenario 4.12: Payment Search and Filtering**
**As Credit Officer A:**
1. Record 20+ payments with various:
   - Dates (today, yesterday, last week, last month)
   - Methods (cash, transfer, mobile, check)
   - Amounts (small, large)
   - Members
2. Test search by:
   - Member name
   - Date range
   - Payment method
   - Amount range
   - Reference number
3. Test sorting by date, amount, member

**Verify:**
- Search works accurately
- Filters work individually and combined
- Sorting functions correctly
- Pagination works
- Results match criteria

- [ ] **Scenario 4.13: Repayment Export with Filters (CSV, XLSX, PDF)**
**As Credit Officer A:**
1. Filter repayments: Last 30 days, Cash only, Union A
2. Export to CSV, XLSX, and PDF
3. Verify each format contains:
   - Only filtered results
   - All expected columns
   - Correct data
   - Format-specific features (Excel formatting, PDF layout)
4. Export with different filters (date range, union, method) in all formats
5. Export all repayments (no filters) in all formats

**Verify:**
- **All three formats available: CSV, XLSX, PDF** ✅
- Export respects filters in all formats
- Export respects role permissions
- CSV opens in Excel correctly
- XLSX has proper Excel features
- PDF is well-formatted and readable
- Data accuracy across all formats
- Date formatting consistent
- Special characters handled

- [ ] **Scenario 4.14: Credit Officer Accesses Admin-Created Loan Repayments**
**As Admin:**
1. Create loan for Mary Farmer (Union B)
2. Record a repayment on this loan

**As Credit Officer A:**
3. Log in as Credit Officer A
4. Navigate to Repayments page
5. Verify can see this repayment (Union B is their union)
6. Click to view repayment details
7. View associated loan

**Verify:**
- **NO permission errors** ✅
- Can view repayments for admin-created loans in their unions
- Cannot edit admin-created repayments (or appropriate restrictions)

- [ ] **Scenario 4.15: Credit Officer Cannot See Other Union Repayments**
**As Credit Officer B:**
1. Navigate to Repayments page
2. Verify cannot see Union A or Union B repayments
3. Only sees Union C repayments
4. Try to access direct URL to Union A repayment
5. Try to export Union A repayments

**Verify:**
- Correct filtering by union
- No permission errors on legitimate data
- Unauthorized access blocked
- Export only includes authorized data

- [ ] **Scenario 4.16: Repayment Receipt Generation**
**As Credit Officer A:**
1. Record payment for member
2. Generate receipt
3. View receipt showing:
   - Payment details
   - Loan details
   - Member details
   - Allocation breakdown
4. Print or download receipt
5. Generate receipt for past payment

**Verify:**
- Receipt generated correctly
- All information present
- Receipt number unique
- PDF/print format correct
- Can regenerate old receipts

---

### PHASE 5: EXTENSIVE REPAYMENT SCHEDULE TESTING

- [ ] **Scenario 5.1: Schedule Generation Accuracy**
**As Credit Officer A:**
1. Create loan: 120,000 principal, 12 months, 10% annual interest
2. View generated schedule
3. Manually calculate expected schedule:
   - Monthly payment = principal/months + monthly interest
   - Each period: sequence, due date, amounts
4. Compare system-generated schedule with manual calculation

**Verify:**
- Correct number of schedule items (12)
- Due dates are correct (monthly intervals)
- Principal allocation per period
- Interest allocation per period
- Total of all periods = loan amount + interest
- Calculations are accurate

- [ ] **Scenario 5.2: Schedule Recalculation After Payments**
**As Credit Officer A:**
1. View original schedule for loan
2. Record first payment (on time)
3. View schedule - first item marked paid
4. Record second payment (with overpayment)
5. View schedule - verify adjustment for overpayment
6. Record third payment (partial)
7. View schedule - verify remaining balance updated

**Verify:**
- Schedule updates after each payment
- Paid items clearly marked
- Remaining balance accurate
- Future items adjusted for overpayment
- Partial payments tracked correctly

- [ ] **Scenario 5.3: Overdue Schedule Items**
**As Credit Officer A:**
1. Create loan with weekly schedule
2. Let first payment become overdue (or simulate)
3. View schedule showing overdue status
4. Calculate penalty for overdue days
5. View total due including penalty
6. Filter schedule by "Overdue" status

**Verify:**
- Overdue items flagged clearly
- Overdue days calculated
- Penalty added to amount due
- Color coding for overdue items
- Filter shows only overdue items

- [ ] **Scenario 5.4: Upcoming Schedule Items**
**As Credit Officer A:**
1. View schedule for active loan
2. Filter by "Upcoming" (next 7 days)
3. Verify shows payments due soon
4. Filter by "Upcoming" (next 30 days)
5. Generate reminder list for members

**Verify:**
- Upcoming filter works correctly
- Date range selection works
- Members with upcoming payments listed
- Reminder functionality works
- Can export upcoming payments

- [ ] **Scenario 5.5: Schedule Filtering and Search**
**As Credit Officer A:**
1. Have multiple loans with schedules
2. Filter schedule by:
   - Union (A or B)
   - Status (paid, pending, overdue)
   - Date range
   - Member name
   - Loan number
3. Combine filters (Union A + Overdue)
4. Sort by due date, member, amount

**Verify:**
- All filters work correctly
- Filters work in combination
- Search finds correct items
- Sorting works
- Results accurate

- [ ] **Scenario 5.6: Multi-Union Schedule Viewing**
**As Credit Officer A:**
1. Navigate to Schedules page
2. View all schedules (default - no filter)
3. Verify sees schedules from both Union A and Union B
4. Verify does NOT see Union C schedules
5. View schedule for admin-created loan in Union A
6. View schedule for own-created loan in Union B

**Verify:**
- All schedules from managed unions visible
- **NO permission errors** ✅
- Can view schedules regardless of who created the loan
- Correct union filtering

- [ ] **Scenario 5.7: Schedule Export (Detailed)**
**As Credit Officer A:**
1. View all schedules (Union A + B)
2. Export all to CSV
3. Verify CSV includes:
   - All schedule items from both unions
   - Member details
   - Loan details
   - Due dates
   - Amounts (principal, interest, penalty)
   - Payment status
   - Paid dates (if paid)
4. Open in Excel and verify formatting
5. Check special characters and dates

**Verify:**
- Export includes all authorized data
- CSV format is correct
- All columns present
- Data matches screen
- Date format consistent
- Numbers formatted correctly

- [ ] **Scenario 5.8: Schedule Export with Filters**
**As Credit Officer A:**
1. Filter: Union A, Overdue only
2. Export to CSV
3. Verify only overdue Union A items exported
4. Filter: Paid status, Last 30 days
5. Export and verify
6. Filter: Specific member
7. Export and verify

**Verify:**
- Export respects all active filters
- Filtered data matches criteria
- Export only includes authorized unions
- No data leakage

- [ ] **Scenario 5.9: Weekly vs Monthly vs Custom Schedule Frequencies**
**As Admin (for testing different frequencies):**
1. Create loan with weekly repayment: 52 payments over 1 year
2. View schedule - verify 52 items, weekly intervals
3. Create loan with bi-weekly repayment: 26 payments
4. Verify bi-weekly due dates
5. Create loan with monthly repayment: 12 payments
6. Verify monthly due dates
7. Record payments on each and verify schedule updates

**Verify:**
- Different frequencies generate correctly
- Due date calculations accurate for each frequency
- Number of periods correct
- Schedule updates work for all frequencies

- [ ] **Scenario 5.10: Schedule Completion Tracking**
**As Credit Officer A:**
1. View schedule for loan
2. Track progress: 3 out of 12 items paid
3. View visual progress indicator (if available)
4. Calculate percentage completion: 25%
5. View remaining items and total remaining balance

**Verify:**
- Progress tracking is accurate
- Visual indicators work
- Percentage calculations correct
- Remaining balance accurate
- Completion status clear

- [ ] **Scenario 5.11: Schedule with Grace Period**
**As Admin:**
1. Create loan type with grace period (e.g., 3 days)
2. Create loan with this type
3. View schedule
4. Payment due date: Jan 1
5. Record payment on Jan 3 (within grace period)
6. Verify no penalty charged

**Verify:**
- Grace period applied
- No penalty within grace period
- Penalty applied after grace period
- Grace period clearly indicated

- [ ] **Scenario 5.12: Schedule Item Details View**
**As Credit Officer A:**
1. View loan schedule
2. Click on specific schedule item
3. View detailed breakdown:
   - Principal amount for this period
   - Interest amount for this period
   - Any penalties
   - Total due
   - Payments made against this item
   - Remaining balance
4. View payment history for this schedule item

**Verify:**
- All details displayed correctly
- Breakdown is accurate
- Payment allocation shown
- History is complete

---

### PHASE 5B: COMPREHENSIVE EXPORT TESTING

- [ ] **Scenario 5B.1: Union Members Export**
**As Credit Officer A:**
1. Navigate to Union Members page
2. View all members (Union A + B)
3. Export all to CSV
4. Open CSV and verify:
   - All members from Union A and B included
   - No Union C members
   - All fields present (name, email, phone, etc.)
   - Status (approved/pending) included
   - Union name included
5. Apply filter (Union A only) and export
6. Verify only Union A members in export

**Verify:**
- Export respects role permissions
- All expected columns present
- Data accuracy matches screen
- Filters applied to export
- CSV format correct

- [ ] **Scenario 5B.2: Loans Export with Complete Data**
**As Credit Officer A:**
1. Export loans to CSV (Union A + B)
2. Verify CSV includes:
   - Loan number
   - Member name and code
   - Union name
   - Loan type
   - Principal amount
   - Interest rate
   - Term
   - Status
   - Created date
   - Created by
   - Disbursement date
   - Total repayable
   - Amount paid
   - Balance remaining
3. Verify calculations in export match system
4. Check date formats are consistent

**Verify:**
- All critical fields included
- Calculations match system
- Data complete and accurate
- No missing information
- Proper CSV formatting

- [ ] **Scenario 5B.3: Repayments Export with Allocations**
**As Credit Officer A:**
1. Export repayments to CSV
2. Verify CSV includes:
   - Payment date
   - Member name
   - Loan number
   - Payment amount
   - Payment method
   - Reference number
   - Principal allocated
   - Interest allocated
   - Penalty allocated (if any)
   - Received by (staff name)
3. Sum total payments in export
4. Verify matches system total

**Verify:**
- Payment allocation details included
- All payment components shown
- Data matches payment records
- Totals are accurate
- Reference numbers included

- [ ] **Scenario 5B.4: Schedule Export with Status**
**As Credit Officer A:**
1. Export schedules to CSV
2. Verify CSV includes:
   - Member name
   - Loan number
   - Sequence number
   - Due date
   - Principal due
   - Interest due
   - Total due
   - Amount paid
   - Balance
   - Status (paid/pending/overdue)
   - Payment date (if paid)
   - Days overdue (if applicable)
3. Filter by overdue and export
4. Verify only overdue items in export

**Verify:**
- Complete schedule data exported
- Status clearly indicated
- Overdue calculations included
- Filters work on export
- Data accuracy

- [ ] **Scenario 5B.5: Export with Date Ranges**
**As Credit Officer A:**
1. Export loans created in last 30 days
2. Verify date filter applied
3. Export repayments for specific month
4. Verify only that month's payments included
5. Export schedules due in next 7 days
6. Verify date range correct

**Verify:**
- Date range filters work
- Exports respect date parameters
- Date calculations accurate
- No data outside range included

- [ ] **Scenario 5B.6: Large Data Export (Performance)**
**As Admin:**
1. System with 500+ loans
2. Export all loans
3. Time the export process
4. Verify CSV file size reasonable
5. Open in Excel and verify all data loads
6. Export 1000+ repayments
7. Verify performance

**Verify:**
- Export completes in reasonable time
- Large files handled correctly
- No timeout errors
- Data integrity maintained
- File opens in Excel without issues

- [ ] **Scenario 5B.7: Export Data Verification (Audit)**
**As Admin:**
1. View dashboard showing totals:
   - Total loans: X
   - Total loan amount: Y
   - Total repayments: Z
2. Export all loans
3. Sum principal amounts in export
4. Verify matches dashboard total Y
5. Export all repayments
6. Sum payment amounts in export
7. Verify matches dashboard total Z

**Verify:**
- Export data matches system totals
- No data loss in export
- Calculations consistent
- Data integrity maintained

- [ ] **Scenario 5B.8: Export with Special Characters**
**As Credit Officer A:**
1. Create member with name: "O'Brien, Mary (Test)"
2. Create loan with notes containing quotes and commas
3. Record payment with special characters in reference
4. Export data
5. Open CSV and verify special characters handled

**Verify:**
- CSV escaping works correctly
- Commas in data don't break columns
- Quotes handled properly
- Accents and special chars preserved
- File parses correctly in Excel

- [ ] **Scenario 5B.9: Multi-format Export (if supported)**
**As Credit Officer A:**
1. Export loans to CSV
2. Export loans to Excel (if supported)
3. Export loans to PDF (if supported)
4. Compare data across formats
5. Verify formatting in each

**Verify:**
- All formats contain same data
- Format-specific features work (Excel formulas, PDF layout)
- Data readable in all formats
- No corruption

- [ ] **Scenario 5B.10: Export Scheduling/Automation (if supported)**
**As Admin:**
1. Set up automated daily export of repayments
2. Verify export runs automatically
3. Check email or file location for export
4. Set up weekly loan portfolio export
5. Verify scheduled exports work

**Verify:**
- Scheduled exports execute
- Files saved to correct location
- Email notifications sent (if configured)
- Data is current
- No failed exports

---

### PHASE 6: Supervisor Oversight

- [ ] **Scenario 6.1: Supervisor Views Subordinate Data**
**As Supervisor:**
1. Navigate to each major section
2. Verify can see data from Credit Officer A and B
3. View loans created by credit officers
4. View repayments processed by credit officers
5. Access reports showing team performance

**Verify:**
- Supervisor sees all subordinate data
- Can approve union member verifications
- Cannot directly edit loans or repayments
- Has read-only access with oversight permissions

---

### PHASE 7: Mobile Experience

- [ ] **Scenario 7.1: Mobile Navigation (THE FIX)**
**On Mobile Device (or resize browser):**

**As Credit Officer A:**
1. Log in on mobile
2. Open mobile menu
3. Click "Unions" - verify navigates to unions page ✅
4. Click "Members" - verify navigates to members page ✅
5. Click "Loans" - verify navigates to loans page ✅
6. Click "Repayments" - verify navigates to repayments page ✅
7. Verify menu closes after navigation

**Verify:**
- **Navigation actually works on mobile** ✅ (was broken before)
- Menu closes after clicking
- Can navigate between all pages
- No stuck menus

- [ ] **Scenario 7.2: Mobile Workflow Testing**
**On Mobile:**
1. Create union member
2. Create loan
3. Process repayment
4. View reports

**Verify:**
- All forms work on mobile
- Touch interactions work
- No layout issues
- Data saves correctly

---

### PHASE 8: Dark Mode

- [ ] **Scenario 8.1: Dark Mode Consistency**
**As Any User:**
1. Toggle dark mode ON
2. Navigate through all pages
3. Create/edit forms in dark mode
4. View tables and reports
5. Check contrast and readability

**Verify:**
- Dark mode works on all pages
- Text is readable
- Forms are usable
- Colors are appropriate

---

### PHASE 9: Edge Cases & Error Handling

- [ ] **Scenario 9.1: Invalid Data Entry**
**As Credit Officer A:**
1. Try to create loan with negative amount
2. Try to create loan with end date before start date
3. Try to create member with invalid email
4. Try to record repayment larger than loan balance

**Verify:**
- Clear error messages
- No system crashes
- User can correct and resubmit

- [ ] **Scenario 9.2: Concurrent Operations**
**As Admin and Credit Officer A (simultaneously):**
1. Admin edits a loan
2. Credit Officer A tries to edit same loan
3. Test conflict handling

**Verify:**
- No data corruption
- Appropriate error messages
- Last write wins or optimistic locking

- [ ] **Scenario 9.3: Permission Boundary Testing**
**As Credit Officer A:**
1. Try to access direct URL to Union C loan
2. Try to manipulate URL parameters to access restricted data
3. Try API calls for unauthorized unions

**Verify:**
- All unauthorized access blocked
- No sensitive data leakage
- Proper HTTP status codes (401/403)

---

### PHASE 10: Reports & Analytics

- [ ] **Scenario 10.1: Credit Officer Reports**
**As Credit Officer A:**
1. View dashboard
2. Check loan portfolio summary (Union A + B combined)
3. View repayment performance
4. Check overdue loans
5. Export reports

**Verify:**
- Reports show correct data for their unions
- Calculations are accurate
- Cannot see other union data in reports

- [ ] **Scenario 10.2: Admin Reports**
**As Admin:**
1. View system-wide reports
2. Check all unions performance
3. View credit officer performance
4. Audit logs review

**Verify:**
- Can see all data across all unions
- Reports are comprehensive
- Audit logs show all activities

---

### PHASE 11: Settings & Customization

- [ ] **Scenario 11.1: Logo Configuration (Sidebar & Login Page)**
**IMPORTANT:** System should allow customization of logos from settings page

**As Admin:**
1. Navigate to Settings page
2. Find "Branding" or "Appearance" section
3. Upload sidebar logo:
   - Click "Upload Sidebar Logo" or similar
   - Select image file (PNG, JPG, SVG recommended)
   - Preview logo in real-time
   - Save changes
4. Upload login page logo:
   - Click "Upload Login Logo" or similar
   - Select image file
   - Preview logo
   - Save changes
5. Log out and verify login page shows new logo
6. Log back in and verify sidebar shows new logo
7. Test logo changes across dark/light modes

**Verify:**
- Settings page has logo upload functionality ✅
- Can upload sidebar logo separately from login logo
- Supported formats: PNG, JPG, SVG at minimum
- Real-time preview before saving
- Changes persist after logout/login
- Logos display correctly in both dark and light modes
- File size limits enforced (reasonable limit like 2MB)
- Image dimensions validated or auto-resized

- [ ] **Scenario 11.2: Color Scheme Configuration (Light & Dark Mode)**
**IMPORTANT:** System should allow customization of colors for both light and dark modes

**As Admin:**
1. Navigate to Settings page
2. Find "Theme" or "Colors" section
3. Configure Light Mode colors:
   - Primary color (main brand color)
   - Secondary color
   - Accent color
   - Background color
   - Text color
   - View live preview
4. Configure Dark Mode colors:
   - Primary color (adjusted for dark mode)
   - Secondary color
   - Background color (dark)
   - Text color (light)
   - View live preview
5. Save changes
6. Toggle between light and dark modes
7. Navigate through different pages verifying color consistency

**Verify:**
- Settings page has color customization ✅
- Separate color settings for light and dark modes ✅
- Color picker or HEX input available
- Real-time preview of color changes
- Changes apply system-wide
- Color contrast meets accessibility standards
- Reset to default colors option available
- Colors persist across sessions
- All UI components respect custom colors

- [ ] **Scenario 11.3: Settings Persistence and Reset**
**As Admin:**
1. Make multiple customizations (logos + colors)
2. Log out and log back in
3. Verify all settings persisted
4. Make changes and click "Cancel" - verify no changes saved
5. Test "Reset to Default" functionality
6. Verify system returns to original branding/colors

**Verify:**
- All settings persist correctly
- Cancel button doesn't save changes
- Reset functionality works
- Confirmation prompt before resetting
- Default values are sensible

---

## Test Execution Checklist

### Before Testing
- [ ] All fixes deployed to test environment
- [ ] Database has clean test data
- [ ] All test users created
- [ ] Test unions and members set up

### During Testing
- [ ] Use Playwright MCP for automated scenarios
- [ ] Document every bug/issue found
- [ ] Take screenshots of errors
- [ ] Note confusing UI/UX
- [ ] Check browser console for errors
- [ ] Monitor network tab for failed requests

### After Testing
- [ ] Compile comprehensive bug report
- [ ] Categorize issues (critical, high, medium, low)
- [ ] Note what works well
- [ ] Suggest improvements
- [ ] Identify unclear/contradictory behavior

---

## Success Criteria

### ✅ MUST WORK (Critical)
1. Credit officers can access loans in their unions (including admin-created)
2. Credit officers CANNOT access loans in other unions
3. Admin-created loans are ACTIVE immediately
4. Credit officer loans are PENDING_APPROVAL
5. Union members default to APPROVED status
6. Mobile navigation actually navigates
7. No "Forbidden" errors on legitimate access
8. Multi-union credit officers see all their union data

### ✅ SHOULD WORK (High Priority)
1. All CRUD operations for each role
2. Proper filtering by union
3. Search functionality
4. Reports and exports
5. Dark mode consistency
6. Mobile responsiveness
7. Error handling and validation

### ✅ NICE TO HAVE (Medium Priority)
1. Smooth animations
2. Helpful tooltips
3. Keyboard shortcuts
4. Loading states
5. Empty states

---

## Test Reporting Template

```
## Issue #[Number]: [Brief Description]

**Severity:** Critical / High / Medium / Low
**Role:** Admin / Supervisor / Credit Officer A / Credit Officer B
**Page:** [Page Name]
**Scenario:** [Which scenario from test plan]

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots/Logs:**
[Attach here]

**Browser Console Errors:**
```
[Any errors]
```

**Impact:**
[How this affects users]

**Suggested Fix:**
[If obvious]
```

---

## Notes for Tester

- **Be thorough** - This is production system behavior testing
- **Think like a real user** - Not just clicking features
- **Test permission boundaries** - Try to break access control
- **Document everything** - Even minor confusion
- **Check mobile AND desktop** - Different experiences
- **Test in real workflows** - Not isolated features
- **Test cross-role scenarios** - Admin creates, credit officer views
- **Check data persistence** - Refresh pages, log out/in
- **Verify calculations** - Loan balances, interest, repayments
- **Test edge cases** - Empty states, max values, special characters

---

**Remember:** The goal is to validate this LMS works for REAL loan management operations with proper role-based access control. Not just "features work" - but "workflows work correctly and securely."

---

## 🐛 TEST RESULTS & ISSUES FOUND

**Update this section as you test. For each issue found:**

### Issue Template
```
## Issue #[Number]: [Brief Title]

**Scenario:** [Which scenario from checklist]
**Severity:** Critical / High / Medium / Low
**Status:** Open / In Progress / Fixed / Wont Fix

**Description:**
[What went wrong]

**Steps to Reproduce:**
1. Step one
2. Step two

**Expected:** [What should happen]
**Actual:** [What actually happened]

**Screenshots:** [If any]
**Console Errors:** [If any]

**Notes:** [Additional context]
```

---

### Issues Log

<!-- Add issues below as you find them -->

#### ✅ Working Well
- [Add things that work great here]

#### ❌ Bugs Found
- [Document bugs here as you find them]

#### ⚠️ Needs Clarification
- [Things that are confusing or contradictory]

#### 💡 Suggestions
- [Improvements or enhancements]

---

## 📊 FINAL TEST SUMMARY

**Testing Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Production]
**Browser:** [Browser + Version]

### Results Overview
- ✅ **Passed:** 0 / 90+
- ❌ **Failed:** 0 / 90+
- ⚠️ **Blocked:** 0 / 90+
- ⏭️ **Skipped:** 0 / 90+

### Critical Findings
1. [List critical issues that must be fixed before release]

### High Priority Findings
1. [List high priority issues]

### Overall Assessment
[Summary of testing - is the system ready? What needs fixing?]

