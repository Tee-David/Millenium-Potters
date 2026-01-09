"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Building2,
  UserCheck,
  UserX,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Settings,
  History,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  UserPlus,
  Building,
} from "lucide-react";
import { branchesApi, usersApi, handleDatabaseError } from "@/lib/api";
import { UserRole } from "@/lib/enum";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  manager?: {
    id: string;
    email: string;
    role: string;
  };
  _count?: {
    users: number;
    customers: number;
    loans: number;
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

interface AssignmentStats {
  totalBranches: number;
  totalUsers: number;
  assignedUsers: number;
  unassignedUsers: number;
  branchesWithManagers: number;
  branchesWithoutManagers: number;
}

export default function BranchAssignmentsPage() {
  // ...existing code...
}
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [stats, setStats] = useState<AssignmentStats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [unassigningUsers, setUnassigningUsers] = useState<Set<string>>(
//     new Set()
//   );
//   const [unassigningManagers, setUnassigningManagers] = useState<Set<string>>(
//     new Set()
//   );

//   // Filter states
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
//   const [roleFilter, setRoleFilter] = useState<string>("all");
//   const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

//   // Branch-specific filter states
//   const [branchSearchTerm, setBranchSearchTerm] = useState("");
//   const [branchManagerFilter, setBranchManagerFilter] = useState<string>("all");

//   useEffect(() => {
//     loadData();
//   }, []);

//   // Debounce search term for better performance
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 300); // 300ms delay

//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   const loadData = async () => {
//     try {
//       console.log("Loading data...");
//       setLoading(true);
//       setError(null);

//       const [branchesResponse, usersResponse] = await Promise.all([
//         branchesApi.getAll(),
//         usersApi.getAll(),
//       ]);

//       console.log("API responses received:", {
//         branchesResponse: branchesResponse.data,
//         usersResponse: usersResponse.data,
//       });

//       // Handle branches data
//       const branchesData =
//         branchesResponse.data?.data || branchesResponse.data || [];

//       // Handle users data - check multiple possible response structures
//       const usersData =
//         usersResponse.data?.data?.users ||
//         usersResponse.data?.users ||
//         usersResponse.data?.data ||
//         usersResponse.data ||
//         [];

//       // Filter out customers - only show staff users (BRANCH_MANAGER, CREDIT_OFFICER)
//       // Admins should not be shown as they have system-wide access and don't need branch assignment
//       const staffUsers = usersData.filter(
//         (user: User) =>
//           user.role === UserRole.BRANCH_MANAGER ||
//           user.role === UserRole.CREDIT_OFFICER
//       );

//       setBranches(Array.isArray(branchesData) ? branchesData : []);
//       setUsers(Array.isArray(staffUsers) ? staffUsers : []);

//       console.log("Data loaded successfully. Final state:", {
//         branchesCount: Array.isArray(branchesData) ? branchesData.length : 0,
//         usersCount: Array.isArray(staffUsers) ? staffUsers.length : 0,
//       });

//       console.log("BranchAssignmentsPage: Loaded data:", {
//         totalBranches: branchesData.length,
//         totalUsers: staffUsers.length,
//         creditOfficers: staffUsers.filter(
//           (u: User) => u.role === UserRole.CREDIT_OFFICER
//         ).length,
//         branchManagers: staffUsers.filter(
//           (u: User) => u.role === UserRole.BRANCH_MANAGER
//         ).length,
//         usersByBranch: staffUsers.reduce((acc: any, user: User) => {
//           const branchId = user.branchId || "unassigned";
//           if (!acc[branchId]) acc[branchId] = [];
//           acc[branchId].push({
//             email: user.email,
//             role: user.role,
//             name: user.name,
//           });
//           return acc;
//         }, {} as any),
//         branchesWithManagers: branchesData.filter((b: Branch) => b.managerId)
//           .length,
//         branchesWithoutManagers: branchesData.filter(
//           (b: Branch) => !b.managerId
//         ).length,
//       });

//       // Log branch counts from API response
//       console.log("Branch counts from API:");
//       branchesData.forEach((branch: Branch) => {
//         console.log(
//           `  ${branch.name}: ${branch._count?.users || 0} users (branchId: ${
//             branch.id
//           })`
//         );
//         // Also log actual users assigned to this branch from the users array
//         const actualUsersInBranch = staffUsers.filter(
//           (u: User) => u.branchId === branch.id
//         );
//         console.log(
//           `    Actual users in array: ${actualUsersInBranch.length}`,
//           actualUsersInBranch.map((u: User) => u.email)
//         );
//       });

//       // Calculate stats
//       const totalBranches = branchesData.length;
//       const totalUsers = staffUsers.length;
//       const assignedUsers = staffUsers.filter(
//         (user: User) => user.branchId
//       ).length;
//       const unassignedUsers = totalUsers - assignedUsers;
//       const branchesWithManagers = branchesData.filter(
//         (branch: Branch) => branch.managerId
//       ).length;
//       const branchesWithoutManagers = totalBranches - branchesWithManagers;

//       setStats({
//         totalBranches,
//         totalUsers,
//         assignedUsers,
//         unassignedUsers,
//         branchesWithManagers,
//         branchesWithoutManagers,
//       });
//     } catch (error: any) {
//       console.error("Failed to load assignment data:", error);

//       // Handle database errors with custom message
//       if (
//         handleDatabaseError(
//           error,
//           "Failed to load assignment data due to database connection issues. Please try again."
//         )
//       ) {
//         return;
//       }

//       // Fallback error handling
//       setError(error.response?.data?.message || "Failed to load data");
//       toast.error("Failed to load assignment data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUnassignUser = async (userId: string) => {
//     console.log("Starting unassign process for user:", userId);

//     // Find the user before unassigning to see their current branch
//     const userToUnassign = users.find((u) => u.id === userId);
//     console.log("User to unassign:", {
//       userId,
//       currentBranchId: userToUnassign?.branchId,
//       email: userToUnassign?.email,
//       role: userToUnassign?.role,
//     });

//     setUnassigningUsers((prev) => new Set(prev).add(userId));
//     try {
//       console.log("Calling usersApi.update with branchId: null");
//       const response = await usersApi.update(userId, { branchId: null });
//       console.log("Update API response:", response.data);

//       console.log("Reloading data after successful unassign");
//       await loadData();

//       console.log("User unassigned successfully - data has been reloaded");
//       toast.success("User unassigned from branch successfully");
//     } catch (error: any) {
//       console.error("Failed to unassign user:", error);
//       console.error("Error response:", error.response?.data);
//       toast.error(error.response?.data?.message || "Failed to unassign user");
//     } finally {
//       setUnassigningUsers((prev) => {
//         const newSet = new Set(prev);
//         newSet.delete(userId);
//         return newSet;
//       });
//     }
//   };

//   const handleUnassignManager = async (branchId: string) => {
//     setUnassigningManagers((prev) => new Set(prev).add(branchId));
//     try {
//       await branchesApi.update(branchId, { managerId: undefined });
//       await loadData();
//       toast.success("Branch manager unassigned successfully");
//     } catch (error: any) {
//       console.error("Failed to unassign manager:", error);
//       toast.error(
//         error.response?.data?.message || "Failed to unassign manager"
//       );
//     } finally {
//       setUnassigningManagers((prev) => {
//         const newSet = new Set(prev);
//         newSet.delete(branchId);
//         return newSet;
//       });
//     }
//   };

//   // Filter users based on search and filters
//   const filteredUsers = users.filter((user) => {
//     const matchesSearch =
//       user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
//     const matchesRole = roleFilter === "all" || user.role === roleFilter;
//     const matchesAssignment =
//       assignmentFilter === "all" ||
//       (assignmentFilter === "assigned" && user.branchId) ||
//       (assignmentFilter === "unassigned" && !user.branchId);

//     return matchesSearch && matchesRole && matchesAssignment;
//   });

//   // Filter branches based on search and filters
//   const filteredBranches = branches.filter((branch) => {
//     const matchesSearch =
//       branch.name.toLowerCase().includes(branchSearchTerm.toLowerCase()) ||
//       branch.code.toLowerCase().includes(branchSearchTerm.toLowerCase());
//     const matchesManagerFilter =
//       branchManagerFilter === "all" ||
//       (branchManagerFilter === "with_manager" && branch.managerId) ||
//       (branchManagerFilter === "without_manager" && !branch.managerId);

//     return matchesSearch && matchesManagerFilter;
//   });

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen px-4 sm:px-6">
//         <div className="text-center">
//           <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600 text-sm sm:text-base">
//             Loading assignment data...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen px-4 sm:px-6">
//         <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
//           <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
//           <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
//             Error Loading Data
//           </h3>
//           <p className="text-xs sm:text-base text-gray-600 mb-4">{error}</p>
//           <Button
//             onClick={loadData}
//             className="w-full bg-emerald-600 hover:bg-emerald-700"
//           >
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Try Again
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white">
//       <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
//         {/* Header */}
//         <div className="mb-8 sm:mb-12">
//           <div className="flex flex-col gap-6">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//               <div className="flex items-center space-x-3">
//                 <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg flex-shrink-0">
//                   <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent text-balance">
//                     Branch Assignments
//                   </h1>
//                   <p className="text-xs sm:text-base md:text-lg text-gray-600 mt-1">
//                     Manage user assignments to branches and branch managers
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
//               <Button
//                 onClick={() =>
//                   router.push("/dashboard/business-management/bulk-assignment")
//                 }
//                 className="flex items-center justify-center sm:justify-start space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base py-2 sm:py-2.5"
//               >
//                 <UserPlus className="w-4 h-4 flex-shrink-0" />
//                 <span>Bulk Assign</span>
//               </Button>
//               <Button
//                 variant="outline"
//                 onClick={() =>
//                   router.push(
//                     "/dashboard/business-management/assignment-history"
//                   )
//                 }
//                 className="flex items-center justify-center sm:justify-start space-x-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-sm sm:text-base py-2 sm:py-2.5"
//               >
//                 <History className="w-4 h-4 flex-shrink-0" />
//                 <span>Assignment History</span>
//               </Button>
//               <Button
//                 onClick={loadData}
//                 variant="outline"
//                 className="flex items-center justify-center sm:justify-start space-x-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm sm:text-base py-2 sm:py-2.5 bg-transparent"
//               >
//                 <RefreshCw className="w-4 h-4 flex-shrink-0" />
//                 <span>Refresh</span>
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         {stats && (
//           <div className="mb-8 sm:mb-12">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
//               <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 bg-gradient-to-r from-green-50 to-green-100/50 px-4 sm:px-6 py-3 sm:py-4">
//                   <CardTitle className="text-xs sm:text-sm font-semibold text-green-700">
//                     Total Branches
//                   </CardTitle>
//                   <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
//                     <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
//                   <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
//                     {stats.totalBranches}
//                   </div>
//                   <p className="text-xs sm:text-sm text-green-600 font-medium">
//                     {stats.branchesWithManagers} with managers
//                   </p>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 bg-gradient-to-r from-blue-50 to-blue-100/50 px-4 sm:px-6 py-3 sm:py-4">
//                   <CardTitle className="text-xs sm:text-sm font-semibold text-blue-700">
//                     Total Users
//                   </CardTitle>
//                   <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
//                     <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
//                   <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
//                     {stats.totalUsers}
//                   </div>
//                   <p className="text-xs sm:text-sm text-blue-600 font-medium">
//                     {stats.assignedUsers} assigned
//                   </p>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 bg-gradient-to-r from-orange-50 to-orange-100/50 px-4 sm:px-6 py-3 sm:py-4">
//                   <CardTitle className="text-xs sm:text-sm font-semibold text-orange-700">
//                     Unassigned Users
//                   </CardTitle>
//                   <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
//                     <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
//                   <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
//                     {stats.unassignedUsers}
//                   </div>
//                   <p className="text-xs sm:text-sm text-orange-600 font-medium">
//                     Need assignment
//                   </p>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 bg-gradient-to-r from-red-50 to-red-100/50 px-4 sm:px-6 py-3 sm:py-4">
//                   <CardTitle className="text-xs sm:text-sm font-semibold text-red-700">
//                     Branches Without Managers
//                   </CardTitle>
//                   <div className="p-2 bg-red-500 rounded-lg flex-shrink-0">
//                     <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
//                   <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">
//                     {stats.branchesWithoutManagers}
//                   </div>
//                   <p className="text-xs sm:text-sm text-red-600 font-medium">
//                     Need managers
//                   </p>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         )}

//         {/* Filters & Search with Results */}
//         <Card className="mb-8 sm:mb-12 bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
//           <CardHeader className="pb-4 sm:pb-6 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 sm:px-6">
//             <CardTitle className="flex items-center space-x-3 text-base sm:text-lg">
//               <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
//                 <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
//               </div>
//               <span className="font-semibold text-gray-900">
//                 Filters & Search
//               </span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
//               <div className="space-y-2 sm:space-y-3">
//                 <Label
//                   htmlFor="search"
//                   className="text-xs sm:text-sm font-semibold text-gray-700"
//                 >
//                   Search Users & Branches
//                 </Label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
//                   <Input
//                     id="search"
//                     placeholder="Search..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10 h-10 sm:h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl text-sm"
//                   />
//                   {searchTerm && searchTerm !== debouncedSearchTerm && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//               <div className="space-y-2 sm:space-y-3">
//                 <Label
//                   htmlFor="role-filter"
//                   className="text-xs sm:text-sm font-semibold text-gray-700"
//                 >
//                   Filter by Role
//                 </Label>
//                 <Select value={roleFilter} onValueChange={setRoleFilter}>
//                   <SelectTrigger className="h-10 sm:h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl text-sm">
//                     <SelectValue placeholder="Filter by role" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Roles</SelectItem>
//                     <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
//                     <SelectItem value={UserRole.BRANCH_MANAGER}>
//                       Branch Manager
//                     </SelectItem>
//                     <SelectItem value={UserRole.CREDIT_OFFICER}>
//                       Credit Officer
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2 sm:space-y-3">
//                 <Label
//                   htmlFor="assignment-filter"
//                   className="text-xs sm:text-sm font-semibold text-gray-700"
//                 >
//                   Assignment Status
//                 </Label>
//                 <Select
//                   value={assignmentFilter}
//                   onValueChange={setAssignmentFilter}
//                 >
//                   <SelectTrigger className="h-10 sm:h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl text-sm">
//                     <SelectValue placeholder="Filter by assignment" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Users</SelectItem>
//                     <SelectItem value="assigned">Assigned</SelectItem>
//                     <SelectItem value="unassigned">Unassigned</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Search Results Section */}
//             {(debouncedSearchTerm ||
//               roleFilter !== "all" ||
//               assignmentFilter !== "all") && (
//               <div className="border-t border-gray-200 pt-6">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
//                   <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
//                     <Search className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" />
//                     <span className="text-balance">Search Results</span>
//                   </h3>
//                   <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600">
//                     <span className="flex items-center">
//                       <Building2 className="w-4 h-4 text-blue-500 mr-1 flex-shrink-0" />
//                       {filteredBranches.length} branches
//                     </span>
//                     <span className="flex items-center">
//                       <Users className="w-4 h-4 text-green-500 mr-1 flex-shrink-0" />
//                       {filteredUsers.length} users
//                     </span>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   {/* Branch Results */}
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <h4 className="font-medium text-gray-800 text-sm sm:text-base flex items-center">
//                         <Building2 className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
//                         Branches ({filteredBranches.length})
//                       </h4>
//                     </div>
//                     <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
//                       {filteredBranches.length > 0 ? (
//                         filteredBranches.map((branch) => (
//                           <div
//                             key={branch.id}
//                             className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-xs sm:text-sm"
//                             onClick={() => {
//                               const element = document.getElementById(
//                                 `branch-${branch.id}`
//                               );
//                               if (element) {
//                                 element.scrollIntoView({
//                                   behavior: "smooth",
//                                   block: "center",
//                                 });
//                               }
//                             }}
//                           >
//                             <div className="flex items-center justify-between gap-2">
//                               <div className="min-w-0 flex-1">
//                                 <p className="font-medium text-gray-900 truncate">
//                                   {branch.name}
//                                 </p>
//                                 <p className="text-xs text-gray-600">
//                                   Code: {branch.code}
//                                 </p>
//                               </div>
//                               <div className="flex items-center flex-shrink-0">
//                                 {branch.managerId ? (
//                                   <CheckCircle className="w-4 h-4 text-green-500" />
//                                 ) : (
//                                   <AlertCircle className="w-4 h-4 text-amber-500" />
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         ))
//                       ) : (
//                         <div className="text-center py-4 text-gray-500">
//                           <Building2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
//                           <p className="text-xs sm:text-sm">
//                             No branches found
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* User Results */}
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <h4 className="font-medium text-gray-800 text-sm sm:text-base flex items-center">
//                         <Users className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
//                         Users ({filteredUsers.length})
//                       </h4>
//                     </div>
//                     <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
//                       {filteredUsers.length > 0 ? (
//                         filteredUsers.map((user) => (
//                           <div
//                             key={user.id}
//                             className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer text-xs sm:text-sm"
//                             onClick={() => {
//                               const element = document.getElementById(
//                                 `user-${user.id}`
//                               );
//                               if (element) {
//                                 element.scrollIntoView({
//                                   behavior: "smooth",
//                                   block: "center",
//                                 });
//                               }
//                             }}
//                           >
//                             <div className="flex items-center justify-between gap-2">
//                               <div className="min-w-0 flex-1">
//                                 <p className="font-medium text-gray-900 truncate">
//                                   {user.name || user.email}
//                                 </p>
//                                 <p className="text-xs text-gray-600 truncate">
//                                   {user.email}
//                                 </p>
//                               </div>
//                               <div className="flex items-center flex-shrink-0">
//                                 {user.branchId ? (
//                                   <CheckCircle className="w-4 h-4 text-green-500" />
//                                 ) : (
//                                   <UserX className="w-4 h-4 text-gray-400" />
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         ))
//                       ) : (
//                         <div className="text-center py-4 text-gray-500">
//                           <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
//                           <p className="text-xs sm:text-sm">No users found</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Clear Filters Button */}
//                 <div className="mt-4 flex justify-end">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       setSearchTerm("");
//                       setRoleFilter("all");
//                       setAssignmentFilter("all");
//                     }}
//                     className="text-xs sm:text-sm text-gray-600 hover:text-gray-800"
//                   >
//                     <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
//                     Clear All Filters
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Main Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
//           {/* Branches Section */}
//           <Card className="bg-white shadow-sm border border-gray-200">
//             <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
//               <CardTitle className="flex items-center justify-between text-base sm:text-lg">
//                 <span className="flex items-center space-x-2 sm:space-x-3">
//                   <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
//                   <span className="font-semibold text-gray-900">
//                     Branches ({filteredBranches.length})
//                   </span>
//                 </span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-0 px-4 sm:px-6">
//               {/* Branch Search and Filter Controls */}
//               <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
//                 {/* Search Section */}
//                 <div className="space-y-2 sm:space-y-3">
//                   <Label
//                     htmlFor="branch-search"
//                     className="text-xs sm:text-sm font-medium text-gray-700"
//                   >
//                     Search Branches
//                   </Label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                     <Input
//                       id="branch-search"
//                       placeholder="Search..."
//                       value={branchSearchTerm}
//                       onChange={(e) => setBranchSearchTerm(e.target.value)}
//                       className="pl-10 h-10 sm:h-11 text-sm"
//                     />
//                   </div>
//                 </div>

