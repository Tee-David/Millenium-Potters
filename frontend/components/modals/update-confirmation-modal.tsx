"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface UpdateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading?: boolean;
}

export function UpdateConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading = false,
}: UpdateConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Confirm Update
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to update <strong>{itemName}</strong>?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  Important Warning
                </p>
                <p className="text-amber-700">
                  Updating this loan type may affect existing loans and their
                  terms. This action could impact ongoing loan calculations and
                  schedules.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Please review your changes carefully before proceeding.
          </p>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={isLoading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              "Update Loan Type"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
