import { Decimal } from "@prisma/client/runtime/library";
import { Role, LoanStatus, TermUnit, ScheduleStatus } from "@prisma/client";
import prisma from "../prismaClient";

interface CreateLoanData {
  unionMemberId: string;
  loanTypeId?: string;
  principalAmount: number;
  termCount: number;
  termUnit: TermUnit;
  startDate: string;
  processingFeeAmount: number;
  penaltyFeePerDayAmount: number;
  interestRate?: number;
  notes?: string;
  assignedOfficerId?: string;
}

interface UpdateLoanData {
  loanTypeId?: string;
  principalAmount?: number;
  termCount?: number;
  termUnit?: TermUnit;
  startDate?: string;
  processingFeeAmount?: number;
  penaltyFeePerDayAmount?: number;
  notes?: string;
}

export class LoanService {
  static async createLoan(
    data: CreateLoanData,
    userId: string,
    userUnionId: string | null,
    userRole: Role
  ) {
    // Validate union member
    const unionMember = await prisma.unionMember.findUnique({
      where: { id: data.unionMemberId },
      include: { union: true },
    });

    if (!unionMember || unionMember.deletedAt) {
      throw new Error("Union member not found");
    }

    // Validate loan type if provided
    if (data.loanTypeId) {
      const loanType = await prisma.loanType.findUnique({
        where: { id: data.loanTypeId },
      });

      if (!loanType || loanType.deletedAt || !loanType.isActive) {
        throw new Error("Loan type not found or inactive");
      }

      // Validate amount within loan type limits
      const amount = new Decimal(data.principalAmount);
      if (amount.lt(loanType.minAmount) || amount.gt(loanType.maxAmount)) {
        throw new Error(
          `Principal amount must be between ${loanType.minAmount} and ${loanType.maxAmount}`
        );
      }
    }

    // Check for active loans for this union member
    const activeLoan = await prisma.loan.findFirst({
      where: {
        unionMemberId: data.unionMemberId,
        status: {
          in: [
            LoanStatus.ACTIVE,
            LoanStatus.PENDING_APPROVAL,
            LoanStatus.APPROVED,
          ],
        },
        deletedAt: null,
      },
    });

    if (activeLoan) {
      throw new Error("Union member already has an active loan");
    }

    // Generate loan number
    const lastLoan = await prisma.loan.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastLoan?.loanNumber) {
      const lastNumber = parseInt(lastLoan.loanNumber.replace("LN", ""));
      nextNumber = lastNumber + 1;
    }

    const loanNumber = `LN${String(nextNumber).padStart(8, "0")}`;

    // Calculate end date
    const startDate = new Date(data.startDate);
    const endDate = this.calculateEndDate(
      startDate,
      data.termCount,
      data.termUnit
    );

