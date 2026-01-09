"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Edit,
  Download,
  Trash2,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  unionMembersApi,
  loansApi,
  documentsApi,
  getAccessToken,
} from "@/lib/api";
import { format, parseISO, isValid } from "date-fns";
import { getUserDisplayName } from "@/utils/user-display";
import { toast } from "sonner";

interface Document {
  id: string;
  documentType?: {
    id: string;
    name: string;
    code: string;
  };
  fileUrl: string;
  verified: boolean;
  uploadedAt: string;
  verificationNotes?: string;
}

interface Loan {
  id: string;
  loanNumber: string;
  principalAmount: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface UnionMemberDetail {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  note?: string;
  profileImage?: string;
  isVerified: boolean;
  unionId: string;
  union?: {
    id: string;
    name: string;
    location?: string;
  };
  currentOfficerId?: string;
  currentOfficer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  documents: Document[];
  loans: Loan[];
  createdAt?: string;
  updatedAt?: string;
}

function UnionMemberDetailPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<UnionMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingVerification, setIsTogglingVerification] = useState(false);

  const formatDate = (
    dateString: string | null | undefined,
    formatString: string = "MMMM dd, yyyy"
  ): string => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      const date = parseISO(dateString);
      if (isValid(date)) return format(date, formatString);
      const fallbackDate = new Date(dateString);
      if (isValid(fallbackDate)) return format(fallbackDate, formatString);
      return "Invalid Date";
    } catch {
      return dateString;
    }
  };

  const handleViewDocument = async (
    docId: string,
    docName: string = "document"
  ) => {
    try {
      const token = getAccessToken();
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://l-d1.onrender.com/api";
      const documentUrl = `${apiUrl}/documents/serve/${docId}`;

      const response = await fetch(documentUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert("Document file not found.");
        } else if (response.status === 401 || response.status === 403) {
          alert("You don't have permission to access this document.");
        } else {
          alert(`Failed to load document (Error: ${response.status}).`);
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";

      if (contentType.includes("pdf") || contentType.includes("image")) {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${docName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch {
      alert("An error occurred while trying to view the document.");
    }
  };

  const handleToggleVerification = async () => {
    if (!member) return;

    setIsTogglingVerification(true);
    try {
      const response = await unionMembersApi.toggleVerification(member.id);
      if (response.data.success) {
        setMember((prev) =>
          prev ? { ...prev, isVerified: !prev.isVerified } : null
        );
        toast.success(response.data.message || "Verification status updated");
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update verification"
      );
    } finally {
      setIsTogglingVerification(false);
    }
  };

  const fetchData = async () => {
    if (!params?.id) {
      setError("Missing member ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [memberResp, loansResp] = await Promise.all([
        unionMembersApi.getById(params.id),
        loansApi
          .getAll({ unionMemberId: params.id, limit: 100 })
          .catch(() => ({ data: { data: [] } })),
      ]);

      const memberData = memberResp.data.success
        ? memberResp.data.data
        : memberResp.data.data || memberResp.data;
      const loansData =
        loansResp?.data?.data?.loans ||
        loansResp?.data?.data ||
        loansResp?.data ||
        [];
      memberData.loans = Array.isArray(loansData) ? loansData : [];
      memberData.documents = memberData.documents || [];

      // Fetch documents separately if not included
      if (!memberData.documents || memberData.documents.length === 0) {
        try {
          const docsResp = await documentsApi.getUnionMemberDocuments(
            params.id
          );
          if (docsResp.data) {
            const docs = docsResp.data.data || docsResp.data || [];
            memberData.documents = Array.isArray(docs) ? docs : [];
          }
        } catch {
          memberData.documents = [];
        }
      }

      setMember(memberData);
    } catch (err: any) {
      console.error("Failed to fetch member details", err);
      setError(err.response?.data?.message || "Failed to load member details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading member details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No member data available.</p>
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.lastName}`;
  const creditOfficerName = getUserDisplayName(member.currentOfficer, "N/A");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-2 py-4 sm:px-4 lg:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard/business-management/union-member">
                    Union Members
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{fullName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">{fullName}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Link
                href={`/dashboard/business-management/union-member/${member.id}/edit`}
              >
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Member
                </Button>
              </Link>
            </div>
          </div>

          {/* Member Basic Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Member Information</CardTitle>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="verification-toggle"
                  className="text-sm text-muted-foreground"
                >
                  Approved
                </Label>
                <Switch
                  id="verification-toggle"
                  checked={member.isVerified}
                  onCheckedChange={handleToggleVerification}
                  disabled={isTogglingVerification}
                />
                {member.isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.profileImage} alt={fullName} />
                      <AvatarFallback className="bg-muted text-lg font-medium">
                        {member.firstName?.charAt(0)}
                        {member.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{fullName}</h3>
                      {member.code && (
                        <p className="text-sm text-muted-foreground">
                          Code: {member.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Union
                    </label>
                    <p className="mt-1">{member.union?.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="mt-1">{member.phone || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Marital Status
                    </label>
                    <p className="mt-1">{member.maritalStatus || "N/A"}</p>
                  </div>
                </div>

                {/* Middle */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </label>
                    <p className="mt-1">{fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Gender
                    </label>
                    <p className="mt-1">{member.gender || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </label>
                    <p className="mt-1">{formatDate(member.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Profession
                    </label>
                    <p className="mt-1">{member.profession || "N/A"}</p>
                  </div>
                </div>

                {/* Right */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="mt-1 text-blue-600">
                      {member.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Credit Officer
                    </label>
                    <p className="mt-1">{creditOfficerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={
                          member.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {member.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Company
                    </label>
                    <p className="mt-1">{member.company || "N/A"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Address & Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <p className="mt-1">{member.address || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      City
                    </label>
                    <p className="mt-1">{member.city || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      State
                    </label>
                    <p className="mt-1">{member.state || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <p className="mt-1">{member.country || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Zip Code
                    </label>
                    <p className="mt-1">{member.zipCode || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Notes
                    </label>
                    <p className="mt-1">{member.note || "N/A"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loans Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Loans ({member.loans?.length || 0})
              </CardTitle>
              {(member.loans?.length ?? 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const headers = [
                      "Loan Number",
                      "Principal Amount",
                      "Start Date",
                      "End Date",
                      "Status",
                    ];
                    const rows =
                      member.loans?.map((loan) => [
                        loan.loanNumber,
                        `₦${Number(
                          loan.principalAmount || 0
                        ).toLocaleString()}`,
                        formatDate(loan.startDate, "MMM dd, yyyy"),
                        formatDate(loan.endDate, "MMM dd, yyyy"),
                        loan.status?.replace("_", " ") || "Unknown",
                      ]) ?? [];
                    const csvContent = [
                      headers.join(","),
                      ...rows.map((row) => row.join(",")),
                    ].join("\n");
                    const blob = new Blob([csvContent], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `${fullName.replace(/\s+/g, "_")}_loans_${
                      new Date().toISOString().split("T")[0]
                    }.csv`;
                    link.click();
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Number</TableHead>
                      <TableHead>Principal Amount</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(member.loans?.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No loans found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      member.loans.map((loan) => (
                        <TableRow key={loan.id} className="hover:bg-muted/50">
                          <TableCell className="font-semibold text-blue-600">
                            <Link
                              href={`/dashboard/business-management/loan/${loan.id}`}
                            >
                              {loan.loanNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦
                            {Number(loan.principalAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {formatDate(loan.startDate, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            {formatDate(loan.endDate, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                loan.status === "APPROVED" ||
                                loan.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : loan.status === "PENDING_APPROVAL"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {loan.status?.replace("_", " ") || "Unknown"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Documents ({member.documents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.documents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No documents uploaded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      member.documents.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {doc.documentType?.name || "Unknown Type"}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() =>
                                handleViewDocument(
                                  doc.id,
                                  doc.documentType?.name
                                )
                              }
                              className="text-blue-600 hover:underline"
                            >
                              View Document
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                doc.verified
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }
                            >
                              {doc.verified ? "Verified" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {doc.verificationNotes || "No notes"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600"
                                onClick={() =>
                                  handleViewDocument(
                                    doc.id,
                                    doc.documentType?.name
                                  )
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function UnionMemberDetailPage() {
  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can view member details." />
      }
    >
      <UnionMemberDetailPageContent />
    </StaffOnly>
  );
}
