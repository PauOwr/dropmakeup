import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261027173741 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cj_order" drop constraint if exists "cj_order_status_check";`);

    this.addSql(`alter table if exists "cj_order" add column if not exists "logistic_name" text null, add column if not exists "tracking_number" text null, add column if not exists "tracking_url" text null, add column if not exists "tracking_status" integer null, add column if not exists "fulfillment_id" text null;`);
    this.addSql(`alter table if exists "cj_order" add constraint "cj_order_status_check" check("status" in ('pending', 'submitted', 'shipped', 'delivered'));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cj_order_cj_order_id" ON "cj_order" ("cj_order_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "cj_order" drop constraint if exists "cj_order_status_check";`);

    this.addSql(`drop index if exists "IDX_cj_order_cj_order_id";`);
    this.addSql(`alter table if exists "cj_order" drop column if exists "logistic_name", drop column if exists "tracking_number", drop column if exists "tracking_url", drop column if exists "tracking_status", drop column if exists "fulfillment_id";`);

    this.addSql(`alter table if exists "cj_order" add constraint "cj_order_status_check" check("status" in ('pending', 'submitted'));`);
  }

}
