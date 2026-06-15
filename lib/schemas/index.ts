import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import {
  committeeAssignments,
  committeeRoleEnum,
  committees,
  companies,
  companyCategoryEnum,
  events,
  eventStatusEnum,
  exhibitorRegistrations,
  exhibitorRegistrationStatusEnum,
  memberships,
  membershipCategoryEnum,
  membershipStatusEnum,
  people,
  sizeClassificationEnum,
  titleEnum,
  userRoleEnum,
  users,
} from "../../db/schema";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    coerce: {
      date: true,
    },
  });

const digitsOnlyRegex = /^\d+$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isoDateStringSchema = z.coerce
  .date()
  .transform((date) => date.toISOString());

export const companyCategorySchema = createSelectSchema(companyCategoryEnum);
export const sizeClassificationSchema = createSelectSchema(
  sizeClassificationEnum,
);
export const titleSchema = createSelectSchema(titleEnum);
export const userRoleSchema = createSelectSchema(userRoleEnum);
export const committeeRoleSchema = createSelectSchema(committeeRoleEnum);
export const eventStatusSchema = createSelectSchema(eventStatusEnum);
export const exhibitorRegistrationStatusSchema = createSelectSchema(
  exhibitorRegistrationStatusEnum,
);
export const membershipStatusSchema = createSelectSchema(membershipStatusEnum);
export const membershipCategorySchema = createSelectSchema(
  membershipCategoryEnum,
);

export const companyAddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().length(3, "Use ISO 3166-1 alpha-3 country code"),
  type: z.enum(["primary", "alternate"]),
});

export const currentEmploymentSchema = z.object({
  companyId: z.uuid("Company ID is required"),
  designation: z.string().min(1, "Designation is required"),
  startDate: isoDateStringSchema,
});

