import { Decimal } from "@prisma/client/runtime/library";
import { Role } from "@prisma/client";
import prisma from "../prismaClient";

// Define enums locally since Prisma client seems to have issues
enum RepaymentMethod {
  CASH = "CASH",
  TRANSFER = "TRANSFER",
  POS = "POS",
  MOBILE = "MOBILE",
  USSD = "USSD",
  OTHER = "OTHER",
}

enum ScheduleStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

enum LoanStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DEFAULTED = "DEFAULTED",
  WRITTEN_OFF = "WRITTEN_OFF",
  CANCELED = "CANCELED",
}

interface CreateRepaymentData {
  loanId: string;
  amount: number;
  paidAt?: string;
  method: RepaymentMethod;
  reference?: string;
  notes?: string;
  scheduleItemId?: string; // Optional: target specific schedule item for payment
}

export class RepaymentService {
  static async createRepayment(
    data: CreateRepaymentData,
    receivedByUserId: string
  ) {
    // Validate loan
    const loan = await prisma.loan.findUnique({
      where: { id: data.loanId },
      include: {
        scheduleItems: {
          where: { deletedAt: null },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.APPROVED
    ) {
      throw new Error("Can only make payments on active or approved loans");
    }

    const amount = new Decimal(data.amount);
    const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();

    // Create repayment
    const repayment = await prisma.repayment.create({
      data: {
        loanId: data.loanId,
        receivedByUserId,
        amount,
        paidAt,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      },
      include: {
        loan: {
          include: {
            unionMember: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Allocate payment to schedule items (prioritize specific schedule item if provided)
    await this.allocatePayment(repayment.id, data.loanId, amount, data.scheduleItemId);

    // Recalculate remaining schedules to redistribute the remaining balance
    await this.recalculateRemainingSchedules(data.loanId);

    // Check if loan is fully paid or overdue
    await this.updateLoanStatus(data.loanId);

    return repayment;
  }

  static async allocatePayment(
    repaymentId: string,
    loanId: string,
    amount: Decimal,
    targetScheduleItemId?: string
  ) {
    // Get pending and partial schedule items ordered by due date
    let scheduleItems = await prisma.repaymentScheduleItem.findMany({
      where: {
        loanId,
        status: {
          in: [
            ScheduleStatus.PENDING,
            ScheduleStatus.PARTIAL,
            ScheduleStatus.OVERDUE,
          ],
        },
        deletedAt: null,
      },
      orderBy: { dueDate: "asc" },
    });

    // If a specific schedule item is targeted, prioritize it by moving it to the front
    if (targetScheduleItemId) {
      const targetIndex = scheduleItems.findIndex(item => item.id === targetScheduleItemId);
      if (targetIndex > 0) {
        const [targetItem] = scheduleItems.splice(targetIndex, 1);
        scheduleItems.unshift(targetItem);
        console.log(`Prioritizing schedule item ${targetScheduleItemId} for payment allocation`);
      }
    }

    let remainingAmount = amount;
    const allocations = [];

    for (const item of scheduleItems) {
      if (remainingAmount.lte(0)) break;

      const itemOutstanding = item.totalDue.minus(item.paidAmount);

      if (itemOutstanding.lte(0)) continue;

      const allocationAmount = remainingAmount.gte(itemOutstanding)
        ? itemOutstanding
        : remainingAmount;

      allocations.push({
        repaymentId,
        scheduleItemId: item.id,
        amount: allocationAmount,
      });

      const newPaidAmount = item.paidAmount.plus(allocationAmount);
      const newStatus = newPaidAmount.gte(item.totalDue)
        ? ScheduleStatus.PAID
        : ScheduleStatus.PARTIAL;

      await prisma.repaymentScheduleItem.update({
        where: { id: item.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          closedAt: newStatus === ScheduleStatus.PAID ? new Date() : null,
        },
      });

      remainingAmount = remainingAmount.minus(allocationAmount);
    }

    // Create allocation records
    if (allocations.length > 0) {
      await prisma.repaymentAllocation.createMany({
        data: allocations,
      });
    }
  }

  /**
 * Recalculate remaining schedule items after a payment
 * Due per period = (loan principal - total repaid) / remaining periods
 * FIXED: Uses loan.principalAmount - sum of repayments, not schedule sums
 * This prevents circular shrinking of schedule totals
 */
  /**
   * Recalculate remaining schedule items after a payment
   * FIXED: Preserves original schedule amounts and fills them sequentially
   * This ensures future items retain their correct installment amount (e.g. 600)
   * instead of getting weird fractional amounts from equal redistribution.
   */
  static async recalculateRemainingSchedules(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        repayments: { where: { deletedAt: null } },
        scheduleItems: {
          where: { deletedAt: null },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    if (!loan) return;

    // 1. Calculate Total Repaid
    let remainingPaid = loan.repayments.reduce(
      (sum, r) => sum.plus(r.amount),
      new Decimal(0)
    ).toNumber();

    console.log(`Recalculating ${loan.loanNumber}: Total Repaid = ${remainingPaid}`);

    // 2. Iterate through ALL schedule items and fill them sequentially
    // We don't change the PrincipalDue/TotalDue unless it was wrong (mismatch with sum)
    // But for now, we assume fixed_all_schedules.js has restored correct TotalDue values.
    // We just update PaidAmount and Status based on the waterfall.

    for (const item of loan.scheduleItems) {
      const itemDue = item.totalDue.toNumber();
      let thisPaid = 0;

      if (remainingPaid >= itemDue) {
        thisPaid = itemDue;
        remainingPaid -= itemDue;
      } else {
        thisPaid = remainingPaid;
        remainingPaid = 0;
      }

      // Fix float precision
      thisPaid = Math.round(thisPaid * 100) / 100;

      let newStatus = ScheduleStatus.PENDING;
      if (Math.abs(thisPaid - itemDue) < 0.01) newStatus = ScheduleStatus.PAID;
      else if (thisPaid > 0) newStatus = ScheduleStatus.PARTIAL;
      else if (new Date() > item.dueDate) newStatus = ScheduleStatus.OVERDUE;

      // Only update if changed
      if (
        item.paidAmount.toNumber() !== thisPaid ||
        item.status !== newStatus
      ) {
        await prisma.repaymentScheduleItem.update({
          where: { id: item.id },
          data: {
            paidAmount: new Decimal(thisPaid),
            status: newStatus
          }
        });
      }
    }
    console.log(`Recalculation complete for ${loan.loanNumber}`);
  }

  /**
   * Update loan status based on repayments and dates
   * Handles transitions: APPROVED -> ACTIVE -> COMPLETED / OVERDUE
   */
  static async updateLoanStatus(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        repayments: { where: { deletedAt: null } }
      }
    });

    if (!loan) return;

    const totalRepaid = loan.repayments.reduce(
      (sum, r) => sum.add(r.amount),
      new Decimal(0)
    );

    const principal = new Decimal(loan.principalAmount);
    const outstanding = principal.minus(totalRepaid);

    let newStatus = loan.status;
    const today = new Date();
    const isPastDue = loan.endDate && today > loan.endDate;

    // Determine correct status
    if (outstanding.lte(0)) {
      newStatus = "COMPLETED";
    } else if (totalRepaid.gt(0)) {
      // Has made payments but not finished
      newStatus = isPastDue ? "DEFAULTED" : "ACTIVE";
      // Note: Using DEFAULTED for consistency with enum, though UI might show Overdue
    } else if (loan.status === "APPROVED" || loan.status === "ACTIVE") {
      // Approved but no payments yet
      newStatus = "APPROVED";
    }

    // Only update if status changed or just to be safe about closedAt
    if (newStatus !== loan.status || (newStatus === "COMPLETED" && !loan.closedAt)) {
      console.log(`Updating loan ${loan.loanNumber} status: ${loan.status} -> ${newStatus}`);

      await prisma.loan.update({
        where: { id: loanId },
        data: {
          status: newStatus as any,
          closedAt: newStatus === "COMPLETED" ? new Date() : null,
        }
      });
    }
  }

  static async getRepayments(
    filters: {
      page?: number;
      limit?: number;
      loanId?: string;
      receivedByUserId?: string;
      method?: RepaymentMethod;
      dateFrom?: string;
      dateTo?: string;
    },
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Role-based filtering
    console.log("=== REPAYMENT FILTERING DEBUG ===");
    console.log("User role:", userRole);
    console.log("User ID:", userId);
    console.log("User branch ID:", userUnionId);
    console.log(
      "Where clause before role filtering:",
      JSON.stringify(where, null, 2)
    );

    // TEMPORARY: Allow all users to see all repayments for debugging
    console.log("TEMPORARY DEBUG: Allowing all users to see all repayments");

    // Role-based filtering for repayments
    if (userRole === Role.ADMIN) {
      // ADMIN can see all repayments - no additional filtering
      console.log("ADMIN user - showing all repayments");
    } else if (userRole === Role.SUPERVISOR) {
      // SUPERVISOR can see all repayments (they supervise credit officers)
      console.log("SUPERVISOR user - showing all repayments");
    } else if (userRole === Role.CREDIT_OFFICER && userId) {
      // CREDIT_OFFICER can see repayments for loans in their unions
      // Get all unions managed by this credit officer
      const userUnions = await prisma.union.findMany({
        where: {
          creditOfficerId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      const unionIds = userUnions.map(u => u.id);

      if (unionIds.length > 0) {
        where.loan = {
          unionId: { in: unionIds },
          deletedAt: null,
        };
      } else {
        // Credit officer has no unions, return empty result
        where.loan = {
          id: "no-unions-assigned",
        };
      }
      console.log(
        "CREDIT_OFFICER user - filtering by unions:",
        unionIds
      );
    } else {
      // Unknown role - restrict access
      where.loan = {
        id: "non-existent-id", // This will return no results
      };
      console.log("Unknown user role - restricting access");
    }

    console.log(
      "Where clause after role filtering:",
      JSON.stringify(where, null, 2)
    );
    console.log("=== END REPAYMENT FILTERING DEBUG ===");

    if (filters.loanId) {
      where.loanId = filters.loanId;
    }

    if (filters.receivedByUserId) {
      where.receivedByUserId = filters.receivedByUserId;
    }

    if (filters.method) {
      where.method = filters.method;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.paidAt = {};
      if (filters.dateFrom) {
        where.paidAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.paidAt.lte = new Date(filters.dateTo);
      }
    }

    const [repayments, total] = await Promise.all([
      prisma.repayment.findMany({
        where,
        include: {
          loan: {
            select: {
              id: true,
              loanNumber: true,
              unionMember: {
                select: {
                  id: true,
                  code: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          receivedBy: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          allocations: {
            include: {
              scheduleItem: {
                select: {
                  id: true,
                  sequence: true,
                  dueDate: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { paidAt: "desc" },
      }),
      prisma.repayment.count({ where }),
    ]);

    return { repayments, total, page, limit };
  }

  static async getRepaymentById(
    id: string,
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    console.log("getRepaymentById called with:", {
      id,
      userRole,
      userUnionId,
      userId,
    });

    const repayment = await prisma.repayment.findUnique({
      where: {
        id,
        deletedAt: null, // Only get non-deleted repayments
      },
      include: {
        loan: {
          include: {
            unionMember: true,
            union: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        allocations: {
          include: {
            scheduleItem: true,
          },
        },
      },
    });

    if (!repayment) {
      console.log("Repayment not found for ID:", id);
      throw new Error("Repayment not found");
    }

    console.log("Repayment found:", {
      id: repayment.id,
      loanId: repayment.loanId,
      loanUnionId: repayment.loan.unionId,
    });

    // Permission check based on role
    if (userRole === Role.ADMIN) {
      // ADMIN can view any repayment
      console.log("ADMIN user - allowing access to repayment:", id);
    } else if (userRole === Role.SUPERVISOR) {
      // SUPERVISOR can view all repayments (they supervise credit officers)
      console.log("SUPERVISOR user - allowing access to repayment:", id);
    } else if (userRole === Role.CREDIT_OFFICER && userId) {
      // CREDIT_OFFICER can view repayments for loans in their unions
      // Get all unions managed by this credit officer
      const userUnions = await prisma.union.findMany({
        where: {
          creditOfficerId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      const unionIds = userUnions.map(u => u.id);

      if (!unionIds.includes(repayment.loan.unionId)) {
        console.log("CREDIT_OFFICER access denied - loan not in their unions:", {
          userId,
          loanUnionId: repayment.loan.unionId,
          userUnionIds: unionIds,
        });
        throw new Error("You do not have permission to view this repayment");
      }
      console.log("CREDIT_OFFICER user - allowing access to repayment:", id);
    } else {
      // Unknown role - deny access
      console.log("Unknown user role - denying access");
      throw new Error("You do not have permission to view this repayment");
    }

    return repayment;
  }

  static async updateRepayment(
    id: string,
    data: {
      method?: RepaymentMethod;
      reference?: string;
      notes?: string;
    },
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    const repayment = await prisma.repayment.findUnique({
      where: { id },
      include: {
        loan: true,
      },
    });

    if (!repayment || repayment.deletedAt) {
      throw new Error("Repayment not found");
    }

    // Permission check
    if (userRole === Role.CREDIT_OFFICER) {
      throw new Error("You do not have permission to update this repayment");
    }

    if (
      userRole === Role.SUPERVISOR &&
      userUnionId &&
      repayment.loan.unionId !== userUnionId
    ) {
      throw new Error("You do not have permission to update this repayment");
    }

    // Only allow updates within 24 hours of creation
    const hoursSinceCreation =
      (Date.now() - repayment.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new Error("Cannot update repayment after 24 hours");
    }

    const updatedRepayment = await prisma.repayment.update({
      where: { id },
      data: {
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      },
      include: {
        loan: {
          include: {
            unionMember: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return updatedRepayment;
  }

  static async deleteRepayment(
    id: string,
    userRole: Role,
    userUnionId?: string
  ) {
    const repayment = await prisma.repayment.findUnique({
      where: { id },
      include: {
        loan: true,
        allocations: true,
      },
    });

    if (!repayment || repayment.deletedAt) {
      throw new Error("Repayment not found");
    }

    // Only admins and branch managers can delete repayments
    if (userRole === Role.CREDIT_OFFICER) {
      throw new Error("Credit officers cannot delete repayments");
    }

    if (
      userRole === Role.SUPERVISOR &&
      userUnionId &&
      repayment.loan.unionId !== userUnionId
    ) {
      throw new Error("You do not have permission to delete this repayment");
    }

    // Only allow deletion within 24 hours
    const hoursSinceCreation =
      (Date.now() - repayment.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new Error("Cannot delete repayment after 24 hours. Contact admin.");
    }

    // Reverse allocations
    for (const allocation of repayment.allocations) {
      const scheduleItem = await prisma.repaymentScheduleItem.findUnique({
        where: { id: allocation.scheduleItemId },
      });

      if (scheduleItem) {
        const newPaidAmount = scheduleItem.paidAmount.minus(allocation.amount);
        const newStatus = newPaidAmount.lte(0)
          ? ScheduleStatus.PENDING
          : newPaidAmount.lt(scheduleItem.totalDue)
            ? ScheduleStatus.PARTIAL
            : ScheduleStatus.PAID;

        await prisma.repaymentScheduleItem.update({
          where: { id: allocation.scheduleItemId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            closedAt: null,
          },
        });
      }
    }

    // Soft delete repayment
    await prisma.repayment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Recheck loan status
    const pendingItems = await prisma.repaymentScheduleItem.count({
      where: {
        loanId: repayment.loanId,
        status: { notIn: [ScheduleStatus.PAID] },
        deletedAt: null,
      },
    });

    if (pendingItems > 0) {
      await prisma.loan.update({
        where: { id: repayment.loanId },
        data: {
          status: "ACTIVE",
          closedAt: null,
        },
      });
    }
  }

  static async getRepaymentSchedules(
    filters: {
      page: number;
      limit: number;
      loanId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    console.log("getRepaymentSchedules called with filters:", filters);
    console.log(
      "User role:",
      userRole,
      "branchId:",
      userUnionId,
      "userId:",
      userId
    );

    const skip = (filters.page - 1) * filters.limit;

    // Only show schedules for loans that are APPROVED, ACTIVE, COMPLETED, or DEFAULTED
    const allowedLoanStatuses = ["APPROVED", "ACTIVE", "COMPLETED", "DEFAULTED"];

    const where: any = {
      deletedAt: null,
      // Exclude PAID schedules by default - they belong on Repayments page
      // Only show schedules that still need payment (PENDING, PARTIAL, OVERDUE)
      status: { notIn: ['PAID'] },
      // Filter by loan status - only show schedules for approved/active loans
      loan: {
        status: { in: allowedLoanStatuses },
        deletedAt: null,
      },
    };

    // Apply basic filters first
    if (filters.loanId) {
      where.loanId = filters.loanId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.dueDate = {};
      if (filters.dateFrom) {
        where.dueDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.dueDate.lte = new Date(filters.dateTo);
      }
    }

    // Apply role-based filtering
    console.log("Applying role-based filtering");
    console.log(
      "User role:",
      userRole,
      "User ID:",
      userId,
      "Branch ID:",
      userUnionId
    );

    if (userRole === Role.ADMIN) {
      // ADMIN can see all schedules for approved/active loans - no additional filtering
      console.log("ADMIN user - showing all repayment schedules for approved/active loans");
    } else if (userRole === Role.SUPERVISOR) {
      // SUPERVISOR can see all schedules (they supervise credit officers)
      console.log("SUPERVISOR user - showing all repayment schedules");
    } else if (userRole === Role.CREDIT_OFFICER && userId) {
      // CREDIT_OFFICER can see schedules for loans in their unions
      // Get all unions managed by this credit officer
      const userUnions = await prisma.union.findMany({
        where: {
          creditOfficerId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      const unionIds = userUnions.map(u => u.id);

      if (unionIds.length > 0) {
        // Merge with existing loan filter
        where.loan = {
          ...where.loan,
          unionId: { in: unionIds },
        };
      } else {
        // Credit officer has no unions, return empty result
        where.loan = {
          id: "no-unions-assigned",
        };
      }
      console.log(
        "CREDIT_OFFICER user - filtering by unions:",
        unionIds
      );
    } else {
      // Unknown role or missing required data - restrict access
      console.log(
        "Unknown user role or missing required data - restricting access"
      );
      // Return empty results immediately without making a database query
      return {
        schedules: [],
        total: 0,
        page: filters.page,
        limit: filters.limit,
      };
    }

    console.log("Final where clause:", JSON.stringify(where, null, 2));

    try {
      console.log("Executing Prisma query for repayment schedules...");

      const [schedules, total] = await Promise.all([
        prisma.repaymentScheduleItem.findMany({
          where,
          include: {
            loan: {
              include: {
                unionMember: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                  },
                },
                union: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                  },
                },
                loanType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                // Include actual repayments to calculate totalPaid correctly
                repayments: {
                  where: { deletedAt: null },
                  select: {
                    amount: true,
                  },
                },
              },
            },
          },
          orderBy: [{ dueDate: "asc" }, { sequence: "asc" }],
          skip,
          take: filters.limit,
        }),
        prisma.repaymentScheduleItem.count({ where }),
      ]);

      console.log(
        `Found ${schedules.length} repayment schedules out of ${total} total`
      );

      // Transform schedules to include totalPaid calculated from actual repayments
      const schedulesWithTotalPaid = schedules.map((schedule: any) => {
        // Calculate totalPaid from Repayments table (reliable source of truth)
        // instead of schedule items (which had corruption issues)
        const totalPaid = schedule.loan.repayments.reduce(
          (sum: number, item: any) => sum + parseFloat(item.amount || 0),
          0
        );

        // Calculate totalOutstanding (what's left to pay for the whole loan)
        const principalAmount = parseFloat(schedule.loan.principalAmount || 0);
        const totalOutstanding = Math.max(0, principalAmount - totalPaid);

        return {
          ...schedule,
          loan: {
            ...schedule.loan,
            totalPaid,
            totalOutstanding,
            // Remove repayments from response to keep it clean
            repayments: undefined,
          },
        };
      });

      return {
        schedules: schedulesWithTotalPaid,
        total,
        page: filters.page,
        limit: filters.limit,
      };
    } catch (error: unknown) {
      console.error("Error in Prisma query:", error);
      if (error instanceof Error) {
        throw new Error(`Database query failed: ${error.message}`);
      } else {
        throw new Error("Database query failed: Unknown error");
      }
    }
  }

  static async getRepaymentScheduleByLoan(
    loanId: string,
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    // Verify loan access
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        deletedAt: true,
        assignedOfficerId: true,
        createdByUserId: true,
        unionId: true,
      },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    // Check permissions based on role
    if (userRole === Role.ADMIN || userRole === Role.SUPERVISOR) {
      // ADMIN and SUPERVISOR can view all loan schedules
      console.log(`${userRole} user - allowing access to loan schedule:`, loanId);
    } else if (userRole === Role.CREDIT_OFFICER && userId) {
      // Credit officer can view schedules for loans in their unions
      // Get all unions managed by this credit officer
      const userUnions = await prisma.union.findMany({
        where: {
          creditOfficerId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      const unionIds = userUnions.map(u => u.id);

      if (!unionIds.includes(loan.unionId)) {
        throw new Error(
          "You do not have permission to view this loan's schedule"
        );
      }
      console.log("CREDIT_OFFICER user - allowing access to loan schedule:", loanId);
    } else {
      // Unknown role - deny access
      throw new Error(
        "You do not have permission to view this loan's schedule"
      );
    }

    // Fetch full loan details with all relations after permission check
    const fullLoanData = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        unionMember: true,
        union: true,
        loanType: true,
        assignedOfficer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const schedule = await prisma.repaymentScheduleItem.findMany({
      where: {
        loanId,
        deletedAt: null,
      },
      include: {
        allocations: {
          include: {
            repayment: {
              select: {
                id: true,
                amount: true,
                method: true,
                paidAt: true,
                reference: true,
                notes: true,
                receivedBy: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { sequence: "asc" },
    });

    // Transform unionMember to customer for frontend compatibility
    const loanWithCustomer = fullLoanData ? {
      ...fullLoanData,
      customer: fullLoanData.unionMember,
      branch: fullLoanData.union,
    } : null;

    return {
      loan: loanWithCustomer,
      schedule,
    };
  }

  static async getRepaymentSummary(
    filters: {
      loanId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    const where: any = {
      deletedAt: null,
    };

    // Apply filters
    if (filters.loanId) {
      where.loanId = filters.loanId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.paidAt = {};
      if (filters.dateFrom) {
        where.paidAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.paidAt.lte = new Date(filters.dateTo);
      }
    }

    // Apply role-based filtering
    // ADMIN and SUPERVISOR can see all - no filtering needed
    if (userRole === Role.CREDIT_OFFICER && userId) {
      // Get all unions managed by this credit officer
      const userUnions = await prisma.union.findMany({
        where: {
          creditOfficerId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      const unionIds = userUnions.map(u => u.id);

      if (unionIds.length > 0) {
        where.loan = {
          unionId: { in: unionIds },
        };
      } else {
        // Credit officer has no unions
        where.loan = {
          id: "no-unions-assigned",
        };
      }
    }

    const [totalRepayments, totalAmount, methodBreakdown, recentRepayments] =
      await Promise.all([
        prisma.repayment.count({ where }),
        prisma.repayment.aggregate({
          where,
          _sum: { amount: true },
        }),
        prisma.repayment.groupBy({
          by: ["method"],
          where,
          _sum: { amount: true },
          _count: true,
        }),
        prisma.repayment.findMany({
          where,
          include: {
            loan: {
              include: {
                unionMember: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { paidAt: "desc" },
          take: 5,
        }),
      ]);

    return {
      totalRepayments,
      totalAmount: totalAmount._sum.amount || 0,
      methodBreakdown,
      recentRepayments,
    };
  }
}
