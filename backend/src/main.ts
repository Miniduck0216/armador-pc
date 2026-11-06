import 'dotenv/config'; // lee backend/.env antes que todo lo demás
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { FiltroErrores } from './auth/filtro-errores.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Seguridad básica
  app.use(cookieParser());
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
  });
  app.useGlobalFilters(new FiltroErrores());

  // En desarrollo el frontend (Vite, puerto 5173) reenvía /api a este servidor, así que
  // no hace falta CORS. Si el frontend se publica en otro dominio, se indica aquí.
  if (process.env.FRONTEND_ORIGEN) {
    app.enableCors({ origin: process.env.FRONTEND_ORIGEN.split(','), credentials: true });
  }

  // Documentación interactiva de la API en /api/docs
  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('ArmadorPC API')
      .setDescription(
        'API REST del comparador de precios y configurador de PC. ' +
          'Las rutas con candado requieren iniciar sesión (cookie "sesion" que deja POST /api/auth/ingresar).',
      )
      .setVersion('3.0')
      .addCookieAuth('sesion')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, documento, { customSiteTitle: 'ArmadorPC API' });

  // Producción: si existe el frontend compilado (frontend/dist), este mismo servidor lo publica
  const frontend = join(__dirname, '..', '..', 'frontend', 'dist');
  if (existsSync(frontend)) {
    app.useStaticAssets(frontend, { extensions: ['html'] });
    // Cualquier otra dirección que no sea de la API muestra la página 404 del frontend
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.status(404).sendFile(join(frontend, '404.html'));
    });
    console.log(`Sirviendo el frontend compilado desde ${frontend}`);
  }

  const puerto = process.env.PORT || 3000;
  await app.listen(puerto);
  console.log(`API de ArmadorPC en http://localhost:${puerto}/api  ·  Documentación: http://localhost:${puerto}/api/docs`);
}
bootstrap();
