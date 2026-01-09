export interface PermissionCategory {
  title: string;
  permissions: string[];
}

export const permissionCategories: PermissionCategory[] = [
  {
    title: "User Management",
    permissions: [
      "Manage User",
      "Create User",
      "Edit User",
      "Delete User",
      "Show User",
    ],
  },
  {
    title: "Customer Management",
    permissions: [
      "Manage Customer",
      "Create Customer",
      "Edit Customer",
      "Delete Customer",
      "Show Customer",
      "Create Customer Document",
      "Delete Customer Document",
    ],
  },
  {
    title: "Branch Management",
    permissions: [
      "Manage Branch",
      "Create Branch",
      "Delete Branch",
      "Edit Branch",
    ],
  },
  {
    title: "Loan Management",
    permissions: [
      "Manage Loan Type",
      "Create Loan Type",
      "Edit Loan Type",
      "Delete Loan Type",
      "Show Loan Type",
      "Show Loan",
      "Create Loan",
      "Delete Loan",
    ],
  },
  {
    title: "Account Management",
    permissions: [
      "Manage Account Settings",
      "Manage Account",
      "Create Account Type",
      "Edit Account Type",
      "Delete Account Type",
      "Show Account Type",
      "Create Account",
      "Edit Account",
      "Delete Account",
      "Show Account",
    ],
  },
  {
    title: "Transaction Management",
    permissions: [
      "Manage Transaction",
      "Create Transaction",
      "Edit Transaction",
      "Delete Transaction",
    ],
  },
  {
    title: "Expense Management",
    permissions: [
      "Manage Expense",
      "Create Expense",
      "Edit Expense",
      "Delete Expense",
    ],
  },
  {
    title: "Repayment Management",
    permissions: [
      "Manage Repayment",
      "Create Repayment",
      "Edit Repayment",
      "Delete Repayment",
      "Repayment Schedule Payment",
      "Delete Repayment Schedule",
    ],
  },
  {
    title: "Document Management",
    permissions: [
      "Manage Document Type",
      "Create Document Type",
      "Edit Document Type",
      "Delete Document Type",
    ],
  },
  {
    title: "Contact Management",
    permissions: [
      "Manage Contact",
      "Create Contact",
      "Edit Contact",
      "Delete Contact",
    ],
  },
  {
    title: "Note Management",
    permissions: ["Manage Note", "Create Note", "Edit Note", "Delete Note"],
  },
  {
    title: "System Management",
    permissions: [
      "Manage Logged History",
      "Delete Logged History",
      "Manage Password Settings",
      "Manage 2FA Settings",
      "Manage General Settings",
      "Manage Twilio Settings",
      "Manage Company Settings",
      "Manage Email Settings",
      "Manage Payment Settings",
    ],
  },
];
