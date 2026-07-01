import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const companyCategoryEnum = pgEnum("company_category", ["A", "B", "C"]);

export const sizeClassificationEnum = pgEnum("size_classification", [
  "Micro",
  "Small",
  "Medium",
  "Large",
]);

export const titleEnum = pgEnum("title", [
  "Mr",
  "Mrs",
  "Miss",
  "Ms",
  "Dr",
  "Prof",
  "Sir",
  "Dame",
  "Rev",
]);

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "staff",
  "committee_char",
  "member_rep",
  "viewer",
]);

export const committeeRoleEnum = pgEnum("committee_role", [
  "Chair",
  "Vice Chair",
  "Member",
  "Other",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "open-for-registration",
  "closed",
  "archived",
]);

export const eventAttendeePassTypeEnum = pgEnum("event_attendee_pass_type", [
  "full-access",
  "meal-only",
  "day-pass",
]);

export const exhibitorRegistrationStatusEnum = pgEnum(
  "exhibitor_registration_status",
  ["purchased", "comp", "sponsor", "declined", "pending"],
);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "cancelled",
  "written-off",
  "pending-approval",
]);

export const membershipCategoryEnum = pgEnum("membership_category", [
  "A",
  "B",
  "C",
]);

export type CompanyAddress = {
  line1: string;
  line2?: string;
  city: string;
  country: string;
  type: "primary" | "alternate";
};

export type CurrentEmployment = {
  companyId: string;
  designation: string;
  startDate: string;
};

export type EmploymentHistory = CurrentEmployment & {
  endDate?: string;
};

export type BoothType = {
  name: string;
  dimensions: string;
  price: number;
};

export type OutreachLogEntry = {
  date: string;
  staffId: string;
  note?: string;
  outcome?: string;
};

export type EventAttendeeDayAccess = Record<string, unknown>;

