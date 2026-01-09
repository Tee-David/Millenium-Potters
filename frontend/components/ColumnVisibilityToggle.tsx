// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";

// type ColumnKey =
//   | "loanNumber"
//   | "loanIssuedDate"
//   | "loanDeadline"
//   | "repaymentDate"
//   | "principalAmount"
//   | "processingFee"
//   | "amountLeftToPay"
//   | "totalAmount"
//   | "dueToday"
//   | "branch"
//   | "creditOfficer"
//   | "actions";

// interface ColumnVisibilityToggleProps {
//   visibleCols: Record<ColumnKey, boolean>;
//   toggleVisibility: (key: ColumnKey) => void;
// }

// export function ColumnVisibilityToggle({
//   visibleCols,
//   toggleVisibility,
// }: ColumnVisibilityToggleProps) {
//   const [open, setOpen] = useState(false);

//   const columns: { key: ColumnKey; label: string }[] = [
//     { key: "loanNumber", label: "Loan Number" },
//     { key: "loanIssuedDate", label: "Issued Date" },
//     { key: "loanDeadline", label: "Deadline" },
//     { key: "repaymentDate", label: "Repayment Date" },
//     { key: "principalAmount", label: "Principal" },
//     { key: "processingFee", label: "Processing Fee" },
//     { key: "amountLeftToPay", label: "Amount Left" },
//     { key: "totalAmount", label: "Total Amount" },
//     { key: "dueToday", label: "Due Today" },
//     { key: "branch", label: "Branch" },
//     { key: "creditOfficer", label: "Credit Officer" },
//     { key: "actions", label: "Actions" },
//   ];

//   return (
//     <div className="relative inline-block text-left">
//       <Button
//         onClick={() => setOpen(!open)}
//         variant="outline"
//         size="sm"
//         className="bg-emerald-600 text-white hover:bg-emerald-700"
//       >
//         Columns Visibility
//       </Button>
//       {open && (
//         <div className="absolute right-0 mt-2 w-48 rounded-md bg-white border shadow-lg z-50 p-2">
//           {columns.map(({ key, label }) => (
//             <label
//               key={key}
//               className="flex items-center space-x-2 py-1 cursor-pointer select-none"
//             >
//               <input
//                 type="checkbox"
//                 checked={visibleCols[key]}
//                 onChange={() => toggleVisibility(key)}
//                 className="cursor-pointer"
//               />
//               <span className="text-gray-700 text-sm">{label}</span>
//             </label>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type ColumnKey =
  | "loanNumber"
  | "loanIssuedDate"
  | "loanDeadline"
  | "repaymentDate"
  | "principalAmount"
  | "processingFee"
  | "amountLeftToPay"
  | "totalAmount"
  | "dueToday"
  | "branch"
  | "creditOfficer"
  | "actions";

interface ColumnVisibilityToggleProps {
  visibleCols: Record<ColumnKey, boolean>;
  toggleVisibility: (key: ColumnKey) => void;
}

export function ColumnVisibilityToggle({
  visibleCols,
  toggleVisibility,
}: ColumnVisibilityToggleProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // prevent immediate close on toggle
    setOpen((prev) => !prev);
  };

  // Prevent click on dropdown content from bubbling up and closing dropdown
  const handleDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const columns: { key: ColumnKey; label: string }[] = [
    { key: "loanNumber", label: "Loan Number" },
    { key: "loanIssuedDate", label: "Issued Date" },
    { key: "loanDeadline", label: "Deadline" },
    { key: "repaymentDate", label: "Repayment Date" },
    { key: "principalAmount", label: "Principal" },
    { key: "processingFee", label: "Processing Fee" },
    { key: "amountLeftToPay", label: "Amount Left" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "dueToday", label: "Due Today" },
    { key: "branch", label: "Branch" },
    { key: "creditOfficer", label: "Credit Officer" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        className="bg-emerald-600 text-white flex items-center space-x-1"
        onClick={handleToggleClick}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Column visibility options"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Column Visibility</span>
      </Button>

      {/* Desktop dropdown */}
      {open && (
        <div
          onClick={handleDropdownClick}
          className={cn(
            "hidden sm:block absolute right-0 mt-2 w-48 rounded-md bg-white border border-gray-300 shadow-lg z-50 p-2 max-h-64 overflow-y-auto"
          )}
        >
          {columns.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded"
            >
              <input
                type="checkbox"
                checked={visibleCols[key]}
                onChange={() => toggleVisibility(key)}
                className="rounded border-gray-300 text-emerald-600 cursor-pointer"
              />
              <span className="capitalize text-sm">{label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Mobile fullscreen modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-lg w-full max-w-sm max-h-full p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Column Visibility</h3>
              <button
                aria-label="Close column visibility"
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-gray-900 text-xl font-bold select-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {columns.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-100 rounded"
                >
                  <input
                    type="checkbox"
                    checked={visibleCols[key]}
                    onChange={() => toggleVisibility(key)}
                    className="rounded border-gray-300 text-emerald-600 cursor-pointer"
                  />
                  <span className="capitalize text-base">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
