import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const getDocumentBuilder = () => {
  return (
    new DocumentBuilder()
      .setTitle('WDP301 API Documentation')
      .setDescription('Comprehensive API documentation for the WDP301 project')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addServer('http://localhost:3000', 'Local development')
      // TODO add prod url when deployed
      .build()
  );
};

export const swaggerUiOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true, // Persist auth between page refreshes
    displayRequestDuration: true, // Show request duration
    filter: true, // Enable search/filter
    showExtensions: true,
    showCommonExtensions: true,
    tagsSorter: 'alpha', // Sort tags alphabetically
    operationsSorter: 'alpha', // Sort operations alphabetically
    docExpansion: 'none', // Collapse all by default (none, list, full)
    defaultModelsExpandDepth: 3, // Depth to expand models
    defaultModelExpandDepth: 3,
  },
  customSiteTitle: 'WDP301 API Documentation',
  customfavIcon: 'https://nestjs.com/img/logo-small.svg',
};
