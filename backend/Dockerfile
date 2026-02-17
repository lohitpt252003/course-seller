FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x scripts/entrypoint.sh

# Expose port
EXPOSE 8000

# Use the entrypoint script (migrations → seed → start server)
CMD ["./scripts/entrypoint.sh"]