export const employmentHistorySchema = currentEmploymentSchema
  .extend({
    endDate: isoDateStringSchema.optional(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const boothTypeSchema = z.object({
  name: z.string().min(1, "Booth name is required"),
  dimensions: z.string().min(1, "Dimensions are required"),
  price: z.number().positive("Price must be greater than 0"),
});

export const outreachLogEntrySchema = z.object({
  date: isoDateStringSchema,
  staffId: z.uuid("Staff ID is required"),
  note: z.string().max(5000).optional(),
  outcome: z.string().max(500).optional(),
});

const companyRefinements = {
  legacyId: () => z.number().int(),
  name: () => z.string().min(1, "Company name is required").max(200),
  coreBusiness: () => z.string().max(2000),
  website: () => z.string().url("Must be a valid URL"),
  foreignOwnershipDetail: () => z.string().max(500),
  employeeCount: () => z.number().int().nonnegative(),
  generalEmail: () => z.string().email("Must be a valid email"),
  phone: () =>
    z
      .array(
        z.string().regex(digitsOnlyRegex, "Phone must contain digits only"),
      )
      .default([]),
  addresses: () => z.array(companyAddressSchema).default([]),
  keyContactPersonId: () => z.uuid("Key contact person ID must be a UUID"),
  notes: () => z.string().max(5000),
};

const personRefinements = {
  firstName: () => z.string().min(1, "First name is required").max(100),
  lastName: () => z.string().min(1, "Last name is required").max(100),
  email: () => z.string().email("Must be a valid email"),
  alternateEmails: () =>
    z.array(z.string().email("Must be a valid email")).default([]),
  mobile: () =>
    z.string().regex(digitsOnlyRegex, "Mobile number must contain digits only"),
  phone: () =>
    z.string().regex(digitsOnlyRegex, "Phone number must contain digits only"),
  currentEmployment: () => currentEmploymentSchema,
  employmentHistory: () => z.array(employmentHistorySchema).default([]),
};

const userRefinements = {
  personId: () => z.uuid("Person ID is required"),
  email: () => z.string().email("Must be a valid email"),
  passwordHash: () => z.string().min(1, "Password hash is required"),
};

const committeeRefinements = {
  name: () => z.string().min(1, "Committee name is required"),
  slug: () =>
    z
      .string()
      .min(1, "Slug is required")
      .regex(slugRegex, "Must be URL-friendly"),
  description: () => z.string().max(1000),
  parentCommitteeId: () => z.uuid("Parent committee ID must be a UUID"),
};

const committeeAssignmentRefinements = {
  personId: () => z.uuid("Person ID is required"),
  subCommitteeId: () => z.uuid("Committee ID is required"),
  startDate: () => z.coerce.date(),
  endDate: () => z.coerce.date(),
  notes: () => z.string().max(1000),
};

const eventRefinements = {
  name: () => z.string().min(1, "Event name is required"),
  startDate: () => z.coerce.date(),
  endDate: () => z.coerce.date(),
  boothTypes: () => z.array(boothTypeSchema).default([]),
};

const exhibitorRegistrationRefinements = {
  eventId: () => z.uuid("Event ID is required"),
  companyId: () => z.uuid("Company ID is required"),
  boothNumber: () => z.string().min(1, "Booth number is required"),
  boothType: () => z.string().min(1, "Booth type is required"),
  primaryContactPersonId: () => z.uuid("Primary contact person ID is required"),
  outreachLog: () => z.array(outreachLogEntrySchema).default([]),
};

const membershipRefinements = {
  companyId: () => z.uuid("Company ID is required"),
  year: () => z.number().int().min(1, "Year is required"),
  approvedAt: () => z.coerce.date(),
  cancelledAt: () => z.coerce.date(),
};

const validDateRange = (data: {
  startDate?: Date | null;
  endDate?: Date | null;
}) => !data.startDate || !data.endDate || data.endDate >= data.startDate;

export const companySelectSchema = createSelectSchema(
  companies,
  companyRefinements,
);
export const companyInsertSchema = createInsertSchema(
  companies,
  companyRefinements,
);
export const companyUpdateSchema = createUpdateSchema(
  companies,
  companyRefinements,
);

export const personSelectSchema = createSelectSchema(people, personRefinements);
export const personInsertSchema = createInsertSchema(people, personRefinements);
export const personUpdateSchema = createUpdateSchema(people, personRefinements);

export const userSelectSchema = createSelectSchema(users, userRefinements);
export const userInsertSchema = createInsertSchema(users, userRefinements);
export const userUpdateSchema = createUpdateSchema(users, userRefinements);

export const committeeSelectSchema = createSelectSchema(
  committees,
  committeeRefinements,
);
export const committeeInsertSchema = createInsertSchema(
  committees,
  committeeRefinements,
);
export const committeeUpdateSchema = createUpdateSchema(
  committees,
  committeeRefinements,
);

export const committeeAssignmentSelectSchema = createSelectSchema(
  committeeAssignments,
  committeeAssignmentRefinements,
).refine(validDateRange, {
  message: "End date must be after start date",
  path: ["endDate"],
});
export const committeeAssignmentInsertSchema = createInsertSchema(
  committeeAssignments,
  committeeAssignmentRefinements,
).refine(validDateRange, {
  message: "End date must be after start date",
  path: ["endDate"],
});
export const committeeAssignmentUpdateSchema = createUpdateSchema(
  committeeAssignments,
  committeeAssignmentRefinements,
).refine(validDateRange, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const eventSelectSchema = createSelectSchema(
  events,
  eventRefinements,
).refine(validDateRange, {
  message: "End date must be after start date",
  path: ["endDate"],
});
export const eventInsertSchema = createInsertSchema(
  events,
  eventRefinements,
).refine(validDateRange, {
  message: "End date must be after start date",
  path: ["endDate"],
});
export const eventUpdateSchema = createUpdateSchema(
  events,
  eventRefinements,
).refine(validDateRange, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const exhibitorRegistrationSelectSchema = createSelectSchema(
  exhibitorRegistrations,
  exhibitorRegistrationRefinements,
);
export const exhibitorRegistrationInsertSchema = createInsertSchema(
  exhibitorRegistrations,
  exhibitorRegistrationRefinements,
);
export const exhibitorRegistrationUpdateSchema = createUpdateSchema(
  exhibitorRegistrations,
  exhibitorRegistrationRefinements,
);

export const membershipSelectSchema = createSelectSchema(
  memberships,
  membershipRefinements,
);
export const membershipInsertSchema = createInsertSchema(
  memberships,
  membershipRefinements,
);
export const membershipUpdateSchema = createUpdateSchema(
  memberships,
  membershipRefinements,
);

export type CompanyInsertInput = z.infer<typeof companyInsertSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
export type PersonInsertInput = z.infer<typeof personInsertSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
export type UserInsertInput = z.infer<typeof userInsertSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type CommitteeInsertInput = z.infer<typeof committeeInsertSchema>;
export type CommitteeUpdateInput = z.infer<typeof committeeUpdateSchema>;
export type CommitteeAssignmentInsertInput = z.infer<
  typeof committeeAssignmentInsertSchema
>;
export type CommitteeAssignmentUpdateInput = z.infer<
  typeof committeeAssignmentUpdateSchema
>;
export type EventInsertInput = z.infer<typeof eventInsertSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type ExhibitorRegistrationInsertInput = z.infer<
  typeof exhibitorRegistrationInsertSchema
>;
export type ExhibitorRegistrationUpdateInput = z.infer<
  typeof exhibitorRegistrationUpdateSchema
>;
export type MembershipInsertInput = z.infer<typeof membershipInsertSchema>;
export type MembershipUpdateInput = z.infer<typeof membershipUpdateSchema>;
