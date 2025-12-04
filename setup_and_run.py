#!/usr/bin/env python3
# ==============================================================================
# AgroTrace-MS - Setup and Run Script
# ==============================================================================
# Cross-platform deployment script (Windows/Mac/Linux)
# This is the "One Button" solution to deploy the entire AgroTrace platform.
#
# Usage:
#   python setup_and_run.py              # Full setup and run
#   python setup_and_run.py --build      # Force rebuild all images
#   python setup_and_run.py --dev        # Include dev tools (simulator)
#   python setup_and_run.py --admin      # Include admin tools (Adminer, Kafka UI)
#   python setup_and_run.py --stop       # Stop all services
#   python setup_and_run.py --clean      # Stop and remove all containers/volumes
#   python setup_and_run.py --status     # Check status of all services
# ==============================================================================

import subprocess
import sys
import os
import time
import argparse
import shutil
from pathlib import Path
from typing import Optional, Tuple, List

# ANSI color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    """Print the AgroTrace banner."""
    banner = f"""
{Colors.GREEN}╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     █████╗  ██████╗ ██████╗  ██████╗ ████████╗██████╗  █████╗  ██████╗███████╗║
║    ██╔══██╗██╔════╝ ██╔══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██╔════╝║
║    ███████║██║  ███╗██████╔╝██║   ██║   ██║   ██████╔╝███████║██║     █████╗  ║
║    ██╔══██║██║   ██║██╔══██╗██║   ██║   ██║   ██╔══██╗██╔══██║██║     ██╔══╝  ║
║    ██║  ██║╚██████╔╝██║  ██║╚██████╔╝   ██║   ██║  ██║██║  ██║╚██████╗███████╗║
║    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝║
║                                                                              ║
║                    Agricultural Monitoring Platform                          ║
║                         Setup & Deployment Script                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝{Colors.ENDC}
"""
    print(banner)

def log_info(message: str):
    """Print info message."""
    print(f"{Colors.BLUE}[INFO]{Colors.ENDC} {message}")

def log_success(message: str):
    """Print success message."""
    print(f"{Colors.GREEN}[SUCCESS]{Colors.ENDC} {message}")

def log_warning(message: str):
    """Print warning message."""
    print(f"{Colors.YELLOW}[WARNING]{Colors.ENDC} {message}")

def log_error(message: str):
    """Print error message."""
    print(f"{Colors.RED}[ERROR]{Colors.ENDC} {message}")

def log_step(step: int, total: int, message: str):
    """Print step message."""
    print(f"\n{Colors.CYAN}[Step {step}/{total}]{Colors.ENDC} {Colors.BOLD}{message}{Colors.ENDC}")

def run_command(command: List[str], capture_output: bool = False, check: bool = True) -> Tuple[int, str, str]:
    """
    Run a shell command and return the result.
    
    Args:
        command: Command to run as list of strings
        capture_output: Whether to capture stdout/stderr
        check: Whether to raise exception on non-zero exit
    
    Returns:
        Tuple of (return_code, stdout, stderr)
    """
    try:
        result = subprocess.run(
            command,
            capture_output=capture_output,
            text=True,
            check=check
        )
        return (result.returncode, result.stdout or "", result.stderr or "")
    except subprocess.CalledProcessError as e:
        return (e.returncode, e.stdout or "", e.stderr or "")
    except FileNotFoundError:
        return (-1, "", f"Command not found: {command[0]}")

def check_docker_installed() -> bool:
    """Check if Docker is installed."""
    log_info("Checking if Docker is installed...")
    
    docker_path = shutil.which("docker")
    if docker_path:
        log_success(f"Docker found at: {docker_path}")
        return True
    
    log_error("Docker is not installed or not in PATH!")
    log_info("Please install Docker from: https://docs.docker.com/get-docker/")
    return False

