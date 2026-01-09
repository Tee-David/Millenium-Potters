import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import React from "react";

type DocumentItem = { file: File | null; description: string };

export function UnionMemberDocumentsForm({ formData, setFormData }: any) {
  const [localDocs, setLocalDocs] = React.useState<DocumentItem[]>(
    formData.documents || []
  );

  const handleFileChange = (idx: number, file: File | null) => {
    const updated: DocumentItem[] = [...localDocs];
    updated[idx] = { ...updated[idx], file };
    setLocalDocs(updated);
    setFormData((prev: any) => ({ ...prev, documents: updated }));
  };

  const handleDescChange = (idx: number, desc: string) => {
    const updated: DocumentItem[] = [...localDocs];
    updated[idx] = { ...updated[idx], description: desc };
    setLocalDocs(updated);
    setFormData((prev: any) => ({ ...prev, documents: updated }));
  };

  const addDocumentField = () => {
    setLocalDocs([...localDocs, { file: null, description: "" }]);
  };

  const removeDocumentField = (idx: number) => {
    const updated: DocumentItem[] = localDocs.filter(
      (doc: DocumentItem, i: number) => i !== idx
    );
    setLocalDocs(updated);
    setFormData((prev: any) => ({ ...prev, documents: updated }));
  };

  React.useEffect(() => {
    setLocalDocs(formData.documents || []);
  }, [formData.documents]);

  return (
    <div className="space-y-4">
      <Label>Documents</Label>
      <div className="flex flex-col gap-4">
        {localDocs.map((doc: DocumentItem, idx: number) => (
          <div
            key={idx}
            className="space-y-2 border p-2 rounded-md bg-white shadow-sm"
          >
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) =>
                  handleFileChange(
                    idx,
                    e.target.files ? e.target.files[0] : null
                  )
                }
                className="w-full sm:w-auto"
              />
              {doc.file && (
                <span className="text-xs text-gray-600 truncate max-w-xs">
                  {doc.file.name}
                </span>
              )}
            </div>
            <Textarea
              placeholder="Enter description for this document"
              value={doc.description || ""}
              onChange={(e) => handleDescChange(idx, e.target.value)}
              className="w-full"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeDocumentField(idx)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        className="mt-2 w-full sm:w-auto"
        onClick={addDocumentField}
      >
        Add Another Document
      </Button>
    </div>
  );
}