//                 {/* Filter Section */}
//                 <div className="space-y-2 sm:space-y-3">
//                   <Label
//                     htmlFor="manager-filter"
//                     className="text-xs sm:text-sm font-medium text-gray-700"
//                   >
//                     Filter by Manager
//                   </Label>
//                   <Select
//                     value={branchManagerFilter}
//                     onValueChange={setBranchManagerFilter}
//                   >
//                     <SelectTrigger className="h-10 sm:h-11 text-sm">
//                       <SelectValue placeholder="All Branches" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Branches</SelectItem>
//                       <SelectItem value="with_manager">With Manager</SelectItem>
//                       <SelectItem value="without_manager">
//                         Without Manager
//                       </SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
//                 {filteredBranches.map((branch) => (
//                   <div
//                     key={branch.id}
//                     id={`branch-${branch.id}`}
//                     className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
//                   >
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
//                       <div className="min-w-0">
//                         <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 truncate">
//                           {branch.name}
//                         </h3>
//                         <p className="text-xs sm:text-sm text-gray-500">
//                           Code:{" "}
//                           <span className="font-medium">{branch.code}</span>
//                         </p>
//                       </div>
//                       <Badge
//                         variant={branch.managerId ? "default" : "destructive"}
//                         className="text-xs px-2 sm:px-3 py-1 w-fit"
//                       >
//                         {branch.managerId ? "Has Manager" : "No Manager"}
//                       </Badge>
//                     </div>

