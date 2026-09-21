import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'MANYAK TV API v2',
      uptime: process.uptime(),
    };
  }

  getVersion(): object {
    return {
      version: '2.0.0',
      name: 'MANYAK TV API',
      description: 'Professional Streaming Platform',
    };
  }
}
