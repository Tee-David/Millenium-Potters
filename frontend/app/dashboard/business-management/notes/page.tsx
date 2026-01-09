"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  Lock,
  Globe,
  Filter,
  Search,
  Calendar,
  User,
  Tag,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { auth, enhancedApi, api } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MobileContainer } from "@/components/ui/mobile-container";
import { MobileCard } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";

interface UserNote {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    branchId?: string;
    branch?: {
      id: string;
      name: string;
      code: string;
    };
  };
  title: string;
  content: string;
  category?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export default function NotesManagementPage() {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<UserNote | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [privacyFilter, setPrivacyFilter] = useState("all");

  // Note form
  const [noteForm, setNoteForm] = useState({
    userId: "",
    title: "",
    content: "",
    category: "general",
    isPrivate: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesRes, usersRes] = await Promise.all([
        enhancedApi.notes.getAll().catch((err) => {
          console.error("Notes API error:", err);
          return { data: { data: { notes: [] } } };
        }),
        api.get("/users").catch((err) => {
          console.error("Users API error:", err);
          return { data: { data: [] } };
        }),
      ]);

      // Ensure all data is arrays to prevent .map() errors
      setNotes(
        Array.isArray(notesRes.data.data?.notes) ? notesRes.data.data.notes : []
      );
      setUsers(Array.isArray(usersRes.data.data) ? usersRes.data.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data. Some features may not work properly.");

      // Ensure arrays are always initialized even on error
      setNotes([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered notes based on tab and filters
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by tab
    switch (activeTab) {
      case "general":
        filtered = notes.filter((note) => note.category === "general");
        break;
      case "performance":
        filtered = notes.filter((note) => note.category === "performance");
        break;
      case "customer_feedback":
        filtered = notes.filter(
          (note) => note.category === "customer_feedback"
        );
        break;
      case "training":
        filtered = notes.filter((note) => note.category === "training");
        break;
      case "private":
        filtered = notes.filter((note) => note.isPrivate);
        break;
      case "public":
        filtered = notes.filter((note) => !note.isPrivate);
        break;
      default:
        filtered = notes;
    }

    // Apply additional filters
    return filtered.filter((note) => {
      const matchesSearch =
        !searchTerm ||
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.createdBy.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || note.category === categoryFilter;
      const matchesUser = userFilter === "all" || note.userId === userFilter;
      const matchesPrivacy =
        privacyFilter === "all" ||
        (privacyFilter === "private" && note.isPrivate) ||
        (privacyFilter === "public" && !note.isPrivate);

      return matchesSearch && matchesCategory && matchesUser && matchesPrivacy;
    });
  }, [notes, activeTab, searchTerm, categoryFilter, userFilter, privacyFilter]);

  const handleCreateNote = async () => {
    if (!noteForm.userId || !noteForm.title || !noteForm.content) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await enhancedApi.notes.create(noteForm);
      toast.success("Note created successfully");
      setNoteForm({
        userId: "",
        title: "",
        content: "",
        category: "general",
        isPrivate: false,
      });
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Create note error:", error);
      toast.error("Failed to create note");
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !noteForm.title || !noteForm.content) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await enhancedApi.notes.update(selectedNote.id, {
        title: noteForm.title,
        content: noteForm.content,
        category: noteForm.category,
        isPrivate: noteForm.isPrivate,
      });
      toast.success("Note updated successfully");
      setIsEditModalOpen(false);
      setSelectedNote(null);
      fetchData();
    } catch (error) {
      console.error("Update note error:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await enhancedApi.notes.delete(noteId);
      toast.success("Note deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Delete note error:", error);
      toast.error("Failed to delete note");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "general":
        return "bg-blue-100 text-blue-800";
      case "performance":
        return "bg-green-100 text-green-800";
      case "customer_feedback":
        return "bg-purple-100 text-purple-800";
      case "training":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "general":
        return <FileText className="w-4 h-4" />;
      case "performance":
        return <MessageSquare className="w-4 h-4" />;
      case "customer_feedback":
        return <User className="w-4 h-4" />;
      case "training":
        return <Tag className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <MobileContainer>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notes Management</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MobileCard>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Notes
                  </p>
                  <p className="text-2xl font-bold">{notes.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </MobileCard>

          <MobileCard>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Public Notes
                  </p>
                  <p className="text-2xl font-bold">
                    {notes.filter((n) => !n.isPrivate).length}
                  </p>
                </div>
                <Globe className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </MobileCard>

          <MobileCard>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Private Notes
                  </p>
                  <p className="text-2xl font-bold">
                    {notes.filter((n) => n.isPrivate).length}
                  </p>
                </div>
                <Lock className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </MobileCard>

          <MobileCard>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      notes.filter(
                        (n) =>
                          new Date(n.createdAt) >
                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ).length
                    }
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </MobileCard>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="customer_feedback">
                      Customer Feedback
                    </SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>User</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {(users || []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Privacy</Label>
                <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All privacy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Privacy</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="customer_feedback">Feedback</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(filteredNotes || []).map((note) => (
                <MobileCard key={note.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(note.category || "general")}
                          <Badge
                            className={getCategoryColor(
                              note.category || "general"
                            )}
                          >
                            {note.category || "general"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {note.isPrivate ? (
                            <Lock className="w-4 h-4 text-red-500" />
                          ) : (
                            <Globe className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">{note.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                          {note.content}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span>
                            {note.user.firstName && note.user.lastName
                              ? `${note.user.firstName} ${note.user.lastName}`
                              : note.user.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          By: {note.createdBy.email}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <MobileButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNote(note);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </MobileButton>
                        <MobileButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNote(note);
                            setNoteForm({
                              userId: note.userId,
                              title: note.title,
                              content: note.content,
                              category: note.category || "general",
                              isPrivate: note.isPrivate,
                            });
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </MobileButton>
                        <MobileButton
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </MobileButton>
                      </div>
                    </div>
                  </CardContent>
                </MobileCard>
              ))}
            </div>

            {filteredNotes.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No notes found
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === "all"
                      ? "No notes have been created yet."
                      : `No ${activeTab} notes found.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Note Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User *</Label>
                <Select
                  value={noteForm.userId}
                  onValueChange={(value) =>
                    setNoteForm({ ...noteForm, userId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {(users || []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div>
                          <div>{user.email}</div>
                          <div className="text-sm text-gray-500">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.role}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title *</Label>
                <Input
                  value={noteForm.title}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, title: e.target.value })
                  }
                  placeholder="Note title"
                />
              </div>

              <div>
                <Label>Content *</Label>
                <Textarea
                  value={noteForm.content}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, content: e.target.value })
                  }
                  placeholder="Note content"
                  rows={6}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={noteForm.category}
                  onValueChange={(value) =>
                    setNoteForm({ ...noteForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="customer_feedback">
                      Customer Feedback
                    </SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={noteForm.isPrivate}
                  onCheckedChange={(checked) =>
                    setNoteForm({ ...noteForm, isPrivate: !!checked })
                  }
                />
                <Label htmlFor="isPrivate">Private Note</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateNote}>Add Note</Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Note Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={noteForm.title}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, title: e.target.value })
                  }
                  placeholder="Note title"
                />
              </div>

              <div>
                <Label>Content *</Label>
                <Textarea
                  value={noteForm.content}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, content: e.target.value })
                  }
                  placeholder="Note content"
                  rows={6}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={noteForm.category}
                  onValueChange={(value) =>
                    setNoteForm({ ...noteForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="customer_feedback">
                      Customer Feedback
                    </SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivateEdit"
                  checked={noteForm.isPrivate}
                  onCheckedChange={(checked) =>
                    setNoteForm({ ...noteForm, isPrivate: !!checked })
                  }
                />
                <Label htmlFor="isPrivateEdit">Private Note</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpdateNote}>Update Note</Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Note Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Note Details</DialogTitle>
            </DialogHeader>
            {selectedNote && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(selectedNote.category || "general")}
                    <Badge
                      className={getCategoryColor(
                        selectedNote.category || "general"
                      )}
                    >
                      {selectedNote.category || "general"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedNote.isPrivate ? (
                      <div className="flex items-center gap-1 text-red-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">Private</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Public</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedNote.title}
                  </h2>
                </div>

                <div>
                  <Label>Content</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap">
                      {selectedNote.content}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>User</Label>
                    <p>
                      {selectedNote.user.firstName && selectedNote.user.lastName
                        ? `${selectedNote.user.firstName} ${selectedNote.user.lastName}`
                        : selectedNote.user.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedNote.user.role}
                    </p>
                  </div>
                  <div>
                    <Label>Created By</Label>
                    <p>{selectedNote.createdBy.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created</Label>
                    <p>{formatDateTime(selectedNote.createdAt)}</p>
                  </div>
                  <div>
                    <Label>Updated</Label>
                    <p>{formatDateTime(selectedNote.updatedAt)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setNoteForm({
                        userId: selectedNote.userId,
                        title: selectedNote.title,
                        content: selectedNote.content,
                        category: selectedNote.category || "general",
                        isPrivate: selectedNote.isPrivate,
                      });
                      setIsDetailsModalOpen(false);
                      setIsEditModalOpen(true);
                    }}
                  >
                    Edit Note
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteNote(selectedNote.id);
                      setIsDetailsModalOpen(false);
                    }}
                  >
                    Delete Note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MobileContainer>
  );
}
