import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTechnologyIcon1790467200000 implements MigrationInterface {
  name = 'AddTechnologyIcon1790467200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'technologies',
      new TableColumn({ name: 'icon', type: 'varchar', length: '255', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('technologies', 'icon');
  }
}
