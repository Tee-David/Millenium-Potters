// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Edit, Trash2, Download, Copy } from "lucide-react";
// import { CreateRepaymentModal } from "@/components/repayment/CreateRepaymentModal";
// import { EditRepaymentModal } from "@/components/repayment/EditRepaymentModal";
// import { Repayment } from "@/types/repayment";

// const LoanRepaymentSystem: React.FC = () => {
//   const [repayments, setRepayments] = useState<Repayment[]>([
//     {
//       id: 1,
//       loan: "#LON-0004",
//       paymentDate: "2024-07-20",
//       principalAmount: 357.14,
//       interest: 1200,
//       penalty: 0,
//       totalAmount: 1557.14,
//     },
//     {
//       id: 2,
//       loan: "#LON-0002",
//       paymentDate: "2024-07-20",
//       principalAmount: 1980.37,
//       interest: 229.17,
//       penalty: 0,
//       totalAmount: 2209.54,
//     },
//     {
//       id: 3,
//       loan: "#LON-0003",
//       paymentDate: "2024-08-01",
//       principalAmount: 900,
//       interest: 52.5,
//       penalty: 0,
//       totalAmount: 952.5,
//     },
//     {
//       id: 4,
//       loan: "#LON-0002",
//       paymentDate: "2024-08-20",
//       principalAmount: 1998.53,
//       interest: 211.01,
//       penalty: 0,
//       totalAmount: 2209.54,
//     },
//     {
//       id: 5,
//       loan: "#LON-0004",
//       paymentDate: "2024-08-20",
//       principalAmount: 357.14,
//       interest: 1200,
//       penalty: 0,
//       totalAmount: 1557.14,
//     },
//     {
//       id: 6,
//       loan: "#LON-0003",
//       paymentDate: "2024-09-01",
//       principalAmount: 900,
//       interest: 42,
//       penalty: 0,
//       totalAmount: 942,
//     },
//     {
//       id: 7,
//       loan: "#LON-0004",
//       paymentDate: "2024-09-20",
//       principalAmount: 357.14,
//       interest: 1200,
//       penalty: 0,
//       totalAmount: 1557.14,
//     },
//     {
//       id: 8,
//       loan: "#LON-0002",
//       paymentDate: "2024-09-20",
//       principalAmount: 2016.85,
//       interest: 192.69,
//       penalty: 3026.34,
//       totalAmount: 9235.88,
//     },
//     {
//       id: 9,
//       loan: "#LON-0004",
//       paymentDate: "2024-10-20",
//       principalAmount: 357.14,
//       interest: 1200,
//       penalty: 0,
//       totalAmount: 1557.14,
//     },
//     {
//       id: 10,
//       loan: "#LON-0002",
//       paymentDate: "2025-06-20",
//       principalAmount: 2189.47,
//       interest: 20.07,
//       penalty: 0,
//       totalAmount: 2209.54,
//     },
//   ]);

//   const [editingRepayment, setEditingRepayment] = useState<Repayment | null>(
//     null
//   );
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
//   const [searchTerm, setSearchTerm] = useState<string>("");

//   const loans: string[] = [
//     "#LON-0001",
//     "#LON-0002",
//     "#LON-0003",
//     "#LON-0004",
//     "#LON-0005",
//   ];

//   const handleCreateRepayment = (
//     repaymentData: Omit<Repayment, "id">
//   ): void => {
//     const newRepayment: Repayment = {
//       ...repaymentData,
//       id: repayments.length + 1,
//     };
//     setRepayments([...repayments, newRepayment]);
//   };

//   const handleEdit = (repayment: Repayment): void => {
//     setEditingRepayment(repayment);
//     setIsEditDialogOpen(true);
//   };

//   const handleUpdateRepayment = (updatedRepayment: Repayment): void => {
//     const updatedRepayments = repayments.map((rep) =>
//       rep.id === updatedRepayment.id ? updatedRepayment : rep
//     );
//     setRepayments(updatedRepayments);
//     setEditingRepayment(null);
//   };

//   const handleDelete = (id: number): void => {
//     setRepayments(repayments.filter((rep) => rep.id !== id));
//   };

