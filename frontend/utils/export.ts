import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import type { Loan } from "@/types/loan";
import { formatNaira } from "./currency";

export const exportToExcel = (loans: Loan[], filename = "loans") => {
  const data = loans.map((loan) => ({
    "Loan Number": loan.loanNumber,
    Customer: loan.customer.name,
    "Loan Type": loan.loanType.name,
    "Principal Amount": formatNaira(loan.principalAmount),
    "Processing Fee": formatNaira(loan.processingFee),
    "Amount Left": formatNaira(loan.amountLeftToPay),
    "Due Today": formatNaira(loan.dueToday),
    Status: loan.status.replace("_", " ").toUpperCase(),
    "Credit Officer": loan.createdBy.name,
    Branch: loan.branch,
    "Issued Date": loan.loanIssuedDate,
    Deadline: loan.loanDeadline,
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
    loan.customer.name,
    loan.loanType.name,
    formatNaira(loan.principalAmount),
    formatNaira(loan.amountLeftToPay),
    loan.status.replace("_", " ").toUpperCase(),
    loan.createdBy.name,
  ]);
  (doc as any).autoTable({
    head: [
      [
        "Loan #",
        "Customer",
        "Type",
        "Principal",
        "Left to Pay",
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
        `${loan.loanNumber}\t${loan.customer.name}\t${
          loan.loanType.name
        }\t${formatNaira(loan.principalAmount)}\t${formatNaira(
          loan.amountLeftToPay
        )}\t${loan.status}\t${loan.createdBy.name}`
    )
    .join("\n");

  const header =
    "Loan Number\tCustomer\tLoan Type\tPrincipal Amount\tAmount Left\tStatus\tCredit Officer\n";
  navigator.clipboard.writeText(header + data);
};
