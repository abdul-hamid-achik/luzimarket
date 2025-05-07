import dotenv from "dotenv";
import app from "./app";

// Configure environment as early as possible
dotenv.config();

console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

// Local dev: start server if run directly
if (require.main === module) {
  const port = 8080;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export the Express app for Vercel serverless function
export = app;