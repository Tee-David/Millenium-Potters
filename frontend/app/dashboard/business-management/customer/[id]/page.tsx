"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Edit, Download, Trash2, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { unionMembersApi, loansApi, getAccessToken } from "@/lib/api";
import { format, parseISO, isValid } from "date-fns";
import { getUserDisplayName } from "@/utils/user-display";

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
  principalAmount: string; // API returns as string
  startDate: string;
  endDate: string;
  status:
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  unionId: string;
  unionName?: string;
  avatar?: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  state: string;
  country: string;
  city: string;
  zipCode: string;
  address: string;
  notes?: string;
  currentOfficerId: string;
  creditOfficerName?: string;
  documents: Document[];
  loans: Loan[];
}

function CustomerDetailPageContent() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format dates consistently
  const formatDate = (
    dateString: string | null | undefined,
    formatString: string = "MMMM dd, yyyy"
  ): string => {
    if (!dateString || dateString === "N/A") {
      return "N/A";
    }

    try {
      // Try to parse the date string
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, formatString);
      }

      // If parseISO fails, try creating a new Date object
      const fallbackDate = new Date(dateString);
      if (isValid(fallbackDate)) {
        return format(fallbackDate, formatString);
      }

      return "Invalid Date";
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return dateString; // Return original string if formatting fails
    }
  };

  // Specific function for date of birth formatting
  const formatDateOfBirth = (dateString: string | null | undefined): string => {
    return formatDate(dateString, "MMMM dd, yyyy");
  };

  // Function to handle document viewing with authentication
  const handleViewDocument = async (
    docId: string,
    docName: string = "document"
  ) => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.error("No authentication token found");
        alert("Authentication token not found. Please log in again.");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://millenium-potters.onrender.com/api";
      const documentUrl = `${apiUrl}/documents/serve/${docId}`;

      // Fetch the document with authorization header
      const response = await fetch(documentUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Failed to fetch document:",
          response.status,
          response.statusText
        );

        // Provide specific error messages based on status
        if (response.status === 404) {
          alert(
            "Document file not found. The file may have been deleted or moved. Please contact your administrator."
          );
        } else if (response.status === 401 || response.status === 403) {
          alert("You don't have permission to access this document.");
        } else if (response.status === 500) {
          alert("Server error. Please try again later.");
        } else {
          alert(
            `Failed to load document (Error: ${response.status}). Please try again.`
          );
        }
        return;
      }

      // Get the blob and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Try to determine file type from response headers
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";

      // For PDFs and images, open in new tab; for others, download
      if (contentType.includes("pdf") || contentType.includes("image")) {
        window.open(url, "_blank");
      } else {
        // Download the file
        const link = document.createElement("a");
        link.href = url;
        link.download = `${docName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error handling document view:", error);
      alert("An error occurred while trying to view the document.");
    }
  };

  const fetchData = async () => {
    if (!params?.id) {
      setError("Missing customer ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch union member details and loans in parallel
      const [memberResp, loansResp] = await Promise.all([
        unionMembersApi.getById(params.id),
        loansApi
          .getAll({ unionMemberId: params.id, limit: 100 })
          .catch((err: any) => {
            console.warn("Failed to fetch union member loans:", err);
            return { data: { data: [] } };
          }),
      ]);

      const memberData: CustomerDetail | any = memberResp.data.success
        ? memberResp.data.data
        : memberResp.data.data || memberResp.data;

      // Add loans from separate API call
      const loansData =
        loansResp?.data?.data?.loans ||
        loansResp?.data?.data ||
        loansResp?.data ||
        [];
      memberData.loans = Array.isArray(loansData) ? loansData : [];

      // Map the API response to the expected format
      // The API already includes union and currentOfficer data
      memberData.name =
        memberData.firstName && memberData.lastName
          ? `${memberData.firstName} ${memberData.lastName}`
          : memberData.firstName || memberData.lastName || "N/A";

      memberData.unionName = memberData.union?.name || "N/A";
      memberData.unionId = memberData.unionId || memberData.union?.id || "";
      memberData.currentOfficerId =
        memberData.currentOfficerId || memberData.currentOfficer?.id || "";
      memberData.creditOfficerName = getUserDisplayName(
        memberData.currentOfficer,
        "N/A"
      );

      // Map address fields
      memberData.city = memberData.city || "N/A";
      memberData.state = memberData.state || "N/A";
      memberData.country = memberData.country || "N/A";

      // Map other fields that might be missing
      memberData.gender = memberData.gender || "N/A";
      memberData.dateOfBirth = memberData.dateOfBirth || "N/A";
      memberData.maritalStatus = memberData.maritalStatus || "N/A";
      memberData.zipCode = memberData.zipCode || "N/A";
      memberData.notes = memberData.note || memberData.notes || "N/A";
      memberData.documents = memberData.documents || [];
      memberData.loans = memberData.loans || [];

      // Fetch documents separately if not included in union member response
      if (!memberData.documents || memberData.documents.length === 0) {
        try {
          const documentsResp = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "https://millenium-potters.onrender.com/api"
            }/documents/union-member/${params.id}`,
            {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
              },
            }
          );
          if (documentsResp.ok) {
            const documentsData = await documentsResp.json();
            console.log("Documents API Response:", documentsData);

            // Handle multiple response structures
            let documentsList = [];
            if (Array.isArray(documentsData)) {
              documentsList = documentsData;
            } else if (documentsData.data) {
              if (Array.isArray(documentsData.data)) {
                documentsList = documentsData.data;
              } else if (documentsData.data.documents) {
                documentsList = documentsData.data.documents;
              } else if (documentsData.data.data) {
                documentsList = Array.isArray(documentsData.data.data)
                  ? documentsData.data.data
                  : [];
              }
            } else if (documentsData.documents) {
              documentsList = documentsData.documents;
            }

            memberData.documents = Array.isArray(documentsList)
              ? documentsList
              : [];
            console.log("Processed documents:", memberData.documents);
          } else {
            console.warn(
              "Documents API returned status:",
              documentsResp.status
            );
            memberData.documents = [];
          }
        } catch (docError) {
          console.error("Failed to fetch documents:", docError);
          memberData.documents = [];
        }
      }

      setCustomer(memberData);
    } catch (err) {
      console.error("Failed to fetch customer details", err);
      setError("Failed to load customer details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params?.id]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading customer details...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch customer information
          </p>
        </div>
      </div>
    );
  if (error)
    return (
      <p className="text-center text-red-600 mt-10" role="alert">
        Error: {error}
      </p>
    );
  if (!customer)
    return (
      <p className="text-center text-gray-500 mt-10" role="alert">
        No customer data available.
      </p>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-2 py-4 sm:px-4 lg:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb aria-label="Breadcrumb">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard/business-management/customer">
                    Customer
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage aria-current="page">
                  {customer.id} Detail
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold break-words">
              {customer.id} Detail
            </h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={fetchData}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Link
                href={`/dashboard/business-management/customer/${customer.id}/edit`}
                className="w-full sm:w-auto"
              >
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
              </Link>
            </div>
          </div>

          {/* Customer Basic Info Card */}
          <Card role="region" aria-label="Customer Basic Information">
            <CardHeader>
              <CardTitle className="text-lg">{customer.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-6">
                    <Avatar className="h-16 w-16 sm:h-12 sm:w-12">
                      <AvatarFallback className="bg-muted text-sm font-medium">
                        {customer.avatar || (customer.name?.charAt(0) ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-lg sm:text-base">
                        {customer.name || "N/A"}
                      </h3>
                      <p className="text-sm text-muted-foreground break-all">
                        {customer.id}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Union
                    </label>
                    <p className="mt-1">{customer.unionName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone Number
                    </label>
                    <p className="mt-1">{customer.phone || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Marital Status
                    </label>
                    <p className="mt-1">{customer.maritalStatus || "N/A"}</p>
                  </div>
                </div>

                {/* Middle */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Name
                    </label>
                    <p className="mt-1">{customer.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Gender
                    </label>
                    <p className="mt-1">{customer.gender || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </label>
                    <p className="mt-1">
                      {formatDateOfBirth(customer.dateOfBirth)}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="mt-1 text-blue-600">
                      {customer.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Credit Officer
                    </label>
                    <p className="mt-1">
                      {customer.creditOfficerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      State
                    </label>
                    <p className="mt-1">{customer.state || "N/A"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Detail Card */}
          <Card role="region" aria-label="Additional Details">
            <CardHeader>
              <CardTitle className="text-lg">Additional Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <p className="mt-1">{customer.country || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Notes
                    </label>
                    <p className="mt-1">{customer.notes || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      City
                    </label>
                    <p className="mt-1">{customer.city || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Zip Code
                    </label>
                    <p className="mt-1">{customer.zipCode || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <p className="mt-1">{customer.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loans Collected Card */}
          <Card role="region" aria-label="Loans Collected">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Loans Collected</CardTitle>
              {(customer.loans?.length ?? 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Export loans data to CSV
                    const headers = [
                      "Loan Number",
                      "Principal Amount",
                      "Start Date",
                      "End Date",
                      "Status",
                    ];
                    const rows =
                      customer.loans?.map((loan) => [
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
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute(
                      "download",
                      `${customer.name.replace(/\s+/g, "_")}_loans_${new Date().toISOString().split("T")[0]
                      }.csv`
                    );
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
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Loan Number
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Principal Amount
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Start Date
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        End Date
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(customer.loans?.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No loans found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customer.loans.map((loan) => (
                        <TableRow key={loan.id} className="hover:bg-muted/50">
                          <TableCell className="font-semibold text-blue-600">
                            {loan.loanNumber}
                          </TableCell>
                          <TableCell className="font-medium">{`₦${Number(
                            loan.principalAmount || 0
                          ).toLocaleString()}`}</TableCell>
                          <TableCell>
                            {formatDate(loan.startDate, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            {formatDate(loan.endDate, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                loan.status === "APPROVED" ||
                                  loan.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                loan.status === "APPROVED" ||
                                  loan.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : loan.status === "PENDING_APPROVAL"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {(customer.loans?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No loans found for this customer
                  </div>
                ) : (
                  customer.loans?.map((loan) => (
                    <Card key={loan.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm">
                              Loan #{loan.loanNumber}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              ID: {loan.id}
                            </p>
                          </div>
                          <Badge
                            variant={
                              loan.status === "APPROVED" ||
                                loan.status === "ACTIVE"
                                ? "default"
                                : loan.status === "PENDING_APPROVAL"
                                  ? "secondary"
                                  : loan.status === "REJECTED"
                                    ? "destructive"
                                    : "outline"
                            }
                            className="text-xs"
                          >
                            {loan.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Amount:
                            </span>
                            <p className="font-medium">
                              ₦
                              {parseFloat(
                                loan.principalAmount || "0"
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Start Date:
                            </span>
                            <p className="font-medium">
                              {formatDate(loan.startDate, "MMM dd, yyyy")}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              End Date:
                            </span>
                            <p className="font-medium">
                              {formatDate(loan.endDate, "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card role="region" aria-label="Customer Documents">
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Document
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Notes
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.documents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No documents uploaded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customer.documents.map((doc, idx) => (
                        <TableRow key={doc.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {doc.documentType?.name || "Unknown Type"}
                          </TableCell>
                          <TableCell className="text-blue-600 hover:text-blue-800 cursor-pointer">
                            <button
                              onClick={() =>
                                handleViewDocument(
                                  doc.id,
                                  doc.documentType?.name || "document"
                                )
                              }
                              className="hover:underline"
                            >
                              View Document
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={doc.verified ? "default" : "secondary"}
                              className={
                                doc.verified
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
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
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                onClick={() =>
                                  handleViewDocument(
                                    doc.id,
                                    doc.documentType?.name || "document"
                                  )
                                }
                                aria-label={`Download ${doc.documentType?.name || "document"
                                  }`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                aria-label={`Delete ${doc.documentType?.name || "document"
                                  }`}
                              // implement document delete logic if needed
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {customer.documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents found for this customer
                  </div>
                ) : (
                  customer.documents.map((doc) => (
                    <Card key={doc.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm">
                              {doc.documentType?.name || "Unknown Type"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Uploaded:{" "}
                              {formatDate(doc.uploadedAt, "MMM dd, yyyy")}
                            </p>
                          </div>
                          <Badge
                            variant={doc.verified ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {doc.verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-muted-foreground text-sm">
                              Notes:
                            </span>
                            <p className="text-sm">
                              {doc.verificationNotes || "No notes"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
                              onClick={() =>
                                handleViewDocument(
                                  doc.id,
                                  doc.documentType?.name || "document"
                                )
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                              onClick={() => {
                                // implement document delete logic if needed
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can view customer details." />
      }
    >
      <CustomerDetailPageContent />
    </StaffOnly>
  );
}
