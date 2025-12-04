#!/usr/bin/env python3
"""
Entry point for the RecoIrrigation application.
This script properly sets up the Python path and runs the FastAPI application.
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )