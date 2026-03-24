import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJiraIssueFieldsToTask1761100000000 implements MigrationInterface {
  name = 'AddJiraIssueFieldsToTask1761100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Task"
      ADD COLUMN "jira_issue_key" character varying(50)
    `);
    await queryRunner.query(`
      ALTER TABLE "Task"
      ADD COLUMN "jira_issue_id" character varying(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Task"
      DROP COLUMN "jira_issue_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "Task"
      DROP COLUMN "jira_issue_key"
    `);
  }
}
