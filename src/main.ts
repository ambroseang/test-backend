import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle("PowerPlanner by AcademyHeroes")
    .setDescription(
      "PowerPlanner API Endpoints. Token required to execute secured endpoints",
    )
    .setExternalDoc(
      "Source",
      "https://github.com/AcademyHeroes/projectplanner-backend",
    )
    .setVersion("alpha-version 0.0.1")
    .setTermsOfService(
      "https://github.com/AcademyHeroes/projectplanner-backend",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document);

  const configService = app.get(ConfigService); // dynamic port
  await app.listen(configService.get("PORT") || 3000);
}
bootstrap();
