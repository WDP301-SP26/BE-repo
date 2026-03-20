import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskTable1761000000000 implements MigrationInterface {
  name = 'CreateTaskTable1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."Task_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."Task_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    `);
    await queryRunner.query(`
      CREATE TABLE "Task" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" "public"."Task_status_enum" NOT NULL DEFAULT 'TODO',
        "priority" "public"."Task_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "assignee_id" uuid,
        "due_at" TIMESTAMPTZ,
        "created_by_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_Task_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_TASK_GROUP_ID" ON "Task" ("group_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_TASK_STATUS" ON "Task" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_TASK_ASSIGNEE_ID" ON "Task" ("assignee_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_TASK_GROUP_STATUS" ON "Task" ("group_id", "status")
    `);
    await queryRunner.query(`
      ALTER TABLE "Task"
      ADD CONSTRAINT "FK_Task_group_id" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "Task"
      ADD CONSTRAINT "FK_Task_assignee_id" FOREIGN KEY ("assignee_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "Task"
      ADD CONSTRAINT "FK_Task_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Task" DROP CONSTRAINT "FK_Task_created_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Task" DROP CONSTRAINT "FK_Task_assignee_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Task" DROP CONSTRAINT "FK_Task_group_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_TASK_GROUP_STATUS"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TASK_ASSIGNEE_ID"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TASK_STATUS"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TASK_GROUP_ID"`);
    await queryRunner.query(`DROP TABLE "Task"`);
    await queryRunner.query(`DROP TYPE "public"."Task_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."Task_status_enum"`);
  }
}
