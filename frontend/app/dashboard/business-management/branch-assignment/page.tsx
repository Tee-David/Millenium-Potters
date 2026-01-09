"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  UserPlus,
  Shield,
  Search,
  Filter,
} from "lucide-react";
import { UserRole } from "@/lib/enum";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast } from "sonner";
import { branchesApi, usersApi, handleDatabaseError } from "@/lib/api";

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
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
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

export default function BranchAssignmentPage() {
  // ...existing code...
}

// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Users,
//   Building2,
//   UserCheck,
//   ArrowRight,
//   AlertCircle,
//   CheckCircle,
//   ChevronLeft,
//   UserPlus,
//   Shield,
//   Search,
//   Filter,
// } from "lucide-react";
// import { UserRole } from "@/lib/enum";
// import { SearchableSelect } from "@/components/SearchableSelect";
// import { toast } from "sonner";
// import { branchesApi, usersApi, handleDatabaseError } from "@/lib/api";

// interface Branch {
//   id: string;
//   name: string;
//   code: string;
//   managerId?: string;
//   manager?: {
//     id: string;
//     email: string;
//     role: string;
//   };
// }

// interface User {
//   id: string;
//   email: string;
//   firstName?: string;
//   lastName?: string;
//   name?: string;
//   role: UserRole;
//   branchId?: string;
//   isActive: boolean;
//   branch?: {
//     id: string;
//     name: string;
//     code: string;
//   };
// }

// export default function BranchAssignmentPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Get parameters from URL
//   const userId = searchParams.get("userId");
//   const branchId = searchParams.get("branchId");
//   const mode = searchParams.get("mode") || "user"; // "user" or "manager"

//   // Form states
//   const [selectedBranchId, setSelectedBranchId] = useState("");
//   const [selectedManagerId, setSelectedManagerId] = useState("");
//   const [branchSearchTerm, setBranchSearchTerm] = useState("");
//   const [debouncedBranchSearchTerm, setDebouncedBranchSearchTerm] =
//     useState("");
//   const [userSearchTerm, setUserSearchTerm] = useState("");
//   const [debouncedUserSearchTerm, setDebouncedUserSearchTerm] = useState("");
//   const [roleFilter, setRoleFilter] = useState<string>("all");

//   // Get the specific user or branch being assigned
//   const targetUser = userId ? users.find((u) => u.id === userId) : null;
//   const targetBranch = branchId
//     ? branches.find((b) => b.id === branchId)
//     : null;

//   useEffect(() => {
//     loadData();
//   }, []);

//   // Reload data when returning to this page (e.g., from navigation back)
//   useEffect(() => {
//     const handleFocus = () => {
//       console.log("Page focused - reloading data");
//       loadData();
//     };

//     window.addEventListener("focus", handleFocus);
//     return () => window.removeEventListener("focus", handleFocus);
//   }, []);

//   // Debounce branch search term for better performance
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedBranchSearchTerm(branchSearchTerm);
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [branchSearchTerm]);

//   // Debounce user search term for better performance
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedUserSearchTerm(userSearchTerm);
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [userSearchTerm]);

//   useEffect(() => {
//     if (targetUser && mode === "user") {
//       setSelectedBranchId(targetUser.branchId || "");
//     } else if (targetBranch && mode === "manager") {
//       setSelectedManagerId(targetBranch.managerId || "");
//     }
//   }, [targetUser, targetBranch, mode]);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [branchesResponse, usersResponse] = await Promise.all([
//         branchesApi.getAll(),
//         usersApi.getAll(),
//       ]);

//       const branchesData =
//         (branchesResponse.data as any)?.data || branchesResponse.data || [];
//       const usersData =
//         (usersResponse.data as any)?.data?.users ||
//         (usersResponse.data as any)?.data ||
//         usersResponse.data ||
//         [];

//       setBranches(Array.isArray(branchesData) ? branchesData : []);

//       const usersArray = Array.isArray(usersData) ? usersData : [];
//       setUsers(usersArray);

//       console.log("BranchAssignmentPage: Loaded fresh data:", {
//         totalUsers: usersArray.length,
//         creditOfficers: usersArray.filter(
//           (u) => u.role === UserRole.CREDIT_OFFICER
//         ).length,
//         branchManagers: usersArray.filter(
//           (u) => u.role === UserRole.BRANCH_MANAGER
//         ).length,
//         admins: usersArray.filter((u) => u.role === UserRole.ADMIN).length,
//         unassignedUsers: usersArray.filter((u) => !u.branchId).length,
//         assignedUsers: usersArray.filter((u) => u.branchId).length,
//         userBreakdown: usersArray.map((u) => ({
//           email: u.email,
//           role: u.role,
//           branchId: u.branchId,
//           branchName: u.branch?.name || "Unassigned",
//         })),
//       });
//     } catch (error: any) {
//       console.error("Failed to load data:", error);
//       setError("Failed to load data");
//       toast.error("Failed to load data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAssignUser = async () => {
//     if (!userId || !selectedBranchId) {
//       toast.error("Please select a branch");
//       return;
//     }

//     const userToAssign = users.find((u) => u.id === userId);
//     if (userToAssign?.role === UserRole.ADMIN) {
//       toast.error(
//         "Admins cannot be assigned to branches as they have system-wide access"
//       );
//       return;
//     }

//     setSubmitting(true);
//     try {
//       await usersApi.update(userId, { branchId: selectedBranchId });
//       toast.success("User assigned to branch successfully");

//       // Reload data to reflect changes
//       await loadData();

//       router.back();
//     } catch (error: any) {
//       console.error("Failed to assign user:", error);

//       const errorMessage =
//         error.response?.data?.message || "Failed to assign user";

