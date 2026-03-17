import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const datasourceUrl = process.env.DATABASE_URL;
    if (!datasourceUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const adapter = new PrismaPg(new Pool({ connectionString: datasourceUrl }));

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
