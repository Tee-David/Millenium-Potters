"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Plus } from "lucide-react";

interface AccountType {
  id: string;
  title: string;
  interestRate: number;
  interestDuration: string;
  minMaintainAmount: number;
  maintenanceCharge: number;
  chargeDeductMonth: number;
}

export default function AccountTypePage() {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([
    {
      id: "1",
      title: "Checking Account",
      interestRate: 5,
      interestDuration: "month",
      minMaintainAmount: 1500,
      maintenanceCharge: 15,
      chargeDeductMonth: 9,
    },
    {
      id: "2",
      title: "Fixed Deposit",
      interestRate: 3,
      interestDuration: "year",
      minMaintainAmount: 1000,
      maintenanceCharge: 10,
      chargeDeductMonth: 3,
    },
    {
      id: "3",
      title: "Savings Account",
      interestRate: 0.5,
      interestDuration: "year",
      minMaintainAmount: 100,
      maintenanceCharge: 5,
      chargeDeductMonth: 2,
    },
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccountType, setEditingAccountType] =
    useState<AccountType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    interestRate: "",
    interestDuration: "year",
    minMaintainAmount: "",
    maintenanceCharge: "",
    chargeDeductMonth: "",
  });

  const handleCreate = () => {
    const newAccountType: AccountType = {
      id: Date.now().toString(),
      title: formData.title,
      interestRate: Number.parseFloat(formData.interestRate),
      interestDuration: formData.interestDuration,
      minMaintainAmount: Number.parseFloat(formData.minMaintainAmount),
      maintenanceCharge: Number.parseFloat(formData.maintenanceCharge),
      chargeDeductMonth: Number.parseInt(formData.chargeDeductMonth),
    };
    setAccountTypes([...accountTypes, newAccountType]);
    setFormData({
      title: "",
      interestRate: "",
      interestDuration: "year",
      minMaintainAmount: "",
      maintenanceCharge: "",
      chargeDeductMonth: "",
    });
    setIsCreateOpen(false);
  };

  const handleEdit = (accountType: AccountType) => {
    setEditingAccountType(accountType);
    setFormData({
      title: accountType.title,
      interestRate: accountType.interestRate.toString(),
      interestDuration: accountType.interestDuration,
      minMaintainAmount: accountType.minMaintainAmount.toString(),
      maintenanceCharge: accountType.maintenanceCharge.toString(),
      chargeDeductMonth: accountType.chargeDeductMonth.toString(),
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAccountType) return;

    const updatedAccountType: AccountType = {
      ...editingAccountType,
      title: formData.title,
      interestRate: Number.parseFloat(formData.interestRate),
      interestDuration: formData.interestDuration,
      minMaintainAmount: Number.parseFloat(formData.minMaintainAmount),
      maintenanceCharge: Number.parseFloat(formData.maintenanceCharge),
      chargeDeductMonth: Number.parseInt(formData.chargeDeductMonth),
    };

    setAccountTypes(
      accountTypes.map((at) =>
        at.id === editingAccountType.id ? updatedAccountType : at
      )
    );
    setIsEditOpen(false);
    setEditingAccountType(null);
  };

  const handleDelete = (id: string) => {
    setAccountTypes(accountTypes.filter((at) => at.id !== id));
  };

  const filteredAccountTypes = accountTypes.filter((accountType) =>
    accountType.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Account Type</h1>
          <nav className="text-sm text-gray-500 mt-1">
            Dashboard &gt; Account Type
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h2 className="text-lg font-medium">Account Type</h2>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Account Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Account Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="interestRate">Interest Rate</Label>
                    <Input
                      id="interestRate"
                      placeholder="Enter Interest Rate"
                      value={formData.interestRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interestRate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="interestDuration">Interest Duration</Label>
                    <Select
                      value={formData.interestDuration}
                      onValueChange={(value) =>
                        setFormData({ ...formData, interestDuration: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="minMaintainAmount">
                      Minimum Maintain Amount
                    </Label>
                    <Input
                      id="minMaintainAmount"
                      placeholder="Enter Minimum Maintain Amount"
                      value={formData.minMaintainAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minMaintainAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenanceCharge">
                      Maintenance Charges
                    </Label>
                    <Input
                      id="maintenanceCharge"
                      placeholder="Enter Maintenance Charges"
                      value={formData.maintenanceCharge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maintenanceCharge: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="chargeDeductMonth">
                      Charges Deduct Month
                    </Label>
                    <Input
                      id="chargeDeductMonth"
                      placeholder="Enter Charges Deduct Month"
                      value={formData.chargeDeductMonth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          chargeDeductMonth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Export and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
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
                    Column visibility
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Show all columns</DropdownMenuItem>
                  <DropdownMenuItem>Hide columns</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="search" className="text-sm font-medium">
                Search:
              </Label>
              <Input
                id="search"
                placeholder="Search..."
                className="w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TITLE</TableHead>
                  <TableHead>INTEREST RATE</TableHead>
                  <TableHead>INTEREST DURATION</TableHead>
                  <TableHead>MIN MAINTAIN AMT</TableHead>
                  <TableHead>MAINTENANCE CHARGE</TableHead>
                  <TableHead>CHARGE DEDUCT MONTH</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccountTypes.map((accountType) => (
                  <TableRow key={accountType.id}>
                    <TableCell className="font-medium">
                      {accountType.title}
                    </TableCell>
                    <TableCell>{accountType.interestRate}</TableCell>
                    <TableCell>{accountType.interestDuration}</TableCell>
                    <TableCell>${accountType.minMaintainAmount}</TableCell>
                    <TableCell>${accountType.maintenanceCharge}</TableCell>
                    <TableCell>{accountType.chargeDeductMonth}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(accountType)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(accountType.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing 1 to {filteredAccountTypes.length} of{" "}
            {filteredAccountTypes.length} entries
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="editInterestRate">Interest Rate</Label>
              <Input
                id="editInterestRate"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({ ...formData, interestRate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="editInterestDuration">Interest Duration</Label>
              <Select
                value={formData.interestDuration}
                onValueChange={(value) =>
                  setFormData({ ...formData, interestDuration: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editMinMaintainAmount">
                Minimum Maintain Amount
              </Label>
              <Input
                id="editMinMaintainAmount"
                value={formData.minMaintainAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minMaintainAmount: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="editMaintenanceCharge">Maintenance Charges</Label>
              <Input
                id="editMaintenanceCharge"
                value={formData.maintenanceCharge}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maintenanceCharge: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="editChargeDeductMonth">
                Charges Deduct Month
              </Label>
              <Input
                id="editChargeDeductMonth"
                value={formData.chargeDeductMonth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    chargeDeductMonth: e.target.value,
                  })
                }
              />
            </div>
            <Button
              onClick={handleUpdate}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
