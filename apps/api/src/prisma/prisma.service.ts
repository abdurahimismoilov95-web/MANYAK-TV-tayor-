import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('✅ PostgreSQL connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ PostgreSQL disconnected');
  }

  async cleanDatabase() {
    // For testing only
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Object.keys(this).filter(
      (key) => !key.startsWith('_') && !key.startsWith('$'),
    );

    return Promise.all(
      models.map((model) => {
        if ((this as any)[model]?.deleteMany) {
          return (this as any)[model].deleteMany();
        }
      }),
    );
  }
}