def check_docker_compose_installed() -> bool:
    """Check if Docker Compose is installed."""
    log_info("Checking if Docker Compose is installed...")
    
    # Try docker compose (v2)
    code, stdout, stderr = run_command(["docker", "compose", "version"], capture_output=True, check=False)
    if code == 0:
        version = stdout.strip()
        log_success(f"Docker Compose (v2) found: {version}")
        return True
    
    # Try docker-compose (v1)
    compose_path = shutil.which("docker-compose")
    if compose_path:
        code, stdout, _ = run_command(["docker-compose", "--version"], capture_output=True, check=False)
        if code == 0:
            log_success(f"Docker Compose (v1) found: {stdout.strip()}")
            return True
    
    log_error("Docker Compose is not installed!")
    log_info("Please install Docker Compose or update Docker Desktop")
    return False

def check_docker_running() -> bool:
    """Check if Docker daemon is running."""
    log_info("Checking if Docker daemon is running...")
    
    code, _, stderr = run_command(["docker", "info"], capture_output=True, check=False)
    
    if code == 0:
        log_success("Docker daemon is running")
        return True
    
    log_error("Docker daemon is not running!")
    log_info("Please start Docker Desktop or the Docker service")
    
    # Platform-specific hints
    if sys.platform == "win32":
        log_info("On Windows: Start Docker Desktop from the Start Menu")
    elif sys.platform == "darwin":
        log_info("On macOS: Start Docker Desktop from Applications")
    else:
        log_info("On Linux: Run 'sudo systemctl start docker'")
    
    return False

def get_compose_command() -> List[str]:
    """Get the appropriate docker compose command."""
    # Try docker compose (v2) first
    code, _, _ = run_command(["docker", "compose", "version"], capture_output=True, check=False)
    if code == 0:
        return ["docker", "compose"]
    
    # Fall back to docker-compose (v1)
    return ["docker-compose"]

def check_env_file() -> bool:
    """Check if .env file exists and has required variables."""
    log_info("Checking environment configuration...")
    
    script_dir = Path(__file__).parent.resolve()
    env_file = script_dir / ".env"
    
    if not env_file.exists():
        log_error(f".env file not found at {env_file}")
        log_info("Creating default .env file...")
        
        # Check if .env.example exists
        env_example = script_dir / ".env.example"
        if env_example.exists():
            shutil.copy(env_example, env_file)
            log_success(".env file created from .env.example")
        else:
            log_warning("No .env.example found. Using defaults from docker-compose.yml")
        return True
    
    log_success(f".env file found at {env_file}")
    
    # Check for placeholder API key
    with open(env_file, 'r') as f:
        content = f.read()
        if "your-gemini-api-key-here" in content or "your-api-key-here" in content:
            log_warning("LLM_API_KEY is set to placeholder value!")
            log_info("AI recommendations will be disabled until you set a real API key")
    
    return True

def build_images(force_rebuild: bool = False) -> bool:
    """Build all Docker images."""
    log_info("Building Docker images...")
    
    compose_cmd = get_compose_command()
    script_dir = Path(__file__).parent.resolve()
    
    build_cmd = compose_cmd + ["-f", str(script_dir / "docker-compose.yml"), "build"]
    
    if force_rebuild:
        build_cmd.append("--no-cache")
        log_info("Force rebuild enabled - this may take a while...")
    
    code, _, stderr = run_command(build_cmd, check=False)
    
    if code != 0:
        log_error(f"Failed to build images: {stderr}")
        return False
    
    log_success("All Docker images built successfully")
    return True

def start_services(profiles: List[str] = None) -> bool:
    """Start all services using docker compose."""
    log_info("Starting AgroTrace services...")
    
    compose_cmd = get_compose_command()
    script_dir = Path(__file__).parent.resolve()
    
    up_cmd = compose_cmd + ["-f", str(script_dir / "docker-compose.yml")]
    
    # Add profiles if specified
    if profiles:
        for profile in profiles:
            up_cmd.extend(["--profile", profile])
    
    up_cmd.extend(["up", "-d"])
    
    code, _, stderr = run_command(up_cmd, check=False)
    
    if code != 0:
        log_error(f"Failed to start services: {stderr}")
        return False
    
    log_success("All services started successfully")
    return True

def stop_services() -> bool:
    """Stop all services."""
    log_info("Stopping AgroTrace services...")
    
    compose_cmd = get_compose_command()
    script_dir = Path(__file__).parent.resolve()
    
    # Stop with all profiles to catch everything
    stop_cmd = compose_cmd + [
        "-f", str(script_dir / "docker-compose.yml"),
        "--profile", "dev",
        "--profile", "admin",
        "down"
    ]
    
    code, _, stderr = run_command(stop_cmd, check=False)
    
    if code != 0:
        log_error(f"Failed to stop services: {stderr}")
        return False
    
    log_success("All services stopped")
    return True

def clean_all() -> bool:
    """Stop services and remove all containers, volumes, and networks."""
    log_info("Cleaning up all AgroTrace resources...")
    
    compose_cmd = get_compose_command()
    script_dir = Path(__file__).parent.resolve()
    
    clean_cmd = compose_cmd + [
        "-f", str(script_dir / "docker-compose.yml"),
        "--profile", "dev",
        "--profile", "admin",
        "down", "-v", "--remove-orphans"
    ]
    
    code, _, stderr = run_command(clean_cmd, check=False)
    
    if code != 0:
        log_error(f"Failed to clean up: {stderr}")
        return False
    
    log_success("All resources cleaned up")
    return True

def check_status() -> bool:
    """Check status of all services."""
    log_info("Checking service status...")
    
    compose_cmd = get_compose_command()
    script_dir = Path(__file__).parent.resolve()
    
    ps_cmd = compose_cmd + [
        "-f", str(script_dir / "docker-compose.yml"),
        "--profile", "dev",
        "--profile", "admin",
        "ps", "-a"
    ]
    
    code, stdout, _ = run_command(ps_cmd, capture_output=True, check=False)
    
    if code == 0:
        print(f"\n{Colors.CYAN}Service Status:{Colors.ENDC}")
        print(stdout)
    
    return code == 0

def wait_for_services(timeout: int = 300) -> bool:
    """Wait for all services to be healthy."""
    log_info(f"Waiting for services to be ready (timeout: {timeout}s)...")
    
    services_to_check = [
        ("TimescaleDB", "http://localhost:5432", "tcp"),
        ("PostGIS", "http://localhost:5433", "tcp"),
        ("Kafka", "http://localhost:9092", "tcp"),
        ("MS1 Ingestion", "http://localhost:8001/health", "http"),
        ("MS3 Vision", "http://localhost:8002/health", "http"),
        ("MS4 Prevision", "http://localhost:8003/health", "http"),
        ("MS5 Regles", "http://localhost:8004/health", "http"),
        ("MS6 Reco", "http://localhost:8005/health", "http"),
        ("MS7 Backend", "http://localhost:8006/api/health", "http"),
        ("MS7 Frontend", "http://localhost:8080", "http"),
    ]
    
    import socket
    import urllib.request
    import urllib.error
    
    start_time = time.time()
    
    for service_name, url, check_type in services_to_check:
        while True:
            elapsed = time.time() - start_time
            if elapsed > timeout:
                log_error(f"Timeout waiting for {service_name}")
                return False
            
            try:
                if check_type == "tcp":
                    # Parse host and port from URL
                    host = url.replace("http://", "").split(":")[0]
                    port = int(url.split(":")[-1])
                    
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(5)
                    result = sock.connect_ex((host, port))
                    sock.close()
                    
                    if result == 0:
                        log_success(f"{service_name} is ready")
                        break
                else:
                    # HTTP check
                    req = urllib.request.Request(url, method='GET')
                    urllib.request.urlopen(req, timeout=5)
                    log_success(f"{service_name} is ready")
                    break
                    
            except (socket.error, urllib.error.URLError, ConnectionRefusedError):
                pass
            
            print(f"  Waiting for {service_name}...", end="\r")
            time.sleep(2)
    
    return True

