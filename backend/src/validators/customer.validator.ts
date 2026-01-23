import { z } from "zod";

// Custom validator for minimum age (16 years)
const minAgeValidator = (minAge: number) => {
  return z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .optional()
    .refine(
      (date) => {
        if (!date) return true; // Optional, so no date is valid
        const today = new Date();
        const birthDate = new Date(date);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          return age - 1 >= minAge;
        }
        return age >= minAge;
      },
      { message: `Must be at least ${minAge} years old` }
    );
};

export const createCustomerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().min(1, "Phone number is required"),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    dateOfBirth: minAgeValidator(16),
    gender: z.string().optional(),
    maritalStatus: z.string().optional(),
    profession: z.string().optional(),
    company: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    note: z.string().optional(),
    branchId: z.string(),
    currentOfficerId: z.string().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    firstName: z.union([z.string().min(2), z.literal("")]).optional(),
    lastName: z.union([z.string().min(2), z.literal("")]).optional(),
    phone: z
      .union([z.string().min(1, "Phone number is required"), z.literal("")])
      .optional(),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    dateOfBirth: minAgeValidator(16),
    gender: z.string().optional(),
    maritalStatus: z.string().optional(),
    profession: z.string().optional(),
    company: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    note: z.string().optional(),
    branchId: z.string().optional(),
    currentOfficerId: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const reassignCustomerSchema = z.object({
  body: z.object({
    newBranchId: z.string().optional(),
    newOfficerId: z.string().optional(),
    reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});
