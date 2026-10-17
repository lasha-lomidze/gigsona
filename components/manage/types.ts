import type { InferSelectModel } from "drizzle-orm";
import type { groups, students } from "@/lib/schema";

export type ManageStudent = InferSelectModel<typeof students> & { displayName: string | null };
export type ManageGroup = InferSelectModel<typeof groups>;
