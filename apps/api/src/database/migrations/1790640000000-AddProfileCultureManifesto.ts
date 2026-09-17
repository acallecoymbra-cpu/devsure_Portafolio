import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfileCultureManifesto1790640000000 implements MigrationInterface {
  name = 'AddProfileCultureManifesto1790640000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({ name: 'culture_manifesto', type: 'text', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'culture_manifesto');
  }
}
