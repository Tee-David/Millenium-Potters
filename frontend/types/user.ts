import { User } from "./index";

// Re-export from comprehensive types
export * from "./index";

// Password change interface
export interface PasswordChangeData {
  newPassword: string;
  confirmPassword: string;
}

// Create/Edit User Modal Component
export interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<User>) => void;
  user?: User | null;
  mode: "create" | "edit";
}
