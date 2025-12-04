FROM python:3.9-slim

WORKDIR /app

# Install system dependencies required for OpenCV/Pillow if needed
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Using --no-cache-dir to keep image small
RUN pip install --upgrade pip

RUN pip install --no-cache-dir --default-timeout=1000 torch==2.1.2+cpu torchvision==0.16.2+cpu --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .

RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# Copy all application code (includes model files if present)
COPY . .

# Note: Model files (disease_multiclass_best.pth, class_names.json) should be in the ms3-visionPlante-main folder
# If not present, the service will start but model inference won't work until files are added
# You can download/train the model and place it in the folder, then rebuild

# Expose the port
EXPOSE 8002

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
