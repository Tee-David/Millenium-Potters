"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  Plus,
  FileSpreadsheet,
  FileText,
  Copy,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { UpdateConfirmationModal } from "@/components/modals/update-confirmation-modal";
import { loanTypesApi, handleDatabaseError } from "@/lib/api";
import { UserRole } from "@/lib/enum";
import { toast } from "sonner";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { formatNaira } from "@/utils/currency";
import autoTable from "jspdf-autotable";
import { AdminOnly, AccessDenied } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/useAuth";

interface LoanType {
  id: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  termUnit: "DAY" | "WEEK" | "MONTH";
  minTerm: number;
  maxTerm: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface FormFieldsProps {
  formData: {
    name: string;
    description: string;
    minAmount: string;
    maxAmount: string;
    termUnit: "DAY" | "WEEK" | "MONTH";
    minTerm: string;
    maxTerm: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      minAmount: string;
      maxAmount: string;
      termUnit: "DAY" | "WEEK" | "MONTH";
      minTerm: string;
      maxTerm: string;
    }>
  >;
  isEdit: boolean;
  handleCreate: () => void;
  handleUpdate: () => void;
  isCreating?: boolean;
  isUpdating?: boolean;
}

type ColumnKey = "name" | "loanEligibleAmount" | "description" | "actions";

const columnLabels: Record<ColumnKey, string> = {
  name: "Name",
  loanEligibleAmount: "Loan Eligible Amount (₦)",
  description: "Description",
  actions: "Action",
};

function FormFields({
  formData,
  setFormData,
  isEdit,
  handleCreate,
  handleUpdate,
  isCreating = false,
  isUpdating = false,
}: FormFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label htmlFor={isEdit ? "edit-type" : "type"}>
          Loan Type Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id={isEdit ? "edit-type" : "type"}
          placeholder="Enter loan type name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-minAmount" : "minAmount"}>
          Minimum Loan Amount (₦) <span className="text-red-500">*</span>
        </Label>
        <Input
          id={isEdit ? "edit-minAmount" : "minAmount"}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={formData.minAmount}
          onChange={(e) =>
            setFormData({ ...formData, minAmount: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-maxAmount" : "maxAmount"}>
          Maximum Loan Amount (₦) <span className="text-red-500">*</span>
        </Label>
        <Input
          id={isEdit ? "edit-maxAmount" : "maxAmount"}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={formData.maxAmount}
          onChange={(e) =>
            setFormData({ ...formData, maxAmount: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-termUnit" : "termUnit"}>
          Term Unit <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.termUnit}
          onValueChange={(value: "DAY" | "WEEK" | "MONTH") =>
            setFormData({ ...formData, termUnit: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select term unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAY">Daily - Repayments every day</SelectItem>
            <SelectItem value="WEEK">
              Weekly - Repayments every 7 days
            </SelectItem>
            <SelectItem value="MONTH">
              Monthly - Repayments every 30 days
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          {formData.termUnit === "DAY" &&
            "Daily loans require repayments every day. Each day counts as one term. Maximum term represents the number of days for the loan duration."}
          {formData.termUnit === "WEEK" &&
            "Weekly loans require repayments every 7 days. Each week counts as one term. Maximum term represents the number of weeks for the loan duration."}
          {formData.termUnit === "MONTH" &&
            "Monthly loans require repayments every 30 days. Each month counts as one term. Maximum term represents the number of months for the loan duration."}
        </p>
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-maxTerm" : "maxTerm"}>
          Maximum Term <span className="text-red-500">*</span>
        </Label>
        <Input
          id={isEdit ? "edit-maxTerm" : "maxTerm"}
          type="number"
          min="1"
          placeholder="Enter maximum term"
          value={formData.maxTerm}
          onChange={(e) =>
            setFormData({ ...formData, maxTerm: e.target.value })
          }
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.termUnit === "DAY" &&
            "Maximum number of days for the loan. Example: 30 days means the loan will be due in 30 days from the start date."}
          {formData.termUnit === "WEEK" &&
            "Maximum number of weeks for the loan. Example: 4 weeks means the loan will be due in 4 weeks (28 days) from the start date."}
          {formData.termUnit === "MONTH" &&
            "Maximum number of months for the loan. Example: 3 months means the loan will be due in 3 months (90 days) from the start date."}
        </p>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor={isEdit ? "edit-description" : "description"}>
          Description
        </Label>
        <Textarea
          id={isEdit ? "edit-description" : "description"}
          placeholder="Enter loan type description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="md:col-span-2">
        <Button
          onClick={isEdit ? handleUpdate : handleCreate}
          disabled={isCreating || isUpdating}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating || isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Update Loan Type"
          ) : (
            "Create Loan Type"
          )}
        </Button>
      </div>
    </div>
  );
}

function LoanTypePageContent() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLoanType, setEditingLoanType] = useState<LoanType | null>(null);
  const [toDeleteLoanId, setToDeleteLoanId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteSecondConfirmOpen, setIsDeleteSecondConfirmOpen] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [visibleColumns, setVisibleColumns] = useState<
    Record<ColumnKey, boolean>
  >({
    name: true,
    loanEligibleAmount: true,
    description: true,
    actions: true,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minAmount: "",
    maxAmount: "",
    termUnit: "MONTH" as "DAY" | "WEEK" | "MONTH",
    minTerm: "1", // Always fixed at 1
    maxTerm: "",
  });

  useEffect(() => {
    fetchLoanTypes();
  }, []);

  const fetchLoanTypes = async () => {
    try {
      setIsLoadingData(true);
      const response = await loanTypesApi.getAll();
      const loanTypesData =
        response.data.data?.loanTypes ||
        response.data.loanTypes ||
        response.data.data ||
        response.data ||
        [];
      setLoanTypes(Array.isArray(loanTypesData) ? loanTypesData : []);
    } catch (error: any) {
      console.error("Failed to fetch loan types:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to load loan types due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Fallback error handling
      toast.error("Failed to fetch loan types");
    } finally {
      setIsLoadingData(false);
    }
  };

  const filteredLoanTypes = loanTypes.filter(
    (loanType) =>
      loanType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loanType.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const formatAmountRange = (min: number, max: number) => (
    <div className="text-sm">
      <div className="text-sm">Min: {formatNaira(min)}</div>
      <div className="text-sm">Max: {formatNaira(max)}</div>
    </div>
  );

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      minAmount: "",
      maxAmount: "",
      termUnit: "MONTH",
      minTerm: "1",
      maxTerm: "",
    });
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter loan type name");
      return false;
    }
    if (!formData.minAmount.trim()) {
      toast.error("Please enter minimum loan amount");
      return false;
    }
    if (!formData.maxAmount.trim()) {
      toast.error("Please enter maximum loan amount");
      return false;
    }
    if (!formData.maxTerm.trim()) {
      toast.error("Please enter maximum term");
      return false;
    }
    if (parseFloat(formData.minAmount) > parseFloat(formData.maxAmount)) {
      toast.error(
        "Minimum loan amount cannot be greater than maximum loan amount"
      );
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsCreating(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        termUnit: formData.termUnit,
        minTerm: 1, // Always fixed at 1
        maxTerm: parseInt(formData.maxTerm),
      };
      await loanTypesApi.create(payload);
      toast.success("Loan type created successfully");
      await fetchLoanTypes();
      resetForm();
      setIsCreateOpen(false);
    } catch (error: any) {
      console.error("Failed to create loan type:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to create loan type due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Fallback error handling
      toast.error(
        error.response?.data?.message || "Failed to create loan type"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (loanType: LoanType) => {
    console.log("Current user:", currentUser);
    console.log("Current user role:", currentUser?.role);
    console.log("UserRole.ADMIN:", UserRole.ADMIN);
    console.log("Role comparison:", currentUser?.role === UserRole.ADMIN);

    if (!currentUser) {
      toast.error("User information not loaded. Please refresh the page.");
      return;
    }

    if (currentUser.role !== UserRole.ADMIN) {
      toast.error("Only administrators can edit loan types");
      return;
    }

    setEditingLoanType(loanType);
    setFormData({
      name: loanType.name,
      description: loanType.description || "",
      minAmount: loanType.minAmount.toString(),
      maxAmount: loanType.maxAmount.toString(),
      termUnit: loanType.termUnit,
      minTerm: "1", // Always fixed at 1
      maxTerm: loanType.maxTerm.toString(),
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingLoanType) return;

    // Show confirmation dialog
    setIsUpdateConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    if (!editingLoanType) return;

    try {
      setIsUpdating(true);
      console.log("Updating loan type with data:", {
        id: editingLoanType.id,
        formData: formData,
      });

      const payload = {
        name: formData.name,
        description: formData.description,
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        termUnit: formData.termUnit,
        minTerm: 1, // Always fixed at 1
        maxTerm: parseInt(formData.maxTerm),
      };

      console.log("Payload being sent:", payload);
      await loanTypesApi.update(editingLoanType.id, payload);
      toast.success("Loan type updated successfully");
      await fetchLoanTypes();
      resetForm();
      setEditingLoanType(null);
      setIsEditOpen(false);
      setIsUpdateConfirmOpen(false);
    } catch (error) {
      console.error("Failed to update loan type:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to update loan type due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      toast.error("Failed to update loan type");
    } finally {
      setIsUpdating(false);
    }
  };

  const requestDelete = (id: string) => {
    setToDeleteLoanId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    // First confirmation -> show second confirmation with warning
    setIsDeleteConfirmOpen(false);
    setIsDeleteSecondConfirmOpen(true);
  };

  const confirmDeleteFinal = async () => {
    if (!toDeleteLoanId) return;
    try {
      setIsDeleting(true);
      await loanTypesApi.remove(toDeleteLoanId);
      toast.success("Loan type deleted successfully");
      await fetchLoanTypes();
      setToDeleteLoanId(null);
      setIsDeleteSecondConfirmOpen(false);
    } catch (error: any) {
      console.error("Failed to delete loan type:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to delete loan type due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Check for specific error about loans using this type
      if (error.response?.data?.message?.includes("loans")) {
        toast.error("Cannot delete loan type: There are existing loans using this type");
        return;
      }

      toast.error(error.response?.data?.message || "Failed to delete loan type");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setIsDeleteSecondConfirmOpen(false);
    setToDeleteLoanId(null);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      loanTypes.map(({ name, description, minAmount, maxAmount }) => ({
        Name: name,
        Description: description || "",
        "Min Amount": minAmount,
        "Max Amount": maxAmount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loan Types");
    XLSX.writeFile(wb, "loan-types.xlsx");
    toast.success("Data exported to Excel successfully!");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Loan Types Report", 20, 20);
    autoTable(doc, {
      head: [["Name", "Description", "Min Amount", "Max Amount"]],
      body: loanTypes.map(({ name, description, minAmount, maxAmount }) => [
        name,
        description || "",
        formatNaira(minAmount),
        formatNaira(maxAmount),
      ]),
    });
    doc.save("loan-types.pdf");
    toast.success("Data exported to PDF successfully!");
  };

  const copyToClipboard = () => {
    const clipboardText = loanTypes
      .map(
        ({ name, description, minAmount, maxAmount }) =>
          `${name}\t${description || ""}\t${formatNaira(
            minAmount
          )}\t${formatNaira(maxAmount)}`
      )
      .join("\n");
    navigator.clipboard.writeText(
      `Name\tDescription\tMin Amount\tMax Amount\n${clipboardText}`
    );
    toast.success("Data copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Loan Types Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage loan types, terms, and amounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchLoanTypes}
              disabled={isLoadingData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingData ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreating || isUpdating}
                >
                  <Plus className="w-4 h-4" />
                  Create Loan Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Loan Type</DialogTitle>
                </DialogHeader>
                <FormFields
                  formData={formData}
                  setFormData={setFormData}
                  isEdit={isEditOpen}
                  handleCreate={handleCreate}
                  handleUpdate={handleUpdate}
                  isCreating={isCreating}
                  isUpdating={isUpdating}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Data
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search loan types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              <span className="text-gray-600">Loading loan types...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.name && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      {columnLabels.name}
                    </th>
                  )}
                  {visibleColumns.loanEligibleAmount && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      {columnLabels.loanEligibleAmount}
                    </th>
                  )}
                  {visibleColumns.description && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      {columnLabels.description}
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      {columnLabels.actions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoanTypes.length > 0 ? (
                  filteredLoanTypes.map((loanType) => (
                    <tr key={loanType.id} className="hover:bg-gray-50">
                      {visibleColumns.name && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {loanType.name}
                          </div>
                        </td>
                      )}
                      {visibleColumns.loanEligibleAmount && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatAmountRange(
                            loanType.minAmount,
                            loanType.maxAmount
                          )}
                        </td>
                      )}
                      {visibleColumns.description && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {loanType.description || "No description"}
                          </div>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={true}
                              className="text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                              title="Loan types cannot be edited once created"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => requestDelete(loanType.id)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={
                        Object.values(visibleColumns).filter(Boolean).length
                      }
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="font-medium text-gray-900 mb-1">
                          {searchTerm
                            ? "No loan types match your search"
                            : "No loan types found"}
                        </div>
                        <div className="text-gray-500 mb-4">
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Get started by creating your first loan type"}
                        </div>
                        {!searchTerm && (
                          <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Loan Type
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results summary */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Showing {filteredLoanTypes.length} of {loanTypes.length} loan types
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Loan Type</DialogTitle>
          </DialogHeader>
          <FormFields
            formData={formData}
            setFormData={setFormData}
            isEdit={isEditOpen}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            isCreating={isCreating}
            isUpdating={isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal - Step 1 */}
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        isLoading={false}
        itemName={
          loanTypes.find((lt) => lt.id === toDeleteLoanId)?.name ??
          "this loan type"
        }
      />

      {/* Delete Confirmation Modal - Step 2 (Final Confirmation with Warning) */}
      <Dialog open={isDeleteSecondConfirmOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Final Confirmation Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                Warning: This action cannot be undone!
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                <li>The loan type &quot;{loanTypes.find((lt) => lt.id === toDeleteLoanId)?.name}&quot; will be permanently deleted</li>
                <li>This loan type will no longer be available for new loans</li>
                <li>Existing loans with this type will retain their current settings</li>
                <li>Historical data will remain but the loan type cannot be reassigned</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Are you absolutely sure you want to proceed with deleting this loan type?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteFinal}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Yes, Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Confirmation Modal */}
      <UpdateConfirmationModal
        isOpen={isUpdateConfirmOpen}
        onClose={() => setIsUpdateConfirmOpen(false)}
        onConfirm={confirmUpdate}
        isLoading={isUpdating}
        itemName={editingLoanType?.name ?? "this loan type"}
      />
    </div>
  );
}

export default function LoanTypePage() {
  return (
    <AdminOnly
      fallback={
        <AccessDenied message="Only administrators can access loan type management." />
      }
    >
      <LoanTypePageContent />
    </AdminOnly>
  );
}
