#!/bin/bash

# Zendesk Knowledge Base Export Runner
# This script makes it easy to run the Zendesk export with proper setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.7 or higher."
        exit 1
    fi
    
    python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    print_success "Python $python_version found"
}

# Function to install dependencies
install_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found. Please ensure you're in the correct directory."
        exit 1
    fi
    
    if ! python3 -c "import requests, pandas" &> /dev/null; then
        print_warning "Required dependencies not found. Installing..."
        pip3 install -r requirements.txt
        print_success "Dependencies installed"
    else
        print_success "All dependencies are already installed"
    fi
}

# Function to check configuration
check_config() {
    if [ -f "zendesk_config.env" ]; then
        print_success "Configuration file found: zendesk_config.env"
        return 0
    else
        print_warning "No configuration file found"
        return 1
    fi
}

# Function to create configuration
create_config() {
    print_status "Creating configuration file..."
    
    if [ -f "zendesk_config.env.example" ]; then
        cp zendesk_config.env.example zendesk_config.env
        print_success "Configuration template created: zendesk_config.env"
        print_warning "Please edit zendesk_config.env with your Zendesk credentials"
        print_status "Then run this script again"
        exit 0
    else
        print_error "Configuration template not found. Please create zendesk_config.env manually"
        exit 1
    fi
}

# Function to test connection
test_connection() {
    print_status "Testing Zendesk connection..."
    
    if python3 test_zendesk_connection.py --config-file zendesk_config.env; then
        print_success "Connection test passed"
        return 0
    else
        print_error "Connection test failed"
        return 1
    fi
}

# Function to run export
run_export() {
    print_status "Starting Zendesk export..."
    
    # Generate timestamp for output file
    timestamp=$(date +"%Y%m%d_%H%M%S")
    output_file="zendesk_articles_${timestamp}.csv"
    
    if python3 zendesk_export.py --config-file zendesk_config.env --output "$output_file"; then
        print_success "Export completed successfully!"
        print_success "Output file: $output_file"
        
        # Show file size
        if [ -f "$output_file" ]; then
            file_size=$(du -h "$output_file" | cut -f1)
            print_status "File size: $file_size"
        fi
    else
        print_error "Export failed"
        exit 1
    fi
}

# Main script
main() {
    echo "🚀 Zendesk Knowledge Base Export Runner"
    echo "========================================"
    echo ""
    
    # Check Python
    check_python
    
    # Install dependencies
    install_dependencies
    
    # Check configuration
    if ! check_config; then
        create_config
    fi
    
    # Test connection
    if ! test_connection; then
        print_error "Please fix your configuration and try again"
        exit 1
    fi
    
    # Run export
    run_export
    
    echo ""
    print_success "All done! 🎉"
}

# Run main function
main "$@"
