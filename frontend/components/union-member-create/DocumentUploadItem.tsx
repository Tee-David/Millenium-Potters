"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DocumentType } from "@/types";

interface NewDocument {
    type: string;
    file: File | null;
    notes: string;
}

interface DocumentUploadItemProps {
    doc: NewDocument;
    index: number;
    onDrop: (index: number, files: File[]) => void;
    onTypeChange: (index: number, value: string) => void;
    onNotesChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    documentTypes: DocumentType[];
    isLoadingDocumentTypes: boolean;
    isUploading?: boolean;
}

export const DocumentUploadItem = ({
    doc,
    index,
    onDrop,
    onTypeChange,
    onNotesChange,
    onRemove,
    documentTypes,
    isLoadingDocumentTypes,
    isUploading = false,
}: DocumentUploadItemProps) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => onDrop(index, files),
        accept: { "image/*": [], "application/pdf": [] },
        maxFiles: 1,
    });

    return (
        <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors duration-200">
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start max-w-full">
                {/* Document Type Selection */}
                <div className="w-full lg:w-1/4 min-w-0 flex-shrink-0">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                        Document Type
                    </Label>
                    <Select
                        value={doc.type}
                        onValueChange={(value) => onTypeChange(index, value)}
                        disabled={isUploading}
                    >
                        <SelectTrigger className="h-12 text-base w-full">
                            <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingDocumentTypes ? (
                                <div className="flex items-center space-x-2 p-2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-600">
                                        Loading...
                                    </span>
                                </div>
                            ) : documentTypes.length > 0 ? (
                                documentTypes.map((docType) => (
                                    <SelectItem key={docType.id} value={docType.id}>
                                        {docType.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-gray-500">
                                    No types available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* File Upload Area */}
                <div className="w-full lg:w-2/4 min-w-0 flex-grow">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                        Upload File
                    </Label>
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[120px] w-full",
                            isDragActive
                                ? "border-emerald-500 bg-emerald-50 scale-105"
                                : isUploading
                                    ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                                    : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <Upload
                            className={cn(
                                "mb-3 transition-colors",
                                isDragActive ? "text-emerald-600" : "text-gray-400"
                            )}
                            size={32}
                        />
                        {doc.file ? (
                            <div className="text-center">
                                <p className="text-emerald-700 font-medium mb-1 truncate">
                                    {doc.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-700 font-medium mb-1">
                                    Drop your file here
                                </p>
                                <p className="text-xs text-gray-500">
                                    or click to browse • PDF, JPG, PNG
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div className="w-full lg:w-1/4 min-w-0 flex-shrink-0">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                        Notes (Optional)
                    </Label>
                    <Textarea
                        value={doc.notes}
                        onChange={(e) => onNotesChange(index, e.target.value)}
                        className="min-h-[120px] text-base resize-none w-full"
                        placeholder="Add notes..."
                        disabled={isUploading}
                    />
                </div>

                {/* Remove Button */}
                <div className="w-full lg:w-auto flex justify-end lg:justify-center">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove(index)}
                        disabled={isUploading}
                        type="button"
                        className="h-10 w-10 mt-8"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