//                     {branch.manager ? (
//                       <div className="space-y-2">
//                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                           <div className="flex items-center space-x-2 min-w-0 flex-1">
//                             <UserCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
//                             <span className="text-xs sm:text-sm text-gray-600 truncate">
//                               {branch.manager.email}
//                             </span>
//                           </div>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => handleUnassignManager(branch.id)}
//                             disabled={unassigningManagers.has(branch.id)}
//                             className="w-full sm:w-auto text-xs sm:text-sm"
//                           >
//                             {unassigningManagers.has(branch.id) ? (
//                               <>
//                                 <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
//                                 <span className="hidden sm:inline">
//                                   Unassigning...
//                                 </span>
//                                 <span className="sm:hidden">Wait...</span>
//                               </>
//                             ) : (
//                               "Unassign"
//                             )}
//                           </Button>
//                         </div>

//                         {(() => {
//                           const creditOfficers = users.filter(
//                             (user) =>
//                               user.role === UserRole.CREDIT_OFFICER &&
//                               user.branchId === branch.id
//                           );
//                           return creditOfficers.length > 0 ? (
//                             <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-600">
//                               <Users className="w-4 h-4 flex-shrink-0" />
//                               <span>
//                                 {creditOfficers.length} credit officer
//                                 {creditOfficers.length !== 1 ? "s" : ""}{" "}
//                                 assigned
//                               </span>
//                             </div>
//                           ) : (
//                             <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
//                               <Users className="w-4 h-4 flex-shrink-0" />
//                               <span>No credit officers assigned</span>
//                             </div>
//                           );
//                         })()}
//                       </div>
//                     ) : (
//                       <div className="space-y-2">
//                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                           <div className="flex items-center space-x-2 min-w-0 flex-1">
//                             <UserX className="w-4 h-4 text-red-500 flex-shrink-0" />
//                             <span className="text-xs sm:text-sm text-gray-500">
//                               No manager assigned
//                             </span>
//                           </div>
//                           <Button
//                             size="sm"
//                             onClick={() =>
//                               router.push(
//                                 `/dashboard/business-management/branch-assignment?branchId=${branch.id}&mode=manager`
//                               )
//                             }
//                             className="w-full sm:w-auto text-xs sm:text-sm"
//                           >
//                             Assign Manager
//                           </Button>
//                         </div>

