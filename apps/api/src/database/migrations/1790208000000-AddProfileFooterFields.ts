import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const JSON_COLUMNS = ['footer_about_primary', 'footer_about_secondary'] as const;

const VARCHAR_COLUMNS: ReadonlyArray<readonly [string, number]> = [
  ['logo', 255],
  ['phone', 40],
  ['address', 255],
  ['business_hours', 255],
  ['facebook_url', 255],
  ['linkedin_url', 255],
];

export class AddProfileFooterFields1790208000000 implements MigrationInterface {
  name = 'AddProfileFooterFields1790208000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, length] of VARCHAR_COLUMNS) {
      await queryRunner.addColumn(
        'profiles',
        new TableColumn({ name, type: 'varchar', length: String(length), isNullable: true }),
      );
    }
    for (const name of JSON_COLUMNS) {
      await queryRunner.addColumn('profiles', new TableColumn({ name, type: 'text', isNullable: true }));
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of [...JSON_COLUMNS].reverse()) {
      await queryRunner.dropColumn('profiles', name);
    }
    for (const [name] of [...VARCHAR_COLUMNS].reverse()) {
      await queryRunner.dropColumn('profiles', name);
    }
  }
}
