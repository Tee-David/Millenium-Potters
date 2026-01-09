import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  User,
  Users,
  Building2,
  BarChart3,
  FileText,
  Activity,
  ArrowRightLeft,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  role: string;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  lastLoginAt?: string;
  loginCount: number;
  isActive: boolean;
}

interface BranchTransfer {
  id: string;
  userId: string;
  user: UserProfile;
  fromBranch?: {
    id: string;
    name: string;
    code: string;
  };
  toBranch: {
    id: string;
    name: string;
    code: string;
  };
  reason?: string;
  status: string;
  transferDate: string;
  effectiveDate: string;
  customersTransferred: number;
  loansTransferred: number;
  repaymentsTransferred: number;
}

interface UserNote {
  id: string;
  title: string;
  content: string;
  category?: string;
  isPrivate: boolean;
  createdAt: string;
  user: UserProfile;
  createdBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface BranchAnalytics {
  id: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  totalLoans: number;
  activeLoans: number;
  totalLoanAmount: number;
  outstandingAmount: number;
  monthlyRevenue: number;
  collectionRate: number;
  periodType: string;
  periodStart: string;
  periodEnd: string;
}

export default function EnhancedUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [analytics, setAnalytics] = useState<BranchAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  // Form states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState("");
  const [newNote, setNewNote] = useState({
    userId: "",
    title: "",
    content: "",
    category: "general",
    isPrivate: false,
  });
  const [transferForm, setTransferForm] = useState({
    userId: "",
    fromBranchId: "",
    toBranchId: "",
    reason: "",
    effectiveDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, branchesRes, transfersRes, notesRes, analyticsRes] =
        await Promise.all([
          api.get("/users"),
          api.get("/branches"),
          api.get("/branch-transfers"),
          api.get("/notes"),
          api.get("/analytics/branch"),
        ]);

      setUsers(usersRes.data.data || []);
      setBranches(branchesRes.data.data || []);
      setTransfers(transfersRes.data.data?.transfers || []);
      setNotes(notesRes.data.data?.notes || []);
      setAnalytics(analyticsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async () => {
    if (!bulkOperation || selectedUsers.length === 0) {
      toast.error("Please select users and operation");
      return;
    }

    try {
      const operationData =
        bulkOperation === "assignBranch"
          ? {
              userIds: selectedUsers,
              operation: bulkOperation,
              data: { branchId: "selected-branch-id" }, // You'd get this from a form
            }
          : {
              userIds: selectedUsers,
              operation: bulkOperation,
            };

      await api.post("/users/bulk-operation", operationData);
      toast.success("Bulk operation completed");
      setSelectedUsers([]);
      setBulkOperation("");
      fetchData();
    } catch (error) {
      console.error("Bulk operation error:", error);
      toast.error("Bulk operation failed");
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.userId || !newNote.title || !newNote.content) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await api.post("/notes", newNote);
      toast.success("Note created successfully");
      setNewNote({
        userId: "",
        title: "",
        content: "",
        category: "general",
        isPrivate: false,
      });
      fetchData();
    } catch (error) {
      console.error("Create note error:", error);
      toast.error("Failed to create note");
    }
  };

  const handleCreateTransfer = async () => {
    if (
      !transferForm.userId ||
      !transferForm.toBranchId ||
      !transferForm.effectiveDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await api.post("/branch-transfers", {
        ...transferForm,
        effectiveDate: new Date(transferForm.effectiveDate),
      });
      toast.success("Branch transfer created successfully");
      setTransferForm({
        userId: "",
        fromBranchId: "",
        toBranchId: "",
        reason: "",
        effectiveDate: "",
      });
      fetchData();
    } catch (error) {
      console.error("Create transfer error:", error);
      toast.error("Failed to create transfer");
    }
  };

  const handleExecuteTransfer = async (transferId: string) => {
    try {
      await api.post(`/branch-transfers/${transferId}/execute`);
      toast.success("Transfer executed successfully");
      fetchData();
    } catch (error) {
      console.error("Execute transfer error:", error);
      toast.error("Failed to execute transfer");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Enhanced User Management</h1>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transfers">Branch Transfers</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "destructive" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.branch
                          ? `${user.branch.name} (${user.branch.code})`
                          : "No Branch"}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt
                          ? formatDate(user.lastLoginAt)
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Profile</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Name</Label>
                                <p>
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : "Not provided"}
                                </p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p>{user.email}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p>{user.phone || "Not provided"}</p>
                              </div>
                              <div>
                                <Label>Address</Label>
                                <p>{user.address || "Not provided"}</p>
                              </div>
                              <div>
                                <Label>Login Count</Label>
                                <p>{user.loginCount}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Branch Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Create Transfer</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Branch Transfer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>User</Label>
                        <Select
                          value={transferForm.userId}
                          onValueChange={(value) =>
                            setTransferForm({ ...transferForm, userId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>To Branch</Label>
                        <Select
                          value={transferForm.toBranchId}
                          onValueChange={(value) =>
                            setTransferForm({
                              ...transferForm,
                              toBranchId: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name} ({branch.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Effective Date</Label>
                        <Input
                          type="date"
                          value={transferForm.effectiveDate}
                          onChange={(e) =>
                            setTransferForm({
                              ...transferForm,
                              effectiveDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Textarea
                          value={transferForm.reason}
                          onChange={(e) =>
                            setTransferForm({
                              ...transferForm,
                              reason: e.target.value,
                            })
                          }
                          placeholder="Reason for transfer"
                        />
                      </div>
                      <Button onClick={handleCreateTransfer}>
                        Create Transfer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>From Branch</TableHead>
                    <TableHead>To Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transfer Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{transfer.user.email}</TableCell>
                      <TableCell>
                        {transfer.fromBranch
                          ? `${transfer.fromBranch.name} (${transfer.fromBranch.code})`
                          : "No Branch"}
                      </TableCell>
                      <TableCell>
                        {transfer.toBranch.name} ({transfer.toBranch.code})
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transfer.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(transfer.transferDate)}</TableCell>
                      <TableCell>
                        {transfer.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteTransfer(transfer.id)}
                          >
                            Execute
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                User Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Add Note</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>User</Label>
                        <Select
                          value={newNote.userId}
                          onValueChange={(value) =>
                            setNewNote({ ...newNote, userId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newNote.title}
                          onChange={(e) =>
                            setNewNote({ ...newNote, title: e.target.value })
                          }
                          placeholder="Note title"
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={newNote.content}
                          onChange={(e) =>
                            setNewNote({ ...newNote, content: e.target.value })
                          }
                          placeholder="Note content"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newNote.category}
                          onValueChange={(value) =>
                            setNewNote({ ...newNote, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="performance">
                              Performance
                            </SelectItem>
                            <SelectItem value="customer_feedback">
                              Customer Feedback
                            </SelectItem>
                            <SelectItem value="training">Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateNote}>Add Note</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{note.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {note.content}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{note.category}</Badge>
                            {note.isPrivate && (
                              <Badge variant="secondary">Private</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>By: {note.createdBy.email}</p>
                          <p>{formatDate(note.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Branch Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.map((analytic) => (
                  <Card key={analytic.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {analytic.branch.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Users:</span>
                          <span>
                            {analytic.activeUsers}/{analytic.totalUsers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customers:</span>
                          <span>{analytic.totalCustomers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Loans:</span>
                          <span>
                            {analytic.activeLoans}/{analytic.totalLoans}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Outstanding:</span>
                          <span>
                            {formatCurrency(analytic.outstandingAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collection Rate:</span>
                          <span>
                            {(analytic.collectionRate || 0).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Revenue:</span>
                          <span>{formatCurrency(analytic.monthlyRevenue)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select Users</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(
                                selectedUsers.filter((id) => id !== user.id)
                              );
                            }
                          }}
                        />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Operation</Label>
                  <Select
                    value={bulkOperation}
                    onValueChange={setBulkOperation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activate">Activate Users</SelectItem>
                      <SelectItem value="deactivate">
                        Deactivate Users
                      </SelectItem>
                      <SelectItem value="changeRole">Change Role</SelectItem>
                      <SelectItem value="assignBranch">
                        Assign Branch
                      </SelectItem>
                      <SelectItem value="unassignBranch">
                        Unassign Branch
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleBulkOperation}
                  disabled={selectedUsers.length === 0 || !bulkOperation}
                >
                  Execute Bulk Operation ({selectedUsers.length} users)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <p className="text-sm text-gray-600">
                      {users.filter((u) => u.isActive).length} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Logins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        users.filter(
                          (u) =>
                            u.lastLoginAt &&
                            new Date(u.lastLoginAt) >
                              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ).length
                      }
                    </div>
                    <p className="text-sm text-gray-600">Last 7 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Branch Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {branches.map((branch) => (
                        <div
                          key={branch.id}
                          className="flex justify-between text-sm"
                        >
                          <span>{branch.name}</span>
                          <span>
                            {
                              users.filter((u) => u.branchId === branch.id)
                                .length
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
