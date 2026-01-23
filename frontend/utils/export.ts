import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Loan } from "@/types/loan";
import { formatNaira } from "./currency";

// Helper to get member name
const getMemberName = (loan: Loan): string => {
  if (loan.unionMember) {
    return `${loan.unionMember.firstName} ${loan.unionMember.lastName}`;
  }
  return "N/A";
};

// Helper to get officer name
const getOfficerName = (loan: Loan): string => {
  if (loan.createdBy) {
    if (loan.createdBy.name) return loan.createdBy.name;
    if (loan.createdBy.firstName && loan.createdBy.lastName) {
      return `${loan.createdBy.firstName} ${loan.createdBy.lastName}`;
    }
    return loan.createdBy.email || "N/A";
  }
  return "N/A";
};

export const exportToExcel = (loans: Loan[], filename = "loans") => {
  const data = loans.map((loan) => ({
    "Loan Number": loan.loanNumber,
    Member: getMemberName(loan),
    Union: loan.union?.name || "N/A",
    "Loan Type": loan.loanType?.name || "N/A",
    "Principal Amount": formatNaira(loan.principalAmount),
    "Processing Fee": formatNaira(loan.processingFeeAmount || 0),
    Status: loan.status.replace("_", " ").toUpperCase(),
    "Credit Officer": getOfficerName(loan),
    "Start Date": loan.startDate || "N/A",
    "End Date": loan.endDate || "N/A",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Loans");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (loans: Loan[], filename = "loans") => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Loan Report", 14, 22);

  const tableData = loans.map((loan) => [
    loan.loanNumber,
    getMemberName(loan),
    loan.loanType?.name || "N/A",
    formatNaira(loan.principalAmount),
    loan.status.replace("_", " ").toUpperCase(),
    getOfficerName(loan),
  ]);
  autoTable(doc, {
    head: [
      [
        "Loan #",
        "Member",
        "Type",
        "Principal",
        "Status",
        "Officer",
      ],
    ],
    body: tableData,
    startY: 30,
  });

  doc.save(`${filename}.pdf`);
};

export const copyToClipboard = (loans: Loan[]) => {
  const data = loans
    .map(
      (loan) =>
        `${loan.loanNumber}\t${getMemberName(loan)}\t${
          loan.loanType?.name || "N/A"
        }\t${formatNaira(loan.principalAmount)}\t${loan.status.replace("_", " ").toUpperCase()}\t${getOfficerName(loan)}`
    )
    .join("\n");

  const header =
    "Loan Number\tMember\tLoan Type\tPrincipal Amount\tStatus\tCredit Officer\n";
  navigator.clipboard.writeText(header + data);
};