const auditColumns = () => ({
  createdBy: uuid("created_by").references((): AnyPgColumn => users.id, {
    onDelete: "restrict",
  }),
  updatedBy: uuid("updated_by").references((): AnyPgColumn => users.id, {
    onDelete: "restrict",
  }),
  createdOn: timestamp("created_on", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedOn: timestamp("updated_on", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyId: integer("legacy_id"),
    name: varchar("name", { length: 200 }).notNull(),
    category: companyCategoryEnum("category").notNull(),
    coreBusiness: varchar("core_business", { length: 2000 }),
    website: text("website"),
    usOwned: boolean("us_owned").notNull().default(false),
    foreignOwned: boolean("foreign_owned").notNull().default(false),
    foreignOwnershipDetail: varchar("foreign_ownership_detail", {
      length: 500,
    }),
    employeeCount: integer("employee_count"),
    sizeClassification: sizeClassificationEnum("size_classification"),
    generalEmail: text("general_email"),
    phone: text("phone")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    fax: text("fax"),
    addresses: jsonb("addresses")
      .$type<CompanyAddress[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    keyContactPersonId: uuid("key_contact_person_id").references(
      () => people.id,
      { onDelete: "set null" },
    ),
    notes: varchar("notes", { length: 5000 }),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex("companies_legacy_id_idx").on(table.legacyId),
    index("companies_name_idx").on(table.name),
    index("companies_key_contact_person_id_idx").on(table.keyContactPersonId),
  ],
);

export const people = pgTable(
  "people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    title: titleEnum("title"),
    email: text("email"),
    alternateEmails: text("alternate_emails")
      .array()
      .default(sql`'{}'::text[]`),
    phone: text("phone")
      .array()
      .default(sql`'{}'::text[]`),
    currentEmployment: jsonb(
      "current_employment",
    ).$type<CurrentEmployment | null>(),
    employmentHistory: jsonb("employment_history")
      .$type<EmploymentHistory[]>()
      .default(sql`'[]'::jsonb`),
    ...auditColumns(),
  },
  (table) => [
    index("people_name_idx").on(table.lastName, table.firstName),
    index("people_email_idx").on(table.email),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("viewer"),
    lastLogin: timestamp("last_login", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_person_id_idx").on(table.personId),
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

export const committees = pgTable(
  "committees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: varchar("description", { length: 1000 }),
    parentCommitteeId: uuid("parent_committee_id").references(
      (): AnyPgColumn => committees.id,
      { onDelete: "set null" },
    ),
    isActive: boolean("is_active"),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex("committees_slug_idx").on(table.slug),
    index("committees_parent_committee_id_idx").on(table.parentCommitteeId),
  ],
);

export const committeeAssignments = pgTable(
  "committee_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    committeeId: uuid("committee_id").references(() => committees.id, {
      onDelete: "set null",
    }),
    role: committeeRoleEnum("role").notNull().default("Other"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    notes: varchar("notes", { length: 1000 }),
    ...auditColumns(),
  },
  (table) => [
    index("committee_assignments_person_id_idx").on(table.personId),
    index("committee_assignments_committee_id_idx").on(table.committeeId),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    venue: text("venue"),
    status: eventStatusEnum("status").notNull(),
    boothTypes: jsonb("booth_types")
      .$type<BoothType[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    ...auditColumns(),
  },
  (table) => [
    index("events_status_idx").on(table.status),
    index("events_start_date_idx").on(table.startDate),
  ],
);

export const exhibitorRegistrations = pgTable(
  "exhibitor_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    boothNumber: text("booth_number").notNull(),
    boothType: text("booth_type").notNull(),
    status: exhibitorRegistrationStatusEnum("status")
      .notNull()
      .default("pending"),
    primaryContactPersonId: uuid("primary_contact_person_id")
      .notNull()
      .references(() => people.id, { onDelete: "restrict" }),
    outreachLog: jsonb("outreach_log")
      .$type<OutreachLogEntry[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    ...auditColumns(),
  },
  (table) => [
    index("exhibitor_registrations_event_id_idx").on(table.eventId),
    index("exhibitor_registrations_company_id_idx").on(table.companyId),
    index("exhibitor_registrations_primary_contact_person_id_idx").on(
      table.primaryContactPersonId,
    ),
    uniqueIndex("exhibitor_registrations_event_booth_idx").on(
      table.eventId,
      table.boothNumber,
    ),
  ],
);

export const eventAttendees = pgTable(
  "event_attendees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => exhibitorRegistrations.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "restrict" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    passType: eventAttendeePassTypeEnum("pass_type").notNull(),
    dayAccess: jsonb("day_access")
      .$type<EventAttendeeDayAccess>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    nameTagPrinted: boolean("name_tag_printed").notNull().default(false),
    ...auditColumns(),
  },
  (table) => [
    index("event_attendees_event_id_idx").on(table.eventId),
    index("event_attendees_registration_id_idx").on(table.registrationId),
    index("event_attendees_person_id_idx").on(table.personId),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    status: membershipStatusEnum("status").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    category: membershipCategoryEnum("category").notNull(),
    ...auditColumns(),
  },
  (table) => [
    index("memberships_company_id_idx").on(table.companyId),
    uniqueIndex("memberships_company_year_idx").on(table.companyId, table.year),
  ],
);

export const companiesRelations = relations(companies, ({ many, one }) => ({
  keyContactPerson: one(people, {
    fields: [companies.keyContactPersonId],
    references: [people.id],
  }),
  exhibitorRegistrations: many(exhibitorRegistrations),
  memberships: many(memberships),
}));

export const peopleRelations = relations(people, ({ many, one }) => ({
  userAccount: one(users, {
    fields: [people.id],
    references: [users.personId],
    relationName: "personUserAccount",
  }),
  committeeAssignments: many(committeeAssignments),
  eventAttendances: many(eventAttendees),
  primaryContactRegistrations: many(exhibitorRegistrations),
  keyContactCompanies: many(companies),
}));

export const usersRelations = relations(users, ({ one }) => ({
  person: one(people, {
    fields: [users.personId],
    references: [people.id],
    relationName: "personUserAccount",
  }),
}));

export const committeesRelations = relations(committees, ({ many, one }) => ({
  parentCommittee: one(committees, {
    fields: [committees.parentCommitteeId],
    references: [committees.id],
    relationName: "committeeHierarchy",
  }),
  childCommittees: many(committees, {
    relationName: "committeeHierarchy",
  }),
  assignments: many(committeeAssignments),
}));

export const committeeAssignmentsRelations = relations(
  committeeAssignments,
  ({ one }) => ({
    person: one(people, {
      fields: [committeeAssignments.personId],
      references: [people.id],
    }),
    committee: one(committees, {
      fields: [committeeAssignments.committeeId],
      references: [committees.id],
    }),
  }),
);

export const eventsRelations = relations(events, ({ many }) => ({
  exhibitorRegistrations: many(exhibitorRegistrations),
  attendees: many(eventAttendees),
}));

export const exhibitorRegistrationsRelations = relations(
  exhibitorRegistrations,
  ({ many, one }) => ({
    event: one(events, {
      fields: [exhibitorRegistrations.eventId],
      references: [events.id],
    }),
    company: one(companies, {
      fields: [exhibitorRegistrations.companyId],
      references: [companies.id],
    }),
    primaryContactPerson: one(people, {
      fields: [exhibitorRegistrations.primaryContactPersonId],
      references: [people.id],
    }),
    attendees: many(eventAttendees),
  }),
);

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendees.eventId],
    references: [events.id],
  }),
  registration: one(exhibitorRegistrations, {
    fields: [eventAttendees.registrationId],
    references: [exhibitorRegistrations.id],
  }),
  person: one(people, {
    fields: [eventAttendees.personId],
    references: [people.id],
  }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  company: one(companies, {
    fields: [memberships.companyId],
    references: [companies.id],
  }),
}));

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Committee = typeof committees.$inferSelect;
export type NewCommittee = typeof committees.$inferInsert;
export type CommitteeAssignment = typeof committeeAssignments.$inferSelect;
export type NewCommitteeAssignment = typeof committeeAssignments.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type ExhibitorRegistration = typeof exhibitorRegistrations.$inferSelect;
export type NewExhibitorRegistration =
  typeof exhibitorRegistrations.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type NewEventAttendee = typeof eventAttendees.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
