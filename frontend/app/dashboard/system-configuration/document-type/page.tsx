"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import {
  DocumentType,
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
} from "@/types/document-type";
import { documentTypesApi, handleDatabaseError } from "@/lib/api";
import { toast } from "sonner";
import { AdminOnly, AccessDenied } from "@/components/auth/RoleGuard";

type ColumnKey = "name" | "code" | "description" | "status" | "actions";

const columnLabels: Record<ColumnKey, string> = {
  name: "Name",
  code: "Code",
  description: "Description",
  status: "Status",
  actions: "Actions",
};

function DocumentTypePageContent() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [toDeleteDocId, setToDeleteDocId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDocumentType, setEditingDocumentType] =
    useState<DocumentType | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateDocumentTypeDto>({
    name: "",
    description: "",
  });

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Column visibility state, all visible by default
  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>({
    name: true,
    code: true,
    description: true,
    status: true,
    actions: true,
  });

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      setIsLoading(true);
      const response = await documentTypesApi.getAll();
      const documentTypesData = response.data.data || response.data || [];
      setDocumentTypes(
        Array.isArray(documentTypesData) ? documentTypesData : []
      );
    } catch (error: any) {
      console.error("Failed to fetch document types:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to load document types due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      toast.error("Failed to fetch document types");
    } finally {
      setIsLoading(false);
    }
  };

  const requestDelete = (id: string) => {
    setToDeleteDocId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDeleteDocId) return;
    try {
      setIsDeleting(true);
      await documentTypesApi.remove(toDeleteDocId);
      await fetchDocumentTypes();
      setToDeleteDocId(null);
      setIsDeleteConfirmOpen(false);
      toast.success("Document type deleted successfully");
    } catch (error: any) {
      console.error("Error deleting document type:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to delete document type due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      const message = error.response?.data?.message || "";
      if (message.includes("Cannot delete document type that is being used")) {
        toast.error(
          "Cannot delete document type that is being used by existing documents."
        );
      } else if (message.includes("Document type not found")) {
        toast.error(
          "The document type was not found. Please refresh and try again."
        );
      } else {
        toast.error(message || "Failed to delete document type");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered document types with search
  const filteredDocumentTypes = documentTypes.filter(
    (docType) =>
      docType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (docType.description &&
        docType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Toggle column visibility
  const toggleColVisibility = (col: ColumnKey) => {
    setVisibleCols((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleCreateOpen = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (docType: DocumentType) => {
    setEditingDocumentType(docType);
    setFormData({
      name: docType.name,
      description: docType.description || "",
    });
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsCreating(true);

      await documentTypesApi.create(formData);

      await fetchDocumentTypes();
      resetForm();
      setIsCreateOpen(false);
      toast.success("Document type created successfully");
    } catch (error: any) {
      console.error("Error creating document type:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to create document type due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      const message = error.response?.data?.message || "";
      if (message.includes("Document type with this name already exists")) {
        toast.error(
          "A document type with this name already exists. Please use a different name."
        );
      } else if (message.includes("Name is required")) {
        toast.error("Name is required.");
      } else if (error.response?.status === 400) {
        toast.error(message || "Please check your input and try again.");
      } else if (error.response?.status === 422) {
        toast.error(message || "Please check your input and try again.");
      } else {
        toast.error(
          message || "Failed to create document type. Please try again."
        );
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDocumentType) return;
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsUpdating(true);

      const updateData: UpdateDocumentTypeDto = {
        name: formData.name,
        description: formData.description,
      };

      await documentTypesApi.update(editingDocumentType.id, updateData);

      await fetchDocumentTypes();
      resetForm();
      setEditingDocumentType(null);
      setIsEditOpen(false);
      toast.success("Document type updated successfully");
    } catch (error: any) {
      console.error("Error updating document type:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to update document type due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      const message = error.response?.data?.message || "";
      if (message.includes("Document type with this name already exists")) {
        toast.error(
          "A document type with this name already exists. Please use a different name."
        );
      } else if (message.includes("Document type not found")) {
        toast.error(
          "The document type was not found. Please refresh and try again."
        );
      } else if (error.response?.status === 400) {
        toast.error(message || "Please check your input and try again.");
      } else if (error.response?.status === 422) {
        toast.error(message || "Please check your input and try again.");
      } else {
        toast.error(
          message || "Failed to update document type. Please try again."
        );
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-900">Document Types</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <Plus size={16} />
              Create Document Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Document Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  placeholder="Enter document type name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  placeholder="Enter description (optional)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Copy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Column visibility ▼
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              {Object.entries(columnLabels).map(([colKey, label]) => (
                <DropdownMenuItem key={colKey}>
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visibleCols[colKey as ColumnKey]}
                      onChange={() => toggleColVisibility(colKey as ColumnKey)}
                    />
                    <span>{label}</span>
                  </label>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search:
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search document types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading document types...</p>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {visibleCols.name && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                )}
                {visibleCols.code && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                )}
                {visibleCols.description && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                )}
                {visibleCols.status && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                {visibleCols.actions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocumentTypes.length > 0 ? (
                filteredDocumentTypes.map((documentType, index) => (
                  <tr
                    key={documentType.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {visibleCols.name && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {documentType.name}
                      </td>
                    )}
                    {visibleCols.code && (
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {documentType.code}
                      </td>
                    )}
                    {visibleCols.description && (
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {documentType.description || "-"}
                      </td>
                    )}
                    {visibleCols.status && (
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            documentType.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {documentType.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    )}
                    {visibleCols.actions && (
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(documentType)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => requestDelete(documentType.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={Object.values(visibleCols).filter(Boolean).length}
                    className="px-4 py-4 text-center text-sm text-gray-500"
                  >
                    No document types found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        itemName={
          documentTypes.find((doc) => doc.id === toDeleteDocId)?.name ??
          "this item"
        }
      />
    </div>
  );
}

export default function DocumentTypePage() {
  return (
    <AdminOnly
      fallback={
        <AccessDenied message="Only administrators can access document type management." />
      }
    >
      <DocumentTypePageContent />
    </AdminOnly>
  );
}
