import swaggerJsdoc from "swagger-jsdoc";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Arch-Systems Portal API",
      version: "1.0.0",
      description:
        "API for industrial operations portal - control room, drilling, engineering, safety, and production management",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Supabase JWT authentication token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [join(__dirname, "../app/api/**/*.ts"), join(__dirname, "../app/api/**/*.js")],
};

try {
  const spec = swaggerJsdoc(options);

  // Write spec to the contract package
  const outputPath = join(__dirname, "../../../packages/contract/openapi.generated.json");
  writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI spec generated at ${outputPath}`);
  console.log(`Total paths: ${Object.keys(spec.paths).length}`);
  console.log(`Total tags: ${spec.tags?.length || 0}`);
} catch (error) {
  console.error("❌ Failed to generate OpenAPI spec:", error);
  process.exit(1);
}
