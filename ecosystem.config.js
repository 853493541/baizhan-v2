module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: "/home/azureuser/baizhan-v2/frontend",
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: {
        PORT: 3000,
        NODE_ENV: "production"
      }
    },
    {
      name: "backend",
      cwd: "/home/azureuser/baizhan-v2/backend",
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: {
        PORT: 5000,
        NODE_ENV: "production"
      }
    },
    {
      name: "ocr",
      cwd: "/home/azureuser/baizhan-v2/backend",
      // Option 1: Use Python interpreter inside venv
      script: "uvicorn",
      args: "main:app --host 0.0.0.0 --port 8000",
      interpreter: "/home/azureuser/baizhan-v2/backend/.venv/bin/python"

      // Option 2 (alternative): run uvicorn binary directly, no interpreter needed
      // script: "./.venv/bin/uvicorn",
      // args: "main:app --host 0.0.0.0 --port 8000"
    }
  ]
};
