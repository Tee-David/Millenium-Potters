import React, { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message: string | ReactNode | any;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  confirmDisabled?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  requireDeleteKeyword?: boolean;
  deleteKeyword?: string;
  reassignmentData?: {
    type: "user" | "branch" | "loan";
    items: Array<{ id: string; name: string }>;
    onReassign: (fromId: string, toId: string) => void;
  };
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonVariant = "destructive",
  confirmDisabled = false,
  isLoading = false,
  icon,
  maxWidth = "md",
  requireDeleteKeyword = false,
  deleteKeyword = "DELETE",
  reassignmentData,
}) => {
  const [deleteInput, setDeleteInput] = useState("");
  const [reassignTo, setReassignTo] = useState("");

  const isDeleteKeywordValid =
    !requireDeleteKeyword || deleteInput === deleteKeyword;
  const isReassignmentValid = !reassignmentData || reassignTo !== "";

  const canConfirm =
    !confirmDisabled &&
    !isLoading &&
    isDeleteKeywordValid &&
    isReassignmentValid;

  const handleConfirm = () => {
    if (canConfirm) {
      if (reassignmentData && reassignTo) {
        // Handle reassignment before deletion
        // Note: The actual deletion should be handled by the parent component
        // This just triggers the reassignment callback
        try {
          reassignmentData.onReassign(reassignmentData.items[0].id, reassignTo);
        } catch (error) {
          console.error("Reassignment failed:", error);
          // Don't proceed with deletion if reassignment fails
          return;
        }
      }
      onConfirm();
      setDeleteInput("");
      setReassignTo("");
    }
  };

  const handleCancel = () => {
    setDeleteInput("");
    setReassignTo("");
    onCancel();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && canConfirm) {
      handleConfirm();
    }
  };

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] flex flex-col transform transition-all duration-200 animate-in fade-in-0 zoom-in-95`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {icon || (
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <h2
              id="modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div id="modal-message" className="text-gray-700 leading-relaxed">
            {typeof message === "string" ? <p>{message}</p> : message}
          </div>

          {/* Reassignment Section */}
          {reassignmentData && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900">
                Reassign{" "}
                {reassignmentData.type === "user"
                  ? "Credit Officer"
                  : reassignmentData.type}{" "}
                Data
              </h3>
              <p className="text-sm text-blue-700">
                Before deleting, please select a{" "}
                {reassignmentData.type === "user"
                  ? "credit officer"
                  : reassignmentData.type}{" "}
                to reassign all data to:
              </p>
              <div>
                <Label htmlFor="reassign-select">
                  Select{" "}
                  {reassignmentData.type === "user"
                    ? "Credit Officer"
                    : reassignmentData.type}
                </Label>
                <select
                  id="reassign-select"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    Choose{" "}
                    {reassignmentData.type === "user"
                      ? "credit officer"
                      : reassignmentData.type}
                    ...
                  </option>
                  {reassignmentData.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* DELETE Keyword Section */}
          {requireDeleteKeyword && (
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-900">
                Confirmation Required
              </h3>
              <p className="text-sm text-red-700">
                To confirm this action, please type{" "}
                <strong>{deleteKeyword}</strong> in the box below:
              </p>
              <div>
                <Label htmlFor="delete-keyword">
                  Type "{deleteKeyword}" to confirm
                </Label>
                <Input
                  id="delete-keyword"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={`Type ${deleteKeyword} here`}
                  className="mt-1"
                />
                {deleteInput && !isDeleteKeywordValid && (
                  <p className="text-sm text-red-600 mt-1">
                    Please type exactly "{deleteKeyword}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {cancelButtonText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="min-w-[80px]"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </div>
            ) : (
              confirmButtonText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
