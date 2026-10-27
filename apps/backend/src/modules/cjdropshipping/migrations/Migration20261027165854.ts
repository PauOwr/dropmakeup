import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261027165854 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cj_order" drop constraint if exists "cj_order_order_id_unique";`);
    this.addSql(`create table if not exists "cj_order" ("id" text not null, "order_id" text not null, "status" text check ("status" in ('pending', 'submitted')) not null default 'pending', "is_sandbox" boolean not null default true, "cj_order_id" text null, "cj_shipment_order_id" text null, "cj_order_status" text null, "amount_paid_usd" numeric null, "raw_amount_paid_usd" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cj_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cj_order_order_id_unique" ON "cj_order" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cj_order_deleted_at" ON "cj_order" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cj_order" cascade;`);
  }

}