//   const filteredRepayments = repayments.filter(
//     (repayment) =>
//       repayment.loan.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       repayment.paymentDate.includes(searchTerm) ||
//       repayment.principalAmount.toString().includes(searchTerm) ||
//       repayment.totalAmount.toString().includes(searchTerm)
//   );

//   const formatCurrency = (amount: number): string => {
//     return `$${amount.toLocaleString("en-US", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })}`;
//   };

//   const formatDate = (dateString: string): string => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gray-50/50 p-6">
//       <div className="max-w-7xl mx-auto space-y-6">
//         {/* Header */}
//         <div className="flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <h1 className="text-2xl font-bold text-gray-900">Repayment</h1>
//             <span className="text-sm text-gray-500">
//               Dashboard &gt; Repayment
//             </span>
//           </div>

//           <CreateRepaymentModal
//             loans={loans}
//             onCreateRepayment={handleCreateRepayment}
//           />
//         </div>

//         {/* Actions Bar */}
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex justify-between items-center">
//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="bg-emerald-600 text-white hover:bg-emerald-700"
//                 >
//                   <Download className="w-4 h-4 mr-1" />
//                   Excel
//                 </Button>
//                 <Button variant="outline" size="sm">
//                   <Download className="w-4 h-4 mr-1" />
//                   PDF
//                 </Button>
//                 <Button variant="outline" size="sm">
//                   <Copy className="w-4 h-4 mr-1" />
//                   Copy
//                 </Button>
//                 <Select defaultValue="visibility">
//                   <SelectTrigger className="w-40">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="visibility">
//                       Column visibility
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Label htmlFor="search">Search:</Label>
//                 <Input
//                   id="search"
//                   type="text"
//                   className="w-64"
//                   placeholder="Search repayments..."
//                   value={searchTerm}
//                   onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                     setSearchTerm(e.target.value)
//                   }
//                 />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Repayments Table */}
//         <Card>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-gray-50 border-b">
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
//                       LOAN
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
//                       PAYMENT DATE
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
//                       PRINCIPAL AMOUNT
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
//                       INTEREST
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
//                       PENALTY
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
//                       TOTAL AMOUNT
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
//                       ACTION
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredRepayments.map((repayment) => (
//                     <tr key={repayment.id} className="hover:bg-gray-50">
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <Badge
//                           variant="secondary"
//                           className="bg-blue-50 text-blue-700 hover:bg-blue-100"
//                         >
//                           {repayment.loan}
//                         </Badge>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
//                         {formatDate(repayment.paymentDate)}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
//                         {formatCurrency(repayment.principalAmount)}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
//                         {formatCurrency(repayment.interest)}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm">
//                         {repayment.penalty > 0 ? (
//                           <span className="text-red-600 font-semibold">
//                             {formatCurrency(repayment.penalty)}
//                           </span>
//                         ) : (
//                           <span className="text-gray-900">
//                             {formatCurrency(repayment.penalty)}
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
//                         {formatCurrency(repayment.totalAmount)}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm">
//                         <div className="flex items-center space-x-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => handleEdit(repayment)}
//                             className="h-8 w-8 p-0"
//                           >
//                             <Edit className="w-4 h-4 text-green-600" />
//                           </Button>
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => handleDelete(repayment.id)}
//                             className="h-8 w-8 p-0"
//                           >
//                             <Trash2 className="w-4 h-4 text-red-600" />
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Pagination */}
//         <div className="flex justify-between items-center text-sm text-gray-600">
//           <span>Showing 1 to 10 of {filteredRepayments.length} entries</span>
//           <div className="flex items-center space-x-2">
//             <Button variant="outline" size="sm" disabled>
//               Previous
//             </Button>
//             <Button
//               variant="default"
//               size="sm"
//               className="bg-blue-600 hover:bg-blue-700"
//             >
//               1
//             </Button>
//             <Button variant="outline" size="sm" disabled>
//               Next
//             </Button>
//           </div>
//         </div>

//         {/* Edit Dialog */}
//         <EditRepaymentModal
//           loans={loans}
//           repayment={editingRepayment}
//           isOpen={isEditDialogOpen}
//           onClose={() => {
//             setIsEditDialogOpen(false);
//             setEditingRepayment(null);
//           }}
//           onUpdateRepayment={handleUpdateRepayment}
//         />
//       </div>
//     </div>
//   );
// };

// export default LoanRepaymentSystem;