    // Determine initial loan status based on user role
    let initialStatus: LoanStatus = LoanStatus.DRAFT;
    if (userRole === Role.ADMIN) {
      initialStatus = LoanStatus.ACTIVE; // Admin-created loans are active immediately
    } else if (userRole === Role.CREDIT_OFFICER) {
      initialStatus = LoanStatus.PENDING_APPROVAL; // Credit officer loans need approval
    }

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        loanNumber,
        unionMemberId: data.unionMemberId,
        unionId: unionMember.union.id,
        loanTypeId: data.loanTypeId,
        principalAmount: new Decimal(data.principalAmount),
        termCount: data.termCount,
        termUnit: data.termUnit,
        startDate,
        endDate,
        processingFeeAmount: new Decimal(data.processingFeeAmount),
        penaltyFeePerDayAmount: new Decimal(data.penaltyFeePerDayAmount),
        status: initialStatus,
        notes: data.notes,
        createdByUserId: userId,
        assignedOfficerId: data.assignedOfficerId ?? null,
      },
      include: {
        unionMember: true,
        union: true,
        loanType: true,
      },
    });

    // Generate repayment schedule
    try {
      console.log("Generating repayment schedule for loan:", loan.id);
      console.log("Loan data:", {
        principalAmount: data.principalAmount,
        termCount: data.termCount,
        termUnit: data.termUnit,
        startDate: startDate,
        interestRate: 0, // Default interest rate since it's not stored in the loan model
      });

      await this.generateRepaymentSchedule(
        loan.id,
        data.principalAmount,
        data.termCount,
        data.termUnit,
        startDate,
        0 // Default interest rate since it's not stored in the loan model
      );

      console.log(
        "✅ Repayment schedule generated successfully for loan:",
        loan.id
      );
    } catch (error) {
      console.error(
        "❌ Failed to generate repayment schedule for loan:",
        loan.id,
        error
      );
      console.error("Error details:", error);

      // For now, don't throw error to prevent loan creation from failing
      // The repayment schedule can be generated later using the generateMissingSchedules method
      // TODO: Consider making schedule generation mandatory for certain loan statuses
    }

    return loan;
  }

  static calculateEndDate(
    startDate: Date,
    termCount: number,
    termUnit: TermUnit
  ): Date {
    const endDate = new Date(startDate);

    switch (termUnit) {
      case TermUnit.DAY:
        endDate.setDate(endDate.getDate() + termCount);
        break;
      case TermUnit.WEEK:
        endDate.setDate(endDate.getDate() + termCount * 7);
        break;
      case TermUnit.MONTH:
        endDate.setMonth(endDate.getMonth() + termCount);
        break;
    }

    return endDate;
  }

  static async generateRepaymentSchedule(
    loanId: string,
    principalAmount: number,
    termCount: number,
    termUnit: TermUnit,
    startDate: Date,
    interestRate: number
  ) {
    console.log("generateRepaymentSchedule called with:", {
      loanId,
      principalAmount,
      termCount,
      termUnit,
      startDate,
      interestRate,
    });

    const principal = new Decimal(principalAmount);
    const principalPerPayment = principal.div(termCount);

    // Calculate total interest
    const annualRate = new Decimal(interestRate).div(100);
    const totalInterest = principal
      .mul(annualRate)
      .mul(this.getYearFraction(termCount, termUnit));
    const interestPerPayment = totalInterest.div(termCount);

    console.log("Calculated values:", {
      principal: principal.toString(),
      principalPerPayment: principalPerPayment.toString(),
      annualRate: annualRate.toString(),
      totalInterest: totalInterest.toString(),
      interestPerPayment: interestPerPayment.toString(),
    });

    const scheduleItems = [];

    for (let i = 1; i <= termCount; i++) {
      const dueDate = new Date(startDate);

      switch (termUnit) {
        case TermUnit.DAY:
          dueDate.setDate(dueDate.getDate() + i);
          break;
        case TermUnit.WEEK:
          dueDate.setDate(dueDate.getDate() + i * 7);
          break;
        case TermUnit.MONTH:
          dueDate.setMonth(dueDate.getMonth() + i);
          break;
      }

      const totalDue = principalPerPayment.plus(interestPerPayment);

      scheduleItems.push({
        loanId,
        sequence: i,
        dueDate,
        principalDue: principalPerPayment,
        interestDue: interestPerPayment,
        feeDue: new Decimal(0),
        totalDue,
        paidAmount: new Decimal(0),
        status: ScheduleStatus.PENDING,
      });
    }

    console.log(
      "Creating repayment schedule items:",
      scheduleItems.length,
      "items"
    );
    console.log("First few items:", scheduleItems.slice(0, 3));

    const result = await prisma.repaymentScheduleItem.createMany({
      data: scheduleItems,
    });

    console.log(
      "Repayment schedule items created:",
      result.count,
      "items for loan:",
      loanId
    );
  }

  static getYearFraction(termCount: number, termUnit: TermUnit): Decimal {
    switch (termUnit) {
      case TermUnit.DAY:
        return new Decimal(termCount).div(365);
      case TermUnit.WEEK:
        return new Decimal(termCount).mul(7).div(365);
      case TermUnit.MONTH:
        return new Decimal(termCount).div(12);
      default:
        return new Decimal(termCount).div(365); // Default to daily
    }
  }

  static async getLoans(
    filters: {
      page?: number;
      limit?: number;
      status?: LoanStatus;
      unionId?: string;
      unionMemberId?: string;
      search?: string;
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
        where.unionId = { in: unionIds };
      } else {
        // Credit officer has no unions, return empty result
        where.unionId = "no-unions-assigned";
      }
    }

    // Apply additional filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.unionId) {
      where.unionId = filters.unionId;
    }

    if (filters.unionMemberId) {
      where.unionMemberId = filters.unionMemberId;
    }

    if (filters.search) {
      where.OR = [
        { loanNumber: { contains: filters.search, mode: "insensitive" } },
        {
          unionMember: {
            firstName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          unionMember: {
            lastName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          unionMember: { code: { contains: filters.search, mode: "insensitive" } },
        },
      ];
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          unionMember: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          loanType: {
            select: {
              id: true,
              name: true,
            },
          },
          union: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedOfficer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          // Include schedule items to calculate totalPaid and totalOutstanding
          scheduleItems: {
            where: { deletedAt: null },
            select: {
              paidAmount: true,
            },
          },
          _count: {
            select: {
              repayments: true,
              scheduleItems: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.loan.count({ where }),
    ]);

    // Transform loans to include totalPaid and totalOutstanding
    const loansWithPaymentInfo = loans.map((loan: any) => {
      const totalPaid = loan.scheduleItems.reduce(
        (sum: number, item: any) => sum + parseFloat(item.paidAmount || 0),
        0
      );
      const principalAmount = parseFloat(loan.principalAmount || 0);
      const totalOutstanding = Math.max(0, principalAmount - totalPaid);

      return {
        ...loan,
        totalPaid,
        totalOutstanding,
        // Remove scheduleItems from response to keep it clean (already have _count)
        scheduleItems: undefined,
      };
    });

    return { loans: loansWithPaymentInfo, total, page, limit };
  }

  static async getLoanById(
    id: string,
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    // First fetch the loan to check its status
    const loanBasic = await prisma.loan.findUnique({
      where: { id },
      select: { status: true, deletedAt: true, unionId: true },
    });

    if (!loanBasic || loanBasic.deletedAt) {
      throw new Error("Loan not found");
    }

    // Only include scheduleItems and repayments for APPROVED or ACTIVE loans
    const includeScheduleData =
      loanBasic.status === LoanStatus.APPROVED ||
      loanBasic.status === LoanStatus.ACTIVE ||
      loanBasic.status === LoanStatus.COMPLETED ||
      loanBasic.status === LoanStatus.DEFAULTED;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        unionMember: true,
        loanType: true,
        union: {
          include: {
            creditOfficer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        scheduleItems: includeScheduleData ? {
          where: { deletedAt: null },
          orderBy: { sequence: "asc" },
        } : false,
        repayments: includeScheduleData ? {
          where: { deletedAt: null },
          include: {
            receivedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { paidAt: "desc" },
          take: 10,
        } : false,
        documents: {
          where: { deletedAt: null },
          include: {
            documentType: true,
          },
        },
        _count: {
          select: {
            repayments: true,
            scheduleItems: true,
            documents: true,
          },
        },
      },
    });

    if (!loan) {
      throw new Error("Loan not found");
    }

    // Permission check based on role
    if (userRole === Role.ADMIN) {
      // ADMIN can view all loans - no restrictions
      console.log("ADMIN user - allowing access to loan:", id);
    } else if (userRole === Role.SUPERVISOR) {
      // SUPERVISOR can view all loans - they supervise credit officers
      console.log("SUPERVISOR user - allowing access to loan:", id);
    } else if (userRole === Role.CREDIT_OFFICER && userId) {
      // CREDIT_OFFICER can only view loans in their union(s)
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
        throw new Error("You do not have permission to view this loan");
      }
      console.log(
        "CREDIT_OFFICER user - allowing access to loan in union:",
        loan.unionId
      );
    }

    return loan;
  }

  static async updateLoan(
    id: string,
    data: UpdateLoanData,
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    // Only drafts and pending approval loans can be updated
    if (
      loan.status !== LoanStatus.DRAFT &&
      loan.status !== LoanStatus.PENDING_APPROVAL
    ) {
      throw new Error("Only draft and pending approval loans can be updated");
    }

    // Permission check based on role
    if (userRole === Role.ADMIN) {
      // ADMIN can update all loans - no restrictions
      console.log("ADMIN user - allowing update to loan:", id);
    } else if (userRole === Role.CREDIT_OFFICER && userId) {
      // CREDIT_OFFICER can only update loans in their union(s)
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
        throw new Error("You do not have permission to update this loan");
      }
      console.log(
        "CREDIT_OFFICER user - allowing update to loan in union:",
        loan.unionId
      );
    } else if (userRole === Role.SUPERVISOR) {
      // SUPERVISOR cannot edit loans - view only
      throw new Error("Supervisors cannot edit loans");
    }

    // Validate loan type if changing
    if (data.loanTypeId) {
      const loanType = await prisma.loanType.findUnique({
        where: { id: data.loanTypeId },
      });

      if (!loanType || loanType.deletedAt || !loanType.isActive) {
        throw new Error("Loan type not found or inactive");
      }

      const amount = data.principalAmount
        ? new Decimal(data.principalAmount)
        : loan.principalAmount;
      if (amount.lt(loanType.minAmount) || amount.gt(loanType.maxAmount)) {
        throw new Error(
          `Principal amount must be between ${loanType.minAmount} and ${loanType.maxAmount}`
        );
      }
    }

    const updateData: any = {};

    if (data.loanTypeId) updateData.loanTypeId = data.loanTypeId;
    if (data.principalAmount)
      updateData.principalAmount = new Decimal(data.principalAmount);
    if (data.termCount) updateData.termCount = data.termCount;
    if (data.termUnit) updateData.termUnit = data.termUnit;
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
      updateData.endDate = this.calculateEndDate(
        new Date(data.startDate),
        data.termCount || loan.termCount,
        data.termUnit || loan.termUnit
      );
    }
    if (data.processingFeeAmount !== undefined)
      updateData.processingFeeAmount = new Decimal(data.processingFeeAmount);
    if (data.penaltyFeePerDayAmount !== undefined)
      updateData.penaltyFeePerDayAmount = new Decimal(
        data.penaltyFeePerDayAmount
      );
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: updateData,
      include: {
        unionMember: true,
        union: true,
        loanType: true,
      },
    });

    // Regenerate schedule if amount or terms changed
    if (
      data.principalAmount ||
      data.termCount ||
      data.termUnit ||
      data.startDate
    ) {
      await prisma.repaymentScheduleItem.deleteMany({
        where: { loanId: id },
      });

      await this.generateRepaymentSchedule(
        id,
        updatedLoan.principalAmount.toNumber(),
        updatedLoan.termCount,
        updatedLoan.termUnit,
        updatedLoan.startDate,
        0
      );
    }

    return updatedLoan;
  }
  static async updateLoanStatus(
    id: string,
    newStatus: LoanStatus,
    notes: string | undefined,
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    // Permission check based on role
    if (userRole === Role.ADMIN) {
      // ADMIN can update status of all loans - no restrictions
      console.log("ADMIN user - allowing status update of loan:", id);
    } else if (userRole === Role.CREDIT_OFFICER) {
      // CREDIT_OFFICER cannot change loan status
      throw new Error(
        "Credit officers cannot change loan status. Contact your union manager."
      );
    }

    // Validate status transitions
    this.validateStatusTransition(loan.status, newStatus);

    const updateData: any = {
      status: newStatus,
    };

    if (notes) {
      updateData.notes = loan.notes ? `${loan.notes}\n\n${notes}` : notes;
    }

    // Set processingFeeCollected to true when loan is approved
    if (newStatus === LoanStatus.APPROVED) {
      updateData.processingFeeCollected = true;
    }

    if (
      newStatus === LoanStatus.COMPLETED ||
      newStatus === LoanStatus.WRITTEN_OFF ||
      newStatus === LoanStatus.CANCELED
    ) {
      updateData.closedAt = new Date();
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: updateData,
      include: {
        unionMember: true,
        union: true,
        loanType: true,
      },
    });

    return updatedLoan;
  }

  static validateStatusTransition(
    currentStatus: LoanStatus,
    newStatus: LoanStatus
  ) {
    const validTransitions: Record<LoanStatus, LoanStatus[]> = {
      DRAFT: [
        LoanStatus.PENDING_APPROVAL,
        LoanStatus.APPROVED,
        LoanStatus.CANCELED,
      ],
      PENDING_APPROVAL: [LoanStatus.APPROVED, LoanStatus.CANCELED],
      APPROVED: [LoanStatus.ACTIVE, LoanStatus.CANCELED],
      ACTIVE: [
        LoanStatus.COMPLETED,
        LoanStatus.DEFAULTED,
        LoanStatus.WRITTEN_OFF,
      ],
      COMPLETED: [],
      DEFAULTED: [LoanStatus.WRITTEN_OFF, LoanStatus.ACTIVE],
      WRITTEN_OFF: [],
      CANCELED: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  static async disburseLoan(
    id: string,
    disbursedAt: Date | undefined,
    userRole: Role,
    userUnionId?: string
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        unionMember: true,
      },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    if (loan.status !== LoanStatus.APPROVED) {
      throw new Error("Only approved loans can be disbursed");
    }

    // Permission check based on role
    if (userRole === Role.ADMIN) {
      // ADMIN can disburse all loans - no restrictions
      console.log("ADMIN user - allowing disbursement of loan:", id);
    } else if (userRole === Role.CREDIT_OFFICER) {
      // CREDIT_OFFICER cannot disburse loans
      throw new Error("Only union managers and admins can disburse loans");
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.ACTIVE,
        disbursedAt: disbursedAt || new Date(),
      },
      include: {
        unionMember: true,
        union: true,
        loanType: true,
      },
    });

    return updatedLoan;
  }

  static async assignLoan(
    id: string,
    newOfficerId: string,
    reason: string | undefined,
    changedByUserId: string,
    userRole: Role,
    userUnionId?: string
  ) {
    // Loan assignment feature has been deprecated in the new Union-based system
    // Loans are now assigned by union membership, not individual officers
    throw new Error(
      "Loan assignment has been deprecated. Use union-based access control instead."
    );
  }

  static async deleteLoan(
    id: string,
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    // Only drafts and pending approvals can be deleted
    if (
      loan.status !== LoanStatus.DRAFT &&
      loan.status !== LoanStatus.PENDING_APPROVAL
    ) {
      throw new Error("Only draft or pending approval loans can be deleted");
    }

    // Permission check based on role
    if (userRole === Role.ADMIN) {
      // ADMIN can delete all loans - no restrictions
      console.log("ADMIN user - allowing delete of loan:", id);
    } else if (userRole === Role.CREDIT_OFFICER) {
      // CREDIT_OFFICER can only delete loans they are assigned to
      throw new Error("You do not have permission to delete this loan");
    }

    // Soft delete
    await prisma.loan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  static async getLoanSchedule(
    id: string,
    userRole: Role,
    userUnionId?: string,
    userId?: string
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
        assignedOfficerId: true,
        createdByUserId: true,
        unionId: true,
        status: true,
      },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    // Only return schedules for APPROVED, ACTIVE, COMPLETED, or DEFAULTED loans
    const allowedStatuses: LoanStatus[] = [
      LoanStatus.APPROVED,
      LoanStatus.ACTIVE,
      LoanStatus.COMPLETED,
      LoanStatus.DEFAULTED,
    ];

    if (!allowedStatuses.includes(loan.status)) {
      throw new Error(
        "Repayment schedule is only available for approved or active loans"
      );
    }

    // Permission check based on role
    if (userRole === Role.ADMIN) {
      // ADMIN can view all loans
      console.log("ADMIN user - allowing access to loan:", id);
    } else if (userRole === Role.SUPERVISOR) {
      // SUPERVISOR can view all loan schedules - they supervise credit officers
      console.log("SUPERVISOR user - allowing access to loan schedule:", id);
    } else if (userRole === Role.CREDIT_OFFICER && userId) {
      // CREDIT_OFFICER can view loans in their unions
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
        throw new Error("You do not have permission to view this loan");
      }
      console.log("CREDIT_OFFICER user - allowing access to loan schedule:", id);
    } else {
      // Unknown role - deny access
      throw new Error("You do not have permission to view this loan");
    }

    const scheduleItems = await prisma.repaymentScheduleItem.findMany({
      where: {
        loanId: id,
        deletedAt: null,
      },
      include: {
        allocations: {
          include: {
            repayment: {
              select: {
                id: true,
                amount: true,
                paidAt: true,
                method: true,
              },
            },
          },
        },
      },
      orderBy: { sequence: "asc" },
    });

    return scheduleItems;
  }

  static async getLoanSummary(id: string) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        scheduleItems: {
          where: { deletedAt: null },
        },
        repayments: {
          where: { deletedAt: null },
        },
      },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    // Debug logging
    console.log("=== getLoanSummary DEBUG ===");
    console.log("Loan ID:", id);
    console.log("Schedule Items count:", loan.scheduleItems.length);
    console.log("Repayments count:", loan.repayments.length);

    // Calculate total paid from schedule items (this is the source of truth for paid amounts)
    // The paidAmount field on RepaymentScheduleItem gets updated when allocations are made
    const totalPaidFromSchedule = loan.scheduleItems.reduce(
      (sum: Decimal, item: any) => {
        const paidAmount = new Decimal(item.paidAmount || 0);
        console.log(
          `Schedule Item ${
            item.sequence
          }: paidAmount = ${paidAmount.toString()}`
        );
        return sum.plus(paidAmount);
      },
      new Decimal(0)
    );

    console.log(
      "Total paid (from schedule items):",
      totalPaidFromSchedule.toString()
    );

    // Also log repayments for verification
    const repaymentTotal = loan.repayments.reduce(
      (sum: Decimal, payment: any) =>
        sum.plus(new Decimal(payment.amount || 0)),
      new Decimal(0)
    );
    console.log(
      "Total from repayments table (for verification):",
      repaymentTotal.toString()
    );

    // Total outstanding = Principal Amount - Total Paid
    const totalOutstanding = new Decimal(loan.principalAmount).minus(
      totalPaidFromSchedule
    );

    // Total expected = Principal + all interest and fees from schedule items
    const totalExpected = loan.scheduleItems.reduce(
      (sum: Decimal, item: any) => sum.plus(item.totalDue),
      new Decimal(0)
    );

    const overdueItems = loan.scheduleItems.filter(
      (item: any) => item.status === ScheduleStatus.OVERDUE
    );

    const overdueAmount = overdueItems.reduce(
      (sum: Decimal, item: any) =>
        sum.plus(item.totalDue.minus(item.paidAmount)),
      new Decimal(0)
    );

    // Convert Decimal values to numbers for JSON serialization
    const result = {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      principalAmount: parseFloat(new Decimal(loan.principalAmount).toString()),
      totalExpected: parseFloat(totalExpected.toString()),
      totalPaid: parseFloat(totalPaidFromSchedule.toString()),
      totalOutstanding: parseFloat(totalOutstanding.toString()),
      overdueAmount: parseFloat(overdueAmount.toString()),
      overdueCount: overdueItems.length,
      completionPercentage: new Decimal(loan.principalAmount).gt(0)
        ? parseFloat(
            totalPaidFromSchedule
              .div(new Decimal(loan.principalAmount))
              .mul(100)
              .toFixed(2)
          )
        : 0,
      status: loan.status,
    };

    console.log("=== getLoanSummary FINAL RESULT ===");
    console.log("Final summary:", result);

    return result;
  }

  static async generateMissingSchedules() {
    console.log("Checking for loans without repayment schedules...");

    // Find loans that don't have repayment schedules
    const loansWithoutSchedules = await prisma.loan.findMany({
      where: {
        deletedAt: null,
        scheduleItems: {
          none: {
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        loanNumber: true,
        principalAmount: true,
        termCount: true,
        termUnit: true,
        startDate: true,
        status: true,
      },
    });

    console.log(
      `Found ${loansWithoutSchedules.length} loans without repayment schedules`
    );

    let generatedCount = 0;
    let errorCount = 0;

    for (const loan of loansWithoutSchedules) {
      try {
        console.log(
          `Generating schedule for loan ${loan.loanNumber} (${loan.id})`
        );

        await this.generateRepaymentSchedule(
          loan.id,
          loan.principalAmount.toNumber(),
          loan.termCount,
          loan.termUnit,
          loan.startDate,
          0 // Default interest rate since it's not stored in the loan model
        );

        generatedCount++;
        console.log(
          `✅ Successfully generated schedule for loan ${loan.loanNumber}`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Failed to generate schedule for loan ${loan.loanNumber}:`,
          error
        );
      }
    }

    console.log(
      `Schedule generation complete: ${generatedCount} successful, ${errorCount} failed`
    );

    return {
      totalLoans: loansWithoutSchedules.length,
      generatedCount,
      errorCount,
    };
  }

  static async regenerateLoanSchedule(loanId: string) {
    console.log(`Regenerating schedule for loan ${loanId}...`);

    // Get the loan
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        loanNumber: true,
        principalAmount: true,
        termCount: true,
        termUnit: true,
        startDate: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!loan || loan.deletedAt) {
      throw new Error("Loan not found");
    }

    console.log(`Found loan ${loan.loanNumber} with status ${loan.status}`);

    // Delete existing schedules
    const deleted = await prisma.repaymentScheduleItem.deleteMany({
      where: { loanId: loan.id },
    });

    console.log(`Deleted ${deleted.count} existing schedule items`);

    // Generate new schedule
    await this.generateRepaymentSchedule(
      loan.id,
      loan.principalAmount.toNumber(),
      loan.termCount,
      loan.termUnit,
      loan.startDate,
      0 // No interest
    );

    // Get the new schedule items
    const newScheduleItems = await prisma.repaymentScheduleItem.findMany({
      where: { loanId: loan.id, deletedAt: null },
      orderBy: { sequence: "asc" },
    });

    console.log(`✅ Generated ${newScheduleItems.length} new schedule items for loan ${loan.loanNumber}`);

    return {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      deletedCount: deleted.count,
      newScheduleCount: newScheduleItems.length,
      scheduleItems: newScheduleItems,
    };
  }
}
