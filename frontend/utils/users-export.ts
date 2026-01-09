import { User } from "@/types/user"; // Changed from @/interface/interfaces
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportUsersToExcel = (users: User[], filename = "users") => {
  const data = users.map((user) => ({
    Name: user.name,
    Email: user.email,
    Phone: user.phone,
    Role: user.role.replace("_", " ").toUpperCase(),
    Status: user.status.toUpperCase(),
    "Created At": user.createdAt,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  XLSX.writeFile(wb, `${filename}.xlsx`);
  toast.success("Users exported to Excel successfully!");
};

export const exportUsersToPDF = (users: User[], filename = "users") => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Users Report", 14, 22);

  const tableData = users.map((user) => [
    user.name,
    user.email,
    user.phone,
    user.role.replace("_", " ").toUpperCase(),
    user.status.toUpperCase(),
    user.createdAt,
  ]);

  (doc as any).autoTable({
    head: [["Name", "Email", "Phone", "Role", "Status", "Created At"]],
    body: tableData,
    startY: 30,
  });

  doc.save(`${filename}.pdf`);
  toast.success("Users exported to PDF successfully!");
};

export const copyUsersToClipboard = (users: User[]) => {
  const data = users
    .map(
      (user) =>
        `${user.name}\t${user.email}\t${user.phone}\t${user.role}\t${user.status}\t${user.createdAt}`
    )
    .join("\n");
  const header = "Name\tEmail\tPhone\tRole\tStatus\tCreated At\n";
  navigator.clipboard.writeText(header + data);
  toast.success("Users data copied to clipboard!");
};
