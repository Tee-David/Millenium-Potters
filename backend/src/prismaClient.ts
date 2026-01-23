import { PrismaClient, Prisma } from "@prisma/client";
import { Logger } from "./utils/logger.util";

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

// Create Prisma client with connection pooling configuration
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Exponential backoff helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateRetryDelay = (attempt: number): number => {
  const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add random jitter up to 1 second
  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY);
};

// Connect with retry logic
const connectWithRetry = async (retryCount = 0): Promise<void> => {
  try {
    await prisma.$connect();
    Logger.info("Prisma client connected successfully");
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const retryDelay = calculateRetryDelay(retryCount);
      Logger.warn(
        `Database connection failed. Retrying in ${Math.round(retryDelay / 1000)}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      await delay(retryDelay);
      return connectWithRetry(retryCount + 1);
    }
    Logger.error("Failed to connect to database after maximum retries:", error);
    throw error;
  }
};

// Initialize connection
connectWithRetry().catch((error) => {
  Logger.error("Database connection failed permanently:", error);
  // Don't exit process - let the health check handle this
});

// Prisma middleware for automatic retry on transient errors
prisma.$use(async (params, next) => {
  const maxRetries = 3;
  let retries = 0;

  while (true) {
    try {
      return await next(params);
    } catch (error) {
      // Check if it's a retryable error
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2024: Timed out fetching a new connection from the connection pool
        // P2028: Transaction API error
        const retryableCodes = ["P2024", "P2028"];

        if (retryableCodes.includes(error.code) && retries < maxRetries) {
          retries++;
          const retryDelay = calculateRetryDelay(retries);
          Logger.warn(
            `Database operation failed with ${error.code}. Retrying in ${Math.round(retryDelay / 1000)}s... (attempt ${retries}/${maxRetries})`
          );
          await delay(retryDelay);
          continue;
        }
      }

      // Check for connection errors
      if (
        error instanceof Prisma.PrismaClientInitializationError &&
        retries < maxRetries
      ) {
        retries++;
        const retryDelay = calculateRetryDelay(retries);
        Logger.warn(
          `Database initialization error. Retrying in ${Math.round(retryDelay / 1000)}s... (attempt ${retries}/${maxRetries})`
        );
        await delay(retryDelay);

        // Try to reconnect
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (reconnectError) {
          Logger.error("Reconnection failed:", reconnectError);
        }
        continue;
      }

      throw error;
    }
  }
});

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    Logger.error("Database health check failed:", error);
    return false;
  }
};

// Handle graceful shutdown
process.on("beforeExit", async () => {
  Logger.info("Prisma client is disconnecting...");
  await prisma.$disconnect();
});

// Handle SIGTERM
process.on("SIGTERM", async () => {
  Logger.info("SIGTERM received. Closing database connection...");
  await prisma.$disconnect();
  process.exit(0);
});

// Handle SIGINT
process.on("SIGINT", async () => {
  Logger.info("SIGINT received. Closing database connection...");
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