//                         {(() => {
//                           const creditOfficers = users.filter(
//                             (user) =>
//                               user.role === UserRole.CREDIT_OFFICER &&
//                               user.branchId === branch.id
//                           );
//                           return creditOfficers.length > 0 ? (
//                             <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-600">
//                               <Users className="w-4 h-4 flex-shrink-0" />
//                               <span>
//                                 {creditOfficers.length} credit officer
//                                 {creditOfficers.length !== 1 ? "s" : ""}{" "}
//                                 assigned
//                               </span>
//                             </div>
//                           ) : (
//                             <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
//                               <Users className="w-4 h-4 flex-shrink-0" />
//                               <span>No credit officers assigned</span>
//                             </div>
//                           );
//                         })()}
//                       </div>
//                     )}

//                     <div className="mt-2 text-xs text-gray-500">
//                       Users: {branch._count?.users || 0} | Customers:{" "}
//                       {branch._count?.customers || 0} | Loans:{" "}
//                       {branch._count?.loans || 0}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Users Section */}
//           <Card className="bg-white shadow-sm border border-gray-200">
//             <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
//               <CardTitle className="flex items-center justify-between text-base sm:text-lg">
//                 <span className="flex items-center space-x-2 sm:space-x-3">
//                   <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
//                   <span className="font-semibold text-gray-900">
//                     Users ({filteredUsers.length})
//                   </span>
//                 </span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-0 px-4 sm:px-6">
//               {/* Search and Filter Controls */}
//               <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
//                 {/* Search Section */}
//                 <div className="space-y-2 sm:space-y-3">
//                   <Label
//                     htmlFor="user-search"
//                     className="text-xs sm:text-sm font-medium text-gray-700"
//                   >
//                     Search Users
//                   </Label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                     <Input
//                       id="user-search"
//                       placeholder="Search..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="pl-10 h-10 sm:h-11 text-sm"
//                     />
//                   </div>
//                 </div>

