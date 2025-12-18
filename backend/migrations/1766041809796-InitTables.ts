import { MigrationInterface, QueryRunner } from "typeorm";

export class InitTables1766041809796 implements MigrationInterface {
    name = 'InitTables1766041809796'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "likes" ("id" SERIAL NOT NULL, "userId" character varying NOT NULL, "postId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_74b9b8cd79a1014e50135f266fe" UNIQUE ("userId", "postId"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "userId" character varying, "postType" character varying NOT NULL, "likes" integer NOT NULL DEFAULT '0', "description" character varying NOT NULL, "anonymous" boolean NOT NULL, "image" character varying, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "harassment_report" ("id" SERIAL NOT NULL, "userId" character varying, "location" character varying NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "vehicleNumber" character varying, "vehicleType" character varying, "vehicleColor" character varying, "vehicleModel" character varying, "harassmentType" character varying, "extraInfo" character varying, "anonymous" boolean NOT NULL, "image" character varying, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_17180296a9d66fea0370180b9d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sos" ("id" SERIAL NOT NULL, "userId" character varying NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "address" character varying, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_eb329f400ba735af187e98faec6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contacts" ("id" SERIAL NOT NULL, "userId" character varying NOT NULL, "name" character varying NOT NULL, "phoneNumber" character varying NOT NULL, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
        await queryRunner.query(`DROP TABLE "sos"`);
        await queryRunner.query(`DROP TABLE "harassment_report"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "likes"`);
    }

}
