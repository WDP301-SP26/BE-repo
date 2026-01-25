import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

class HealthCheckResponse {
  @ApiProperty({
    description: 'Application status',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Current timestamp',
    example: '2026-01-25T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Application uptime in seconds',
    example: 3600,
  })
  uptime: number;

  @ApiProperty({
    description: 'Memory usage',
    example: {
      rss: 50331648,
      heapTotal: 20971520,
      heapUsed: 15728640,
      external: 1024,
    },
  })
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };

  @ApiProperty({
    description: 'Application version',
    example: '1.0.0',
  })
  version: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns the health status of the application including uptime, memory usage, and version information',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    type: HealthCheckResponse,
  })
  check(): HealthCheckResponse {
    const memoryUsage = process.memoryUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('ping')
  @ApiOperation({
    summary: 'Simple ping check',
    description: 'Simple endpoint to verify the API is responsive',
  })
  @ApiResponse({
    status: 200,
    description: 'API is responsive',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'pong',
        },
      },
    },
  })
  ping() {
    return { message: 'pong' };
  }
}