//                 {/* Filter Section */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
//                   <div className="space-y-2 sm:space-y-3">
//                     <Label
//                       htmlFor="role-filter"
//                       className="text-xs sm:text-sm font-medium text-gray-700"
//                     >
//                       Filter by Role
//                     </Label>
//                     <Select value={roleFilter} onValueChange={setRoleFilter}>
//                       <SelectTrigger className="h-10 sm:h-11 text-sm">
//                         <SelectValue placeholder="All Roles" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Roles</SelectItem>
//                         <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
//                         <SelectItem value={UserRole.BRANCH_MANAGER}>
//                           Branch Manager
//                         </SelectItem>
//                         <SelectItem value={UserRole.CREDIT_OFFICER}>
//                           Credit Officer
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-2 sm:space-y-3">
//                     <Label
//                       htmlFor="assignment-filter"
//                       className="text-xs sm:text-sm font-medium text-gray-700"
//                     >
//                       Filter by Assignment
//                     </Label>
//                     <Select
//                       value={assignmentFilter}
//                       onValueChange={setAssignmentFilter}
//                     >
//                       <SelectTrigger className="h-10 sm:h-11 text-sm">
//                         <SelectValue placeholder="All Users" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Users</SelectItem>
//                         <SelectItem value="assigned">Assigned</SelectItem>
//                         <SelectItem value="unassigned">Unassigned</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
//                 {filteredUsers.map((user) => (
//                   <div
//                     key={user.id}
//                     id={`user-${user.id}`}
//                     className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
//                   >
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
//                       <div className="min-w-0 flex-1">
//                         <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 truncate">
//                           {user.name || user.email}
//                         </h3>
//                         <p className="text-xs sm:text-sm text-gray-500">
//                           {user.name && (
//                             <span className="block mb-1">{user.email}</span>
//                           )}
//                           Role:{" "}
//                           <Badge
//                             variant="outline"
//                             className="text-xs sm:text-sm"
//                           >
//                             {user.role}
//                           </Badge>
//                         </p>
//                       </div>
//                       <Badge
//                         variant={user.branchId ? "default" : "destructive"}
//                         className="text-xs px-2 sm:px-3 py-1 w-fit"
//                       >
//                         {user.branchId ? "Assigned" : "Unassigned"}
//                       </Badge>
//                     </div>

