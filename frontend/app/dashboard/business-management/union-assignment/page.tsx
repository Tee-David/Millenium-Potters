"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { unionsApi, usersApi, unionMembersApi } from "@/lib/api";
import { SearchableSelect } from "@/components/SearchableSelect";
import {
  Building2,
  User,
  Search,
  RefreshCw,
  ArrowRight,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Mail,
  Phone,
  CheckSquare,
  Square,
  Users,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Union {
  id: string;
  name: string;
  location?: string;
  address?: string;
  creditOfficerId?: string;
  creditOfficer?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    unionMembers: number;
    loans: number;
  };
}

interface CreditOfficer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

interface AssignmentStats {
  totalUnions: number;
  assignedUnions: number;
  unassignedUnions: number;
  totalCreditOfficers: number;
  assignedCreditOfficers: number;
  unassignedCreditOfficers: number;
}

export default function UnionAssignmentPage() {
  const router = useRouter();
  const [unions, setUnions] = useState<Union[]>([]);
  const [creditOfficers, setCreditOfficers] = useState<CreditOfficer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [officerFilter, setOfficerFilter] = useState<string>("all");
  const [stats, setStats] = useState<AssignmentStats | null>(null);

  // Dialog states
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUnion, setSelectedUnion] = useState<Union | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection states
  const [selectedUnions, setSelectedUnions] = useState<Set<string>>(new Set());
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
  const [bulkOfficerId, setBulkOfficerId] = useState<string>("");
  const [bulkReason, setBulkReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [unionsResponse, officersResponse] = await Promise.all([
        unionsApi.getAll({ limit: 1000 }),
        usersApi.getAll({ role: "CREDIT_OFFICER" }),
      ]);

      const unionsData = unionsResponse.data;
      const officersData = officersResponse.data;

      if (unionsData.success) {
        setUnions(unionsData.data || []);
      }

      // Parse the response - handle different response structures
      let officers: CreditOfficer[] = [];
      if (officersData.success && officersData.data) {
        // New API format: { success: true, data: { users: [...] } }
        officers = officersData.data.users || officersData.data || [];
      } else if (officersData.data) {
        // Alternative format: { data: { users: [...] } }
        officers = officersData.data.users || officersData.data || [];
      } else if (Array.isArray(officersData)) {
        // Direct array response
        officers = officersData;
      } else if (Array.isArray(officersData.data)) {
        // Array in data property
        officers = officersData.data;
      }

      // Filter for active credit officers only
      officers = officers.filter(
        (officer: any) =>
          officer.role === "CREDIT_OFFICER" &&
          officer.isActive !== false &&
          !officer.deletedAt
      );

      setCreditOfficers(officers);
      console.log("Loaded credit officers:", officers.length, officers);

      // Calculate stats
      const assignedUnions = (unionsData.data || []).filter(
        (u: Union) => u.creditOfficerId
      ).length;
      const assignedOfficers = new Set(
        (unionsData.data || [])
          .map((u: Union) => u.creditOfficerId)
          .filter(Boolean)
      ).size;

      setStats({
        totalUnions: (unionsData.data || []).length,
        assignedUnions,
        unassignedUnions: (unionsData.data || []).length - assignedUnions,
        totalCreditOfficers: Array.isArray(officers)
          ? officers.filter(
              (o: any) => o.role === "CREDIT_OFFICER" && o.isActive
            ).length
          : 0,
        assignedCreditOfficers: assignedOfficers,
        unassignedCreditOfficers:
          (Array.isArray(officers)
            ? officers.filter(
                (o: any) => o.role === "CREDIT_OFFICER" && o.isActive
              ).length
            : 0) - assignedOfficers,
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUnion || !selectedOfficerId) {
      toast.error("Please select a credit officer");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await unionsApi.assign(selectedUnion.id, {
        creditOfficerId: selectedOfficerId,
        reason: reason || undefined,
      });

      if (response.data.success) {
        toast.success("Union assigned successfully");
        setIsAssignDialogOpen(false);
        setSelectedUnion(null);
        setSelectedOfficerId("");
        setReason("");
        loadData();
      } else {
        throw new Error(response.data.message || "Failed to assign union");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to assign union";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignDialog = (union: Union) => {
    setSelectedUnion(union);
    setSelectedOfficerId(union.creditOfficerId || "");
    setIsAssignDialogOpen(true);
  };

  // Bulk selection handlers
  const toggleUnionSelection = (unionId: string) => {
    setSelectedUnions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(unionId)) {
        newSet.delete(unionId);
      } else {
        newSet.add(unionId);
      }
      return newSet;
    });
  };

  const selectAllUnions = () => {
    if (selectedUnions.size === filteredUnions.length) {
      setSelectedUnions(new Set());
    } else {
      setSelectedUnions(new Set(filteredUnions.map((u) => u.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUnions.size === 0 || !bulkOfficerId) {
      toast.error("Please select unions and a credit officer");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const promises = Array.from(selectedUnions).map(async (unionId) => {
        try {
          const response = await unionsApi.assign(unionId, {
            creditOfficerId: bulkOfficerId,
            reason: bulkReason || undefined,
          });
          if (response.data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      });

      await Promise.all(promises);

      if (successCount > 0) {
        toast.success(`Successfully assigned ${successCount} union(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to assign ${failCount} union(s)`);
      }

      setIsBulkAssignDialogOpen(false);
      setSelectedUnions(new Set());
      setBulkOfficerId("");
      setBulkReason("");
      loadData();
    } catch (err: any) {
      toast.error("Bulk assignment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUnions = useMemo(() => {
    let filtered = unions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (union) =>
          union.name.toLowerCase().includes(term) ||
          union.location?.toLowerCase().includes(term) ||
          union.creditOfficer?.email.toLowerCase().includes(term) ||
          union.creditOfficer?.firstName?.toLowerCase().includes(term) ||
          union.creditOfficer?.lastName?.toLowerCase().includes(term)
      );
    }

    if (officerFilter !== "all") {
      filtered = filtered.filter(
        (union) => union.creditOfficerId === officerFilter
      );
    }

    return filtered;
  }, [unions, searchTerm, officerFilter]);

  const getOfficerName = (officer: CreditOfficer) => {
    if (officer.firstName && officer.lastName) {
      return `${officer.firstName} ${officer.lastName}`;
    }
    return officer.email;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assignment</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage union and member assignments
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="union" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="union" className="gap-2">
            <Building2 className="h-4 w-4" />
            Union Assignment
          </TabsTrigger>
          <TabsTrigger value="member" className="gap-2">
            <User className="h-4 w-4" />
            Member Assignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="union" className="mt-6 space-y-6">

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Unions
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.totalUnions}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {stats.assignedUnions} Assigned
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  {stats.unassignedUnions} Unassigned
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Credit Officers
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {stats.totalCreditOfficers}
                  </p>
                </div>
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {stats.assignedCreditOfficers} Assigned
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-800"
                >
                  {stats.unassignedCreditOfficers} Unassigned
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Assignment Rate
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {stats.totalUnions > 0
                      ? Math.round(
                          (stats.assignedUnions / stats.totalUnions) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search unions or officers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="officer">Credit Officer</Label>
              <SearchableSelect
                value={officerFilter}
                onValueChange={setOfficerFilter}
                placeholder="All Officers"
                searchPlaceholder="Search credit officers..."
                options={[
                  { value: "all", label: "All Officers" },
                  ...creditOfficers.map((officer) => ({
                    value: officer.id,
                    label: getOfficerName(officer),
                  })),
                ]}
              />
            </div>
            <div className="flex items-end gap-2">
              {(searchTerm || officerFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setOfficerFilter("all");
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedUnions.size > 0 && (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedUnions.size} union(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUnions(new Set())}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsBulkAssignDialogOpen(true)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users className="h-4 w-4" />
                  Bulk Assign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unions Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Unions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && unions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error && unions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" onClick={loadData} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredUnions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">No unions found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || officerFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create unions to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUnions.size === filteredUnions.length && filteredUnions.length > 0}
                        onCheckedChange={selectAllUnions}
                      />
                    </TableHead>
                    <TableHead>Union</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Current Officer</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead className="text-center">Loans</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnions.map((union) => (
                    <TableRow key={union.id} className={selectedUnions.has(union.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUnions.has(union.id)}
                          onCheckedChange={() => toggleUnionSelection(union.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {union.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {union.location ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{union.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {union.creditOfficer ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="text-sm font-medium">
                                {union.creditOfficer.firstName &&
                                union.creditOfficer.lastName
                                  ? `${union.creditOfficer.firstName} ${union.creditOfficer.lastName}`
                                  : union.creditOfficer.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {union.creditOfficer.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <UserX className="h-3 w-3 mr-1" />
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {union._count?.unionMembers || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {union._count?.loans || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignDialog(union)}
                          className="gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Credit Officer</DialogTitle>
            <DialogDescription>
              Assign a credit officer to {selectedUnion?.name || "this union"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="union-name">Union</Label>
              <Input
                id="union-name"
                value={selectedUnion?.name || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-officer">
                Credit Officer <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={selectedOfficerId}
                onValueChange={setSelectedOfficerId}
                placeholder="Select credit officer"
                searchPlaceholder="Search credit officers..."
                options={creditOfficers.map((officer) => ({
                  value: officer.id,
                  label: `${getOfficerName(officer)} (${officer.email})`,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for assignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedUnion(null);
                setSelectedOfficerId("");
                setReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isSubmitting || !selectedOfficerId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={isBulkAssignDialogOpen} onOpenChange={setIsBulkAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Assign Credit Officer</DialogTitle>
            <DialogDescription>
              Assign {selectedUnions.size} selected union(s) to a credit officer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selected Unions ({selectedUnions.size})</Label>
              <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md p-3 space-y-1">
                {Array.from(selectedUnions).map((id) => {
                  const union = unions.find((u) => u.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2 text-sm">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <span>{union?.name || id}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-credit-officer">
                Credit Officer <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={bulkOfficerId}
                onValueChange={setBulkOfficerId}
                placeholder="Select credit officer"
                searchPlaceholder="Search credit officers..."
                options={creditOfficers.map((officer) => ({
                  value: officer.id,
                  label: `${getOfficerName(officer)} (${officer.email})`,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-reason">Reason (Optional)</Label>
              <Textarea
                id="bulk-reason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Enter reason for bulk assignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkAssignDialogOpen(false);
                setBulkOfficerId("");
                setBulkReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={isSubmitting || !bulkOfficerId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${selectedUnions.size} Union(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="member" className="mt-6 space-y-6">
          <MemberAssignmentTab unions={unions} onRefresh={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Member Assignment Tab Component
interface MemberAssignmentTabProps {
  unions: Union[];
  onRefresh: () => void;
}

interface UnionMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  unionId: string;
  union?: {
    id: string;
    name: string;
  };
}

function MemberAssignmentTab({ unions, onRefresh }: MemberAssignmentTabProps) {
  const [members, setMembers] = useState<UnionMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unionFilter, setUnionFilter] = useState<string>("all");

  // Dialog states
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UnionMember | null>(null);
  const [selectedUnionId, setSelectedUnionId] = useState<string>("");
  const [reassignReason, setReassignReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection states
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isBulkReassignDialogOpen, setIsBulkReassignDialogOpen] = useState(false);
  const [bulkUnionId, setBulkUnionId] = useState<string>("");
  const [bulkReassignReason, setBulkReassignReason] = useState("");

  // Double confirmation states
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [showBulkFinalConfirmation, setShowBulkFinalConfirmation] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await unionMembersApi.getAll({ limit: 1000 });
      if (response.data.success) {
        setMembers(response.data.data?.members || response.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedMember || !selectedUnionId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await unionMembersApi.reassign(selectedMember.id, {
        newUnionId: selectedUnionId,
        reason: reassignReason || undefined,
      });

      if (response.data.success) {
        toast.success("Member reassigned successfully");
        setShowFinalConfirmation(false);
        setIsReassignDialogOpen(false);
        setSelectedMember(null);
        setSelectedUnionId("");
        setReassignReason("");
        loadMembers();
        onRefresh();
      } else {
        throw new Error(response.data.message || "Failed to reassign member");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to reassign member";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReassignDialog = (member: UnionMember) => {
    setSelectedMember(member);
    setSelectedUnionId("");
    setIsReassignDialogOpen(true);
  };

  // Bulk selection handlers
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const selectAllMembers = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleBulkReassign = async () => {
    if (selectedMembers.size === 0 || !bulkUnionId) {
      toast.error("Please select members and a union");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const promises = Array.from(selectedMembers).map(async (memberId) => {
        try {
          const response = await unionMembersApi.reassign(memberId, {
            newUnionId: bulkUnionId,
            reason: bulkReassignReason || undefined,
          });
          if (response.data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      });

      await Promise.all(promises);

      if (successCount > 0) {
        toast.success(`Successfully reassigned ${successCount} member(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to reassign ${failCount} member(s)`);
      }

      setShowBulkFinalConfirmation(false);
      setIsBulkReassignDialogOpen(false);
      setSelectedMembers(new Set());
      setBulkUnionId("");
      setBulkReassignReason("");
      loadMembers();
      onRefresh();
    } catch (err: any) {
      toast.error("Bulk reassignment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    let filtered = members;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.firstName.toLowerCase().includes(term) ||
          member.lastName.toLowerCase().includes(term) ||
          member.email?.toLowerCase().includes(term) ||
          member.phone?.toLowerCase().includes(term)
      );
    }

    if (unionFilter !== "all") {
      filtered = filtered.filter((member) => member.unionId === unionFilter);
    }

    return filtered;
  }, [members, searchTerm, unionFilter]);

  return (
    <>
      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="member-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="member-search"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="union-filter">Union</Label>
              <SearchableSelect
                value={unionFilter}
                onValueChange={setUnionFilter}
                placeholder="All Unions"
                searchPlaceholder="Search unions..."
                options={[
                  { value: "all", label: "All Unions" },
                  ...unions.map((union) => ({
                    value: union.id,
                    label: union.name,
                  })),
                ]}
              />
            </div>
            <div className="flex items-end gap-2">
              {(searchTerm || unionFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setUnionFilter("all");
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar for Members */}
      {selectedMembers.size > 0 && (
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  {selectedMembers.size} member(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMembers(new Set())}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsBulkReassignDialogOpen(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Users className="h-4 w-4" />
                  Bulk Reassign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle>Union Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No members found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {searchTerm || unionFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add union members to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                        onCheckedChange={selectAllMembers}
                      />
                    </TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Current Union</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className={selectedMembers.has(member.id) ? "bg-green-50 dark:bg-green-900/20" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMembers.has(member.id)}
                          onCheckedChange={() => toggleMemberSelection(member.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {member.firstName} {member.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {member.email && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.union ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            <span>{member.union.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReassignDialog(member)}
                          className="gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Reassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reassign Member</DialogTitle>
            <DialogDescription>
              Reassign {selectedMember?.firstName} {selectedMember?.lastName} to a different union.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Member</Label>
              <Input
                id="member-name"
                value={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ""}
                disabled
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-union">Current Union</Label>
              <Input
                id="current-union"
                value={selectedMember?.union?.name || "No union"}
                disabled
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-union">
                New Union <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={selectedUnionId}
                onValueChange={setSelectedUnionId}
                placeholder="Select new union"
                searchPlaceholder="Search unions..."
                options={unions
                  .filter((u) => u.id !== selectedMember?.unionId)
                  .map((union) => ({
                    value: union.id,
                    label: union.name,
                  }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reassign-reason">Reason (Optional)</Label>
              <Textarea
                id="reassign-reason"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="Enter reason for reassignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReassignDialogOpen(false);
                setSelectedMember(null);
                setSelectedUnionId("");
                setReassignReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowFinalConfirmation(true)}
              disabled={isSubmitting || !selectedUnionId}
            >
              Continue to Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation for Single Member Reassignment */}
      <AlertDialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Member Reassignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reassign <strong>{selectedMember?.firstName} {selectedMember?.lastName}</strong> to a different union?
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>The member will be moved to the new union</li>
                <li>Their loans will be transferred to the new credit officer</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReassign}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                "Yes, Reassign Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reassign Dialog for Members */}
      <Dialog open={isBulkReassignDialogOpen} onOpenChange={setIsBulkReassignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Reassign Members</DialogTitle>
            <DialogDescription>
              Reassign {selectedMembers.size} selected member(s) to a new union.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selected Members ({selectedMembers.size})</Label>
              <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md p-3 space-y-1">
                {Array.from(selectedMembers).map((id) => {
                  const member = members.find((m) => m.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-gray-400" />
                      <span>{member ? `${member.firstName} ${member.lastName}` : id}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-new-union">
                New Union <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={bulkUnionId}
                onValueChange={setBulkUnionId}
                placeholder="Select new union"
                searchPlaceholder="Search unions..."
                options={unions.map((union) => ({
                  value: union.id,
                  label: union.name,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-reassign-reason">Reason (Optional)</Label>
              <Textarea
                id="bulk-reassign-reason"
                value={bulkReassignReason}
                onChange={(e) => setBulkReassignReason(e.target.value)}
                placeholder="Enter reason for bulk reassignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkReassignDialogOpen(false);
                setBulkUnionId("");
                setBulkReassignReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowBulkFinalConfirmation(true)}
              disabled={isSubmitting || !bulkUnionId}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation for Bulk Member Reassignment */}
      <AlertDialog open={showBulkFinalConfirmation} onOpenChange={setShowBulkFinalConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Reassignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reassign <strong>{selectedMembers.size} member(s)</strong> to a new union?
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>All selected members will be moved to the new union</li>
                <li>Their loans will be transferred to the new credit officer</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReassign}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                `Yes, Reassign ${selectedMembers.size} Member(s)`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
