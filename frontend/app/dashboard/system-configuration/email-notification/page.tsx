"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Edit,
  Bold,
  Italic,
  Underline,
  Link,
  ImageIcon,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface NotificationTemplate {
  id: string;
  module: string;
  subject: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  content?: string;
}

export default function EmailNotificationPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: "1",
      module: "Payment Reminder",
      subject: "Payment Reminder for {customer_name} - {company_name}",
      emailEnabled: false,
      smsEnabled: false,
    },
    {
      id: "2",
      module: "New Transaction",
      subject: "New Transaction Confirmation from {company_name}",
      emailEnabled: false,
      smsEnabled: false,
    },
    {
      id: "3",
      module: "New Account",
      subject: "Your New Account is Ready!",
      emailEnabled: false,
      smsEnabled: false,
    },
    {
      id: "4",
      module: "New Repayment",
      subject: "New Repayment for {customer_name} - {company_name}",
      emailEnabled: false,
      smsEnabled: false,
    },
    {
      id: "5",
      module: "Loan Status Update",
      subject: "Loan Status Update: {loan_type} for {customer_name}",
      emailEnabled: false,
      smsEnabled: false,
    },
    {
      id: "6",
      module: "New Loan",
      subject: "New Loan Assigned: {loan_type} for {customer_name}",
      emailEnabled: false,
      smsEnabled: false,
    },
    {
      id: "7",
      module: "New Customer",
      subject: "Welcome to {company_name}!",
      emailEnabled: false,
      smsEnabled: false,
    },
    {
      id: "8",
      module: "New User",
      subject: "Welcome to {company_name}!",
      emailEnabled: false,
      smsEnabled: false,
    },
  ]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    module: "",
    subject: "",
    emailEnabled: false,
    smsEnabled: false,
    content: "",
  });

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      module: template.module,
      subject: template.subject,
      emailEnabled: template.emailEnabled,
      smsEnabled: template.smsEnabled,
      content:
        template.content ||
        `Dear {customer_name},

This is a reminder for an upcoming repayment. Below are the details:

Repayment Information:
• Repayment ID: {repayment_id}
• Payment Date: {due_date}
• Interest: {company_currency} {interest}
• Penalty: {company_currency} {penalty}
• Installment Amount: {company_currency} {installment_amount}
• Total Due: {company_currency} {total_amount}
• Payment Status: {payment_status}

If you have any questions or need further assistance, please feel free to contact {branch_name}.

Best regards,
{company_name}
{company_email}`,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;

    const updatedTemplate: NotificationTemplate = {
      ...editingTemplate,
      module: formData.module,
      subject: formData.subject,
      emailEnabled: formData.emailEnabled,
      smsEnabled: formData.smsEnabled,
      content: formData.content,
    };

    setTemplates(
      templates.map((t) => (t.id === editingTemplate.id ? updatedTemplate : t))
    );
    setIsEditOpen(false);
    setEditingTemplate(null);
  };

  const toggleEmailEnabled = (id: string) => {
    setTemplates(
      templates.map((t) =>
        t.id === id ? { ...t, emailEnabled: !t.emailEnabled } : t
      )
    );
  };

  const toggleSmsEnabled = (id: string) => {
    setTemplates(
      templates.map((t) =>
        t.id === id ? { ...t, smsEnabled: !t.smsEnabled } : t
      )
    );
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shortcodes = [
    "{company_name}",
    "{company_email}",
    "{company_phone_number}",
    "{company_address}",
    "{company_currency}",
    "{customer_name}",
    "{branch_name}",
    "{due_date}",
    "{interest}",
    "{payment_status}",
    "{installment_amount}",
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Email Notification Template
          </h1>
          <nav className="text-sm text-gray-500 mt-1">
            Dashboard &gt; Email Notification Template
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h2 className="text-lg font-medium">Email Notification Template</h2>
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
                  <TableHead>MODULE</TableHead>
                  <TableHead>SUBJECT</TableHead>
                  <TableHead>EMAIL ENABLE</TableHead>
                  <TableHead>SMS ENABLE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.module}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={
                          template.emailEnabled ? "default" : "destructive"
                        }
                        size="sm"
                        onClick={() => toggleEmailEnabled(template.id)}
                        className={
                          template.emailEnabled
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      >
                        {template.emailEnabled ? "Enable" : "Disable"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={
                          template.smsEnabled ? "default" : "destructive"
                        }
                        size="sm"
                        onClick={() => toggleSmsEnabled(template.id)}
                        className={
                          template.smsEnabled
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      >
                        {template.smsEnabled ? "Enable" : "Disable"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing 1 to {filteredTemplates.length} of{" "}
            {filteredTemplates.length} entries
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="module">Module</Label>
                <Input
                  id="module"
                  value={formData.module}
                  onChange={(e) =>
                    setFormData({ ...formData, module: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailEnabled"
                  checked={formData.emailEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailEnabled: checked })
                  }
                />
                <Label htmlFor="emailEnabled">Enabled Email Notification</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smsEnabled"
                  checked={formData.smsEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, smsEnabled: checked })
                  }
                />
                <Label htmlFor="smsEnabled">Enabled SMS Notification</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="content">Email Message</Label>

              {/* Rich Text Editor Toolbar */}
              <div className="border border-gray-300 rounded-t-md p-2 bg-gray-50 flex flex-wrap gap-1">
                <select className="text-sm border rounded px-2 py-1">
                  <option>Paragraph</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="p-1">
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Underline className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Link className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1">
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                id="content"
                rows={12}
                className="rounded-t-none"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Shortcodes</Label>
              <p className="text-sm text-gray-600 mb-2">
                Click to add below shortcodes and insert in your Message
              </p>
              <div className="flex flex-wrap gap-2">
                {shortcodes.map((shortcode) => (
                  <Button
                    key={shortcode}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        content: formData.content + shortcode,
                      })
                    }
                    className="text-xs"
                  >
                    {shortcode}
                  </Button>
                ))}
              </div>
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