//                     {user.branch ? (
//                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                         <div className="flex items-center space-x-2 min-w-0 flex-1">
//                           <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
//                           <span className="text-xs sm:text-sm text-gray-600 truncate">
//                             {user.branch.name}
//                           </span>
//                         </div>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => handleUnassignUser(user.id)}
//                           disabled={unassigningUsers.has(user.id)}
//                           className="w-full sm:w-auto text-xs sm:text-sm"
//                         >
//                           {unassigningUsers.has(user.id) ? (
//                             <>
//                               <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
//                               <span className="hidden sm:inline">
//                                 Unassigning...
//                               </span>
//                               <span className="sm:hidden">Wait...</span>
//                             </>
//                           ) : (
//                             "Unassign"
//                           )}
//                         </Button>
//                       </div>
//                     ) : (
//                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                         <div className="flex items-center space-x-2 min-w-0 flex-1">
//                           <UserX className="w-4 h-4 text-red-500 flex-shrink-0" />
//                           <span className="text-xs sm:text-sm text-gray-500">
//                             No branch assigned
//                           </span>
//                         </div>
//                         <Button
//                           size="sm"
//                           onClick={() =>
//                             router.push(
//                               `/dashboard/business-management/branch-assignment?userId=${user.id}&mode=user`
//                             )
//                           }
//                           className="w-full sm:w-auto text-xs sm:text-sm"
//                         >
//                           Assign Branch
//                         </Button>
//                       </div>
//                     )}

//                     <div className="mt-2 text-xs text-gray-500">
//                       Status:{" "}
//                       <Badge
//                         variant={user.isActive ? "default" : "secondary"}
//                         className="text-xs"
//                       >
//                         {user.isActive ? "Active" : "Inactive"}
//                       </Badge>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