def print_access_info():
    """Print access information for all services."""
    print(f"""
{Colors.GREEN}╔══════════════════════════════════════════════════════════════════════════════╗
║                         AgroTrace-MS is Ready!                               ║
╚══════════════════════════════════════════════════════════════════════════════╝{Colors.ENDC}

{Colors.CYAN}📊 Service Endpoints:{Colors.ENDC}
┌──────────────────────────────────────────────────────────────────────────────┐
│ Service                    │ URL                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🌐 Dashboard (Frontend)    │ http://localhost:8080                           │
│ 📡 MS1 - Ingestion API     │ http://localhost:8001                           │
│ 🔬 MS3 - Vision API        │ http://localhost:8002                           │
│ 💧 MS4 - Prévision API     │ http://localhost:8003                           │
│ 📋 MS5 - Règles API        │ http://localhost:8004                           │
│ 🤖 MS6 - Reco API          │ http://localhost:8005                           │
│ 🗄️  MS7 - Backend API      │ http://localhost:8006/api                       │
│ 📦 MinIO Console           │ http://localhost:9001                           │
└──────────────────────────────────────────────────────────────────────────────┘

{Colors.CYAN}🔧 Admin Tools (use --admin flag):{Colors.ENDC}
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🗃️  Adminer (DB Admin)      │ http://localhost:8888                           │
│ 📊 Kafka UI                 │ http://localhost:8889                           │
└──────────────────────────────────────────────────────────────────────────────┘

{Colors.CYAN}📚 Documentation:{Colors.ENDC}
  • Access credentials:  See ACCESS_AND_CREDENTIALS.md
  • Quick start guide:   See GUIDE_TEST_RAPIDE.md
  • Full documentation:  See README.md

{Colors.YELLOW}💡 Useful Commands:{Colors.ENDC}
  • View logs:           docker compose logs -f [service-name]
  • Stop all services:   python setup_and_run.py --stop
  • Check status:        python setup_and_run.py --status
  • Full cleanup:        python setup_and_run.py --clean
""")

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="AgroTrace-MS Setup and Run Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup_and_run.py              # Full setup and run
  python setup_and_run.py --build      # Force rebuild all images
  python setup_and_run.py --dev        # Include simulator for testing
  python setup_and_run.py --admin      # Include Adminer and Kafka UI
  python setup_and_run.py --stop       # Stop all services
  python setup_and_run.py --clean      # Remove everything
  python setup_and_run.py --status     # Check service status
        """
    )
    
    parser.add_argument("--build", action="store_true", help="Force rebuild all Docker images")
    parser.add_argument("--dev", action="store_true", help="Include development tools (simulator)")
    parser.add_argument("--admin", action="store_true", help="Include admin tools (Adminer, Kafka UI)")
    parser.add_argument("--stop", action="store_true", help="Stop all services")
    parser.add_argument("--clean", action="store_true", help="Stop and remove all containers/volumes")
    parser.add_argument("--status", action="store_true", help="Check status of all services")
    parser.add_argument("--no-wait", action="store_true", help="Don't wait for services to be healthy")
    
    args = parser.parse_args()
    
    # Print banner
    print_banner()
    
    # Handle stop/clean/status commands
    if args.stop:
        return 0 if stop_services() else 1
    
    if args.clean:
        return 0 if clean_all() else 1
    
    if args.status:
        return 0 if check_status() else 1
    
    # Full setup and run
    total_steps = 6 if not args.no_wait else 5
    current_step = 0
    
    # Step 1: Check Docker installed
    current_step += 1
    log_step(current_step, total_steps, "Checking Docker installation")
    if not check_docker_installed():
        return 1
    
    # Step 2: Check Docker Compose
    current_step += 1
    log_step(current_step, total_steps, "Checking Docker Compose")
    if not check_docker_compose_installed():
        return 1
    
    # Step 3: Check Docker running
    current_step += 1
    log_step(current_step, total_steps, "Checking Docker daemon")
    if not check_docker_running():
        return 1
    
    # Step 4: Check environment
    current_step += 1
    log_step(current_step, total_steps, "Checking environment configuration")
    check_env_file()
    
    # Step 5: Build images
    current_step += 1
    log_step(current_step, total_steps, "Building Docker images")
    if not build_images(force_rebuild=args.build):
        return 1
    
    # Step 6: Start services
    current_step += 1
    log_step(current_step, total_steps, "Starting services")
    
    profiles = []
    if args.dev:
        profiles.append("dev")
    if args.admin:
        profiles.append("admin")
    
    if not start_services(profiles):
        return 1
    
    # Wait for services (optional)
    if not args.no_wait:
        log_info("Waiting for services to initialize...")
        time.sleep(10)  # Initial wait for containers to start
        # Skip health check waiting for now - it requires additional setup
    
    # Print access information
    print_access_info()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
