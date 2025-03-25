import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Direct debugging of .env file
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve('/home/runner/workspace/.env')
];

let envFile = null;
for (const envPath of possibleEnvPaths) {
  try {
    console.log('Checking .env file at:', envPath);
    const exists = fs.existsSync(envPath);
    console.log(`${envPath} exists:`, exists);
    
    if (exists) {
      const contents = fs.readFileSync(envPath, 'utf8');
      console.log(`${envPath} snippet (first line):`, contents.split('\n')[0]);
      envFile = envPath;
      
      // Load environment variables from this .env file
      dotenv.config({ path: envPath });
      console.log('Loaded environment variables from:', envPath);
      break; // Exit the loop once we've found and loaded an .env file
    }
  } catch (err) {
    console.error(`Error checking .env file at ${envPath}:`, err);
  }
}

// If we found an env file but environment variables aren't loaded through dotenv,
// manually parse and set them directly
if (envFile) {
  try {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        if (key && value) {
          process.env[key.trim()] = value;
          console.log(`Manually set ${key.trim()} to a value`);
        }
      }
    }
  } catch (err) {
    console.error('Error manually parsing .env file:', err);
  }
}

// Debug environment variables after loading
console.log('After manual .env loading:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'DEFINED' : 'UNDEFINED');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINED' : 'UNDEFINED');

const app = express();

// Regular body parsers
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      if (buf.length) {
        const rawBody = buf.toString('utf8');
        console.log('Raw request body:', rawBody);
      }
    } catch (e: any) {
      console.error('Error parsing raw body:', e.message);
    }
  }
}));
app.use(express.urlencoded({ extended: false }));

// Middleware to log parsed body
app.use((req, res, next) => {
  if (req.path.includes('/auth/login')) {
    console.log('Parsed request body after middleware:', req.body);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
