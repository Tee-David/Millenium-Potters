"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UserRole } from "@/lib/enum";
import { SupervisorOption, UserFormState } from "./types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PasswordStrengthIndicator } from "@/components/lightswind/password-strength-indicator";

interface UserFormModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formState: UserFormState;
  onChange: (update: Partial<UserFormState>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  supervisorOptions: SupervisorOption[];
}

export function UserFormModal({
  mode,
  isOpen,
  onOpenChange,
  formState,
  onChange,
  onSubmit,
  isSubmitting,
  supervisorOptions,
}: UserFormModalProps) {
  // Only Credit Officers can have a supervisor assigned
  const showSupervisorField = formState.role === UserRole.CREDIT_OFFICER;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Create new user" : "Update user"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === "create"
              ? "Provide the basic profile, role, and supervisor assignment for this staff member."
              : "Update the user’s profile, role, and supervisor assignments."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0 overscroll-contain">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">First name</Label>
                <Input
                  value={formState.firstName}
                  onChange={(event) =>
                    onChange({ firstName: event.target.value })
                  }
                  placeholder="Jane"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Last name</Label>
                <Input
                  value={formState.lastName}
                  onChange={(event) =>
                    onChange({ lastName: event.target.value })
                  }
                  placeholder="Doe"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Email address</Label>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(event) => onChange({ email: event.target.value })}
                  placeholder="jane@example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Phone number</Label>
                <Input
                  value={formState.phone}
                  onChange={(event) => onChange({ phone: event.target.value })}
                  placeholder="+234 801 234 5678"
                  className="mt-1.5"
                />
              </div>
            </div>
            {mode === "create" && (
              <div>
                <PasswordStrengthIndicator
                  value={formState.password}
                  onChange={(value) => onChange({ password: value })}
                  label="Password"
                  placeholder="Minimum 8 characters"
                  showScore={true}
                  showVisibilityToggle={true}
                  inputProps={{
                    minLength: 8,
                    required: true,
                  }}
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <Select
                  value={formState.role}
                  onValueChange={(value) =>
                    onChange({ role: value as UserRole })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={UserRole.SUPERVISOR}>
                      Supervisor
                    </SelectItem>
                    <SelectItem value={UserRole.CREDIT_OFFICER}>
                      Credit Officer
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Supervisors can manage credit officers and unions.
                </p>
              </div>
              {showSupervisorField && (
                <div>
                  <Label className="text-sm font-medium">
                    Supervisor <span className="text-red-500">*</span>
                  </Label>
                  {supervisorOptions.length === 0 ? (
                    <div className="mt-1.5 p-3 text-sm text-muted-foreground bg-gray-50 border border-gray-200 rounded-md">
                      No supervisors available
                    </div>
                  ) : (
                    <div className="mt-1.5">
                      <SearchableSelect
                        value={formState.supervisorId || ""}
                        onValueChange={(value) =>
                          onChange({ supervisorId: value })
                        }
                        placeholder="Select supervisor..."
                        searchPlaceholder="Search supervisors..."
                        options={supervisorOptions.map((option) => ({
                          value: option.id,
                          label: `${option.name} (${option.email})`,
                        }))}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Credit officers must have an Admin or Supervisor assigned.
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <Textarea
                value={formState.address}
                onChange={(event) => onChange({ address: event.target.value })}
                placeholder="Street, city, state"
                rows={2}
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Active status
                </p>
                <p className="text-xs text-gray-500">
                  Inactive users cannot log in to the dashboard
                </p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => onChange({ isActive: checked })}
              />
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <DialogFooter className="flex-shrink-0 border-t p-4 sm:p-6 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Create user"
              : "Update user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