//       if (errorMessage.includes("Invalid or inactive branch")) {
//         toast.error(
//           "Selected branch is invalid or inactive. Please select a different branch."
//         );
//       } else if (errorMessage.includes("not found")) {
//         toast.error("User not found or inactive.");
//       } else if (errorMessage.includes("must be assigned to a branch")) {
//         toast.error("This user role requires a branch assignment.");
//       } else {
//         toast.error(errorMessage);
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleAssignManager = async () => {
//     console.log("Starting manager assignment:", {
//       branchId,
//       selectedManagerId,
//       targetBranch: targetBranch?.name,
//     });

//     if (!branchId || !selectedManagerId) {
//       toast.error("Please select a manager");
//       return;
//     }

//     // Enterprise validation: Check if branch already has a manager
//     if (
//       targetBranch?.managerId &&
//       targetBranch.managerId !== selectedManagerId
//     ) {
//       toast.error(
//         "This branch already has a manager assigned. Please unassign the current manager first."
//       );
//       return;
//     }

//     // Enterprise validation: Check if selected user is already managing another branch
//     const selectedUser = users.find((u) => u.id === selectedManagerId);
//     const isManagingAnotherBranch = branches.find(
//       (b) => b.managerId === selectedManagerId && b.id !== branchId
//     );

//     if (isManagingAnotherBranch) {
//       toast.error(
//         `Selected user is already managing "${isManagingAnotherBranch.name}". Please unassign them first.`
//       );
//       return;
//     }

//     setSubmitting(true);
//     try {
//       console.log("Calling branchesApi.update with:", {
//         branchId,
//         managerId: selectedManagerId,
//       });

//       const response = await branchesApi.update(branchId, {
//         managerId: selectedManagerId,
//       });
//       console.log("Branch update response:", response.data);

//       toast.success("Manager assigned to branch successfully");

//       // Reload data to reflect changes
//       await loadData();

//       router.back();
//     } catch (error: any) {
//       console.error("Failed to assign manager:", error);
//       console.error("Error response:", error.response?.data);

//       const errorMessage =
//         error.response?.data?.message || "Failed to assign manager";

//       if (errorMessage.includes("already assigned to branch")) {
//         toast.error(
//           "This manager is already assigned to another branch. Please select a different manager."
//         );
//       } else if (errorMessage.includes("must be a Branch Manager")) {
//         toast.error(
//           "Selected user must be a Branch Manager to manage a branch."
//         );
//       } else if (errorMessage.includes("not found")) {
//         toast.error("Selected manager not found or inactive.");
//       } else {
//         toast.error(errorMessage);
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Enterprise-standard search and filter logic
//   const branchSearchTermLower = debouncedBranchSearchTerm.toLowerCase().trim();
//   const userSearchTermLower = debouncedUserSearchTerm.toLowerCase().trim();

//   // Search branches
//   const searchBranchResults = branches.filter((branch) => {
//     if (!branchSearchTermLower) return true;

//     return (
//       branch.name.toLowerCase().includes(branchSearchTermLower) ||
//       branch.code.toLowerCase().includes(branchSearchTermLower) ||
//       (branch.manager?.email &&
//         branch.manager.email.toLowerCase().includes(branchSearchTermLower))
//     );
//   });

//   // FIXED: Get available users for manager assignment
//   const getAvailableUsersForManager = () => {
//     return users.filter((user) => {
//       // Only show active users (treat undefined as active)
//       if (user.isActive === false) return false;

//       // Only Branch Managers and Credit Officers
//       const hasValidRole =
//         user.role === UserRole.BRANCH_MANAGER ||
//         user.role === UserRole.CREDIT_OFFICER;
//       if (!hasValidRole) return false;

//       // In manager mode with a target branch:
//       // ONLY show users who are already assigned to THIS branch (as members)
//       if (mode === "manager" && branchId) {
//         return user.branchId === branchId;
//       }

//       // Fallback: if no branch is selected, show all unassigned users
//       return !user.branchId;
//     });
//   };

//   // Search users with proper filtering
//   const searchUserResults = (() => {
//     const availableUsers =
//       mode === "manager" ? getAvailableUsersForManager() : users;

//     return availableUsers.filter((user) => {
//       // Always exclude admins from branch assignment
//       if (user.role === UserRole.ADMIN) return false;

//       // Only show active users
//       if (user.isActive === false) return false;

//       // Apply search filter
//       if (userSearchTermLower) {
//         const fullName =
//           user.firstName && user.lastName
//             ? `${user.firstName} ${user.lastName}`.toLowerCase()
//             : (user.firstName || user.lastName || "").toLowerCase();

//         const matchesSearch =
//           user.email.toLowerCase().includes(userSearchTermLower) ||
//           fullName.includes(userSearchTermLower) ||
//           user.role.toLowerCase().includes(userSearchTermLower);

//         if (!matchesSearch) return false;
//       }

//       // Apply role filter
//       if (roleFilter !== "all") {
//         const matchesRole = user.role === (roleFilter as UserRole);
//         if (!matchesRole) return false;
//       }

//       return true;
//     });
//   })();

//   // Apply role filter to all available users (for main list)
//   const filteredUsers = (() => {
//     const availableUsers =
//       mode === "manager" ? getAvailableUsersForManager() : users;

//     return availableUsers.filter((user) => {
//       // Always exclude admins
//       if (user.role === UserRole.ADMIN) return false;

//       // Only show active users
//       if (user.isActive === false) return false;

//       // Apply role filter
//       if (roleFilter !== "all") {
//         return user.role === (roleFilter as UserRole);
//       }

//       return true;
//     });
//   })();

//   // Debug logging
//   console.log("Enterprise search & filter (FIXED):", {
//     mode,
//     branchId,
//     branchName:
//       branches.find((b) => b.id === branchId)?.name || "No branch selected",
//     branchSearchTerm: branchSearchTermLower,
//     userSearchTerm: userSearchTermLower,
//     roleFilter,
//     totalUsers: users.length,
//     totalBranches: branches.length,
//     availableForManager:
//       mode === "manager" ? getAvailableUsersForManager().length : "N/A",
//     searchUserResults: searchUserResults.length,
//     searchBranchResults: searchBranchResults.length,
//     filteredUsers: filteredUsers.length,
//     filteredUsersDetails: filteredUsers.map((u) => ({
//       email: u.email,
//       role: u.role,
//       branchId: u.branchId,
//       branchName: u.branch?.name || "Unassigned",
//       isManagingBranch:
//         branches.find((b) => b.managerId === u.id)?.name || "Not managing any",
//     })),
//   });

//   const getRoleDisplayName = (role: UserRole) => {
//     switch (role) {
//       case UserRole.ADMIN:
//         return "Admin";
//       case UserRole.BRANCH_MANAGER:
//         return "Branch Manager";
//       case UserRole.CREDIT_OFFICER:
//         return "Credit Officer";
//       default:
//         return role;
//     }
//   };

//   const getRoleBadgeColor = (role: UserRole) => {
//     switch (role) {
//       case UserRole.ADMIN:
//         return "bg-purple-100 text-purple-800 border-purple-200";
//       case UserRole.BRANCH_MANAGER:
//         return "bg-blue-100 text-blue-800 border-blue-200";
//       case UserRole.CREDIT_OFFICER:
//         return "bg-green-100 text-green-800 border-green-200";
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600 text-lg">Loading assignment data...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
//         <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md">
//           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">
//             Error Loading Data
//           </h3>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <Button
//             onClick={loadData}
//             className="bg-green-600 hover:bg-green-700"
//           >
//             <CheckCircle className="w-4 h-4 mr-2" />
//             Try Again
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white">
//       <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
//         {/* Header */}
//         <div className="mb-12">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
//             <div className="space-y-4">
//               <div className="flex items-center space-x-3">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => router.back()}
//                   className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
//                 >
//                   <ChevronLeft className="w-4 h-4 mr-2" />
//                   Back
//                 </Button>
//                 <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
//                   {mode === "user" ? (
//                     <UserPlus className="w-8 h-8 text-white" />
//                   ) : (
//                     <Shield className="w-8 h-8 text-white" />
//                   )}
//                 </div>
//                 <div>
//                   <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
//                     {mode === "user"
//                       ? "Assign User to Branch"
//                       : "Assign Manager to Branch"}
//                   </h1>
//                   <p className="text-lg text-gray-600 mt-1">
//                     {mode === "user"
//                       ? "Assign a user to a specific branch"
//                       : "Assign a manager to oversee a branch"}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Current Assignment Info */}
//         {(targetUser || targetBranch) && (
//           <Card className="mb-12 bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
//             <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-blue-100/50">
//               <CardTitle className="flex items-center space-x-3">
//                 <div className="p-2 bg-blue-500 rounded-lg">
//                   <UserCheck className="w-5 h-5 text-white" />
//                 </div>
//                 <span className="text-lg font-semibold text-gray-900">
//                   Current Assignment
//                 </span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-6">
//               {mode === "user" && targetUser ? (
//                 <div className="space-y-4">
//                   <div className="flex items-center space-x-3 sm:space-x-4">
//                     <div className="p-2 sm:p-3 bg-blue-100 rounded-xl flex-shrink-0">
//                       <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
//                         {targetUser.name || targetUser.email}
//                       </h3>
//                       <p className="text-sm sm:text-base text-gray-600 truncate">
//                         {targetUser.email}
//                       </p>
//                       <div className="mt-1">
//                         <Badge
//                           className={`${getRoleBadgeColor(
//                             targetUser.role
//                           )} text-xs`}
//                         >
//                           {getRoleDisplayName(targetUser.role)}
//                         </Badge>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-3 sm:space-x-4">
//                     <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
//                     <div className="flex items-center space-x-2 min-w-0 flex-1">
//                       <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
//                       <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
//                         {targetUser.branch?.name || "No branch assigned"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ) : mode === "manager" && targetBranch ? (
//                 <div className="space-y-4">
//                   <div className="flex items-center space-x-3 sm:space-x-4">
//                     <div className="p-2 sm:p-3 bg-green-100 rounded-xl flex-shrink-0">
//                       <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
//                         {targetBranch.name}
//                       </h3>
//                       <p className="text-sm sm:text-base text-gray-600">
//                         Code: {targetBranch.code}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-3 sm:space-x-4">
//                     <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
//                     <div className="flex items-center space-x-2 min-w-0 flex-1">
//                       <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
//                       <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
//                         {targetBranch.manager?.email || "No manager assigned"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ) : null}
//             </CardContent>
//           </Card>
//         )}

//         {/* Assignment Form */}
//         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
//           {/* Selection Form */}
//           <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
//             <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-green-100/50">
//               <CardTitle className="flex items-center space-x-3">
//                 <div className="p-2 bg-green-500 rounded-lg">
//                   <Filter className="w-5 h-5 text-white" />
//                 </div>
//                 <span className="text-lg font-semibold text-gray-900">
//                   {mode === "user" ? "Select Branch" : "Select Manager"}
//                 </span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-6">
//               {mode === "user" ? (
//                 <div className="space-y-6">
//                   <div>
//                     <Label className="text-sm font-semibold text-gray-700 mb-3 block">
//                       Choose Branch
//                     </Label>
//                     <SearchableSelect
//                       options={branches.map((branch) => ({
//                         value: branch.id,
//                         label: `${branch.name} (${branch.code})`,
//                         description: branch.manager?.email || "No manager",
//                       }))}
//                       value={selectedBranchId}
//                       onValueChange={setSelectedBranchId}
//                       placeholder="Select a branch..."
//                       className="w-full"
//                     />
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-6">
//                   {/* Enterprise Status Indicator */}
//                   {targetBranch?.managerId &&
//                     targetBranch.managerId !== selectedManagerId && (
//                       <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
//                         <div className="flex items-center space-x-2">
//                           <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
//                           <span className="text-sm font-medium text-amber-800">
//                             Branch Already Has Manager
//                           </span>
//                         </div>
//                         <p className="text-sm text-amber-700 mt-1">
//                           Current manager:{" "}
//                           {targetBranch.manager?.email || "Unknown"}
//                         </p>
//                         <p className="text-xs text-amber-600 mt-1">
//                           Please unassign the current manager before assigning a
//                           new one.
//                         </p>
//                       </div>
//                     )}

//                   <div>
//                     <Label className="text-sm font-semibold text-gray-700 mb-3 block">
//                       Choose Manager or Credit Officer
//                     </Label>
//                     <SearchableSelect
//                       options={getAvailableUsersForManager().map((user) => {
//                         const fullName =
//                           user.firstName && user.lastName
//                             ? `${user.firstName} ${user.lastName}`
//                             : user.firstName || user.lastName || user.email;
//                         return {
//                           value: user.id,
//                           label: fullName,
//                           description: `${getRoleDisplayName(user.role)} - ${
//                             user.branch?.name || "Unassigned"
//                           }`,
//                         };
//                       })}
//                       value={selectedManagerId}
//                       onValueChange={setSelectedManagerId}
//                       placeholder="Select a manager or credit officer..."
//                       className="w-full"
//                     />
//                     <p className="text-xs text-gray-500 mt-2">
//                       {branchId
//                         ? `Showing ${
//                             getAvailableUsersForManager().length
//                           } user(s) assigned to ${
//                             branches.find((b) => b.id === branchId)?.name ||
//                             "this branch"
//                           }`
//                         : `Showing ${
//                             getAvailableUsersForManager().length
//                           } unassigned user(s)`}
//                     </p>
//                   </div>
//                 </div>
//               )}

//               <div className="pt-6 border-t border-gray-200">
//                 <Button
//                   onClick={
//                     mode === "user" ? handleAssignUser : handleAssignManager
//                   }
//                   disabled={
//                     submitting ||
//                     (mode === "user"
//                       ? !selectedBranchId
//                       : !selectedManagerId) ||
//                     (mode === "manager" &&
//                       !!targetBranch?.managerId &&
//                       targetBranch.managerId !== selectedManagerId)
//                   }
//                   className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
//                 >
//                   {submitting ? (
//                     <>
//                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                       Assigning...
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircle className="w-4 h-4 mr-2" />
//                       {mode === "user"
//                         ? "Assign User to Branch"
//                         : targetBranch?.managerId &&
//                           targetBranch.managerId !== selectedManagerId
//                         ? "Branch Already Has Manager"
//                         : "Assign Manager to Branch"}
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Available Options */}
//           <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
//             <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100/50">
//               <CardTitle className="flex items-center space-x-3">
//                 <div className="p-2 bg-blue-500 rounded-lg">
//                   <Search className="w-5 h-5 text-white" />
//                 </div>
//                 <span className="text-lg font-semibold text-gray-900">
//                   {mode === "user"
//                     ? "Available Branches"
//                     : "Available Managers"}
//                 </span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-6">
//               {/* Search and Filter */}
//               <div className="space-y-4 mb-6">
//                 {mode === "user" ? (
//                   /* Branch Search */
//                   <div>
//                     <Label className="text-sm font-semibold text-gray-700">
//                       Search Branches
//                     </Label>
//                     <div className="relative">
//                       <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
//                       <Input
//                         placeholder="Search branches by name, code, or manager..."
//                         value={branchSearchTerm}
//                         onChange={(e) => setBranchSearchTerm(e.target.value)}
//                         className="pl-10 h-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
//                         onKeyDown={(e) => {
//                           if (e.key === "Escape") {
//                             setBranchSearchTerm("");
//                           }
//                         }}
//                       />
//                       {branchSearchTerm && (
//                         <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
//                           {branchSearchTerm !== debouncedBranchSearchTerm && (
//                             <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//                           )}
//                           <button
//                             onClick={() => setBranchSearchTerm("")}
//                             className="p-1 hover:bg-gray-100 rounded-full transition-colors"
//                             title="Clear branch search"
//                           >
//                             <svg
//                               className="w-4 h-4 text-gray-400"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M6 18L18 6M6 6l12 12"
//                               />
//                             </svg>
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ) : (
//                   /* User Search */
//                   <>
//                     <div>
//                       <Label className="text-sm font-semibold text-gray-700">
//                         Search Users
//                       </Label>
//                       <div className="relative">
//                         <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
//                         <Input
//                           placeholder="Search users by name, email, or role..."
//                           value={userSearchTerm}
//                           onChange={(e) => setUserSearchTerm(e.target.value)}
//                           className="pl-10 h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl"
//                           onKeyDown={(e) => {
//                             if (e.key === "Escape") {
//                               setUserSearchTerm("");
//                             }
//                           }}
//                         />
//                         {userSearchTerm && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
//                             {userSearchTerm !== debouncedUserSearchTerm && (
//                               <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
//                             )}
//                             <button
//                               onClick={() => setUserSearchTerm("")}
//                               className="p-1 hover:bg-gray-100 rounded-full transition-colors"
//                               title="Clear user search"
//                             >
//                               <svg
//                                 className="w-4 h-4 text-gray-400"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M6 18L18 6M6 6l12 12"
//                                 />
//                               </svg>
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     <div>
//                       <Label className="text-sm font-semibold text-gray-700">
//                         Filter by Role
//                       </Label>
//                       <Select value={roleFilter} onValueChange={setRoleFilter}>
//                         <SelectTrigger className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl">
//                           <SelectValue placeholder="Filter by role" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="all">All Roles</SelectItem>
//                           <SelectItem value={UserRole.BRANCH_MANAGER}>
//                             Branch Manager
//                           </SelectItem>
//                           <SelectItem value={UserRole.CREDIT_OFFICER}>
//                             Credit Officer
//                           </SelectItem>
//                         </SelectContent>
//                       </Select>
//                       {roleFilter !== "all" && (
//                         <p className="text-sm text-gray-600 mt-1">
//                           Showing {filteredUsers.length}{" "}
//                           {getRoleDisplayName(
//                             roleFilter as UserRole
//                           ).toLowerCase()}
//                           {filteredUsers.length !== 1 ? "s" : ""}
//                         </p>
//                       )}
//                     </div>
//                   </>
//                 )}

//                 {/* Search Results Preview */}
//                 {mode === "user" && branchSearchTermLower && (
//                   <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                     <div className="flex items-center space-x-2 mb-2">
//                       <Building2 className="w-4 h-4 text-blue-600" />
//                       <span className="text-sm font-medium text-blue-800">
//                         Branch Search Results ({searchBranchResults.length})
//                       </span>
//                     </div>
//                     <div className="space-y-2 max-h-40 overflow-y-auto">
//                       {searchBranchResults.length > 0 ? (
//                         searchBranchResults.map((branch) => (
//                           <div
//                             key={branch.id}
//                             className="p-2 bg-white border border-blue-200 rounded cursor-pointer hover:bg-blue-50 transition-colors"
//                             onClick={() => setSelectedBranchId(branch.id)}
//                           >
//                             <div className="flex items-center justify-between">
//                               <div className="min-w-0 flex-1">
//                                 <p className="text-sm font-medium text-gray-900 truncate">
//                                   {branch.name}
//                                 </p>
//                                 <p className="text-xs text-gray-600">
//                                   Code: {branch.code}
//                                   {branch.manager &&
//                                     ` • Manager: ${branch.manager.email}`}
//                                 </p>
//                               </div>
//                               {selectedBranchId === branch.id && (
//                                 <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
//                               )}
//                             </div>
//                           </div>
//                         ))
//                       ) : (
//                         <p className="text-sm text-gray-500 text-center py-2">
//                           No branches found for "{branchSearchTerm}"
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {mode === "manager" && userSearchTermLower && (
//                   <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
//                     <div className="flex items-center space-x-2 mb-2">
//                       <UserCheck className="w-4 h-4 text-green-600" />
//                       <span className="text-sm font-medium text-green-800">
//                         User Search Results ({searchUserResults.length})
//                       </span>
//                     </div>
//                     <div className="space-y-2 max-h-40 overflow-y-auto">
//                       {searchUserResults.length > 0 ? (
//                         searchUserResults.map((user) => (
//                           <div
//                             key={user.id}
//                             className="p-2 bg-white border border-green-200 rounded cursor-pointer hover:bg-green-50 transition-colors"
//                             onClick={() => setSelectedManagerId(user.id)}
//                           >
//                             <div className="flex items-center justify-between">
//                               <div className="min-w-0 flex-1">
//                                 <p className="text-sm font-medium text-gray-900 truncate">
//                                   {user.firstName && user.lastName
//                                     ? `${user.firstName} ${user.lastName}`
//                                     : user.firstName ||
//                                       user.lastName ||
//                                       user.email}
//                                 </p>
//                                 <p className="text-xs text-gray-600">
//                                   {user.email} • {getRoleDisplayName(user.role)}
//                                   {user.branch && ` • ${user.branch.name}`}
//                                 </p>
//                               </div>
//                               {selectedManagerId === user.id && (
//                                 <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
//                               )}
//                             </div>
//                           </div>
//                         ))
//                       ) : (
//                         <p className="text-sm text-gray-500 text-center py-2">
//                           No users found for "{userSearchTerm}"
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Main Options List */}
//               <div className="mb-4">
//                 <div className="flex items-center space-x-2 mb-3">
//                   {mode === "user" ? (
//                     <Building2 className="w-4 h-4 text-gray-600" />
//                   ) : (
//                     <Users className="w-4 h-4 text-gray-600" />
//                   )}
//                   <h3 className="font-semibold text-gray-800">
//                     {mode === "user" ? "All Branches" : "Available Users"}
//                   </h3>
//                   <span className="text-sm text-gray-500">
//                     ({mode === "user" ? branches.length : filteredUsers.length})
//                   </span>
//                 </div>
//                 <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
//                   {mode === "user"
//                     ? branches.map((branch) => (
//                         <div
//                           key={branch.id}
//                           className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
//                             selectedBranchId === branch.id
//                               ? "border-green-500 bg-green-50"
//                               : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
//                           }`}
//                           onClick={() => setSelectedBranchId(branch.id)}
//                         >
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
//                               <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
//                                 <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
//                               </div>
//                               <div className="min-w-0 flex-1">
//                                 <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
//                                   {branch.name}
//                                 </h4>
//                                 <p className="text-xs sm:text-sm text-gray-600">
//                                   Code: {branch.code}
//                                 </p>
//                                 {branch.manager && (
//                                   <p className="text-xs sm:text-sm text-blue-600 truncate">
//                                     Manager: {branch.manager.email}
//                                   </p>
//                                 )}
//                               </div>
//                             </div>
//                             {selectedBranchId === branch.id && (
//                               <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 ml-2" />
//                             )}
//                           </div>
//                         </div>
//                       ))
//                     : filteredUsers.map((user) => (
//                         <div
//                           key={user.id}
//                           className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
//                             selectedManagerId === user.id
//                               ? "border-green-500 bg-green-50"
//                               : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
//                           }`}
//                           onClick={() => setSelectedManagerId(user.id)}
//                         >
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
//                               <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
//                                 <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
//                               </div>
//                               <div className="min-w-0 flex-1">
//                                 <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
//                                   {user.name || user.email}
//                                 </h4>
//                                 <p className="text-xs sm:text-sm text-gray-600 truncate">
//                                   {user.email}
//                                 </p>
//                                 <div className="mt-1 flex items-center gap-2">
//                                   <Badge
//                                     className={`${getRoleBadgeColor(
//                                       user.role
//                                     )} text-xs`}
//                                   >
//                                     {getRoleDisplayName(user.role)}
//                                   </Badge>
//                                   {user.branch && (
//                                     <span className="text-xs text-gray-500">
//                                       • {user.branch.name}
//                                     </span>
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                             {selectedManagerId === user.id && (
//                               <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 ml-2" />
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Credit Officers in Selected Branch */}
//         {mode === "user" && selectedBranchId && (
//           <Card className="mt-12 bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
//             <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-blue-100/50">
//               <CardTitle className="flex items-center space-x-3">
//                 <div className="p-2 bg-blue-500 rounded-lg">
//                   <Users className="w-5 h-5 text-white" />
//                 </div>
//                 <span className="text-lg font-semibold text-gray-900">
//                   Credit Officers in Selected Branch
//                 </span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-6">
//               <div className="space-y-3 max-h-80 overflow-y-auto">
//                 {users
//                   .filter(
//                     (user) =>
//                       user.role === UserRole.CREDIT_OFFICER &&
//                       user.branchId === selectedBranchId
//                   )
//                   .map((user) => (
//                     <div
//                       key={user.id}
//                       className="p-3 sm:p-4 border border-blue-200 rounded-xl bg-blue-50"
//                     >
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
//                           <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
//                             <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
//                           </div>
//                           <div className="min-w-0 flex-1">
//                             <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
//                               {user.name || user.email}
//                             </h4>
//                             <p className="text-xs sm:text-sm text-gray-600 truncate">
//                               {user.email}
//                             </p>
//                             <div className="mt-1">
//                               <Badge className="bg-blue-100 text-blue-800 text-xs">
//                                 Credit Officer
//                               </Badge>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 {users.filter(
//                   (user) =>
//                     user.role === UserRole.CREDIT_OFFICER &&
//                     user.branchId === selectedBranchId
//                 ).length === 0 && (
//                   <div className="text-center py-8">
//                     <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
//                     <p className="text-gray-500">
//                       No credit officers assigned to this branch
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }
