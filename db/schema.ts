import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const guideRequests = sqliteTable(
  "guide_requests",
  {
    requestId: text("request_id").primaryKey(),
    viewerHash: text("viewer_hash").notNull(),
    createdAt: integer("created_at").notNull(),
    reservedMicrousd: integer("reserved_microusd").notNull(),
    status: text("status").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    errorCode: text("error_code"),
  },
  (table) => [
    index("idx_guide_requests_viewer_created").on(
      table.viewerHash,
      table.createdAt,
    ),
    index("idx_guide_requests_created").on(table.createdAt),
  ],
);

export const guideBudgetTotals = sqliteTable("guide_budget_totals", {
  scope: text("scope").primaryKey(),
  reservedMicrousd: integer("reserved_microusd").notNull(),
  requestCount: integer("request_count").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
