#!/usr/bin/env python3
"""
Simple documentation server for the ATS Teamified repository template.
Serves documentation and provides information about the template setup.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

class DocumentationHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/' or path == '/index.html':
            self.serve_index()
        elif path == '/api/structure':
            self.serve_structure()
        elif path.startswith('/docs/') or path.startswith('/template-setup/'):
            self.serve_file(path[1:])
        else:
            super().do_GET()
    
    def serve_index(self):
        """Serve the main index page"""
        html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATS Teamified - Repository Template</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        
        h3 {
            color: #764ba2;
            margin-bottom: 15px;
            margin-top: 20px;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .feature-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .feature-card h3 {
            margin-top: 0;
            font-size: 1.2em;
        }
        
        .tool-list {
            list-style: none;
            padding-left: 0;
        }
        
        .tool-list li {
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 4px;
            display: flex;
            align-items: center;
        }
        
        .tool-list li:before {
            content: "✓";
            color: #667eea;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .command-box {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
            margin: 15px 0;
        }
        
        .command {
            color: #4ec9b0;
        }
        
        .comment {
            color: #6a9955;
        }
        
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 5px;
            transition: transform 0.2s;
        }
        
        .button:hover {
            transform: translateY(-2px);
        }
        
        .file-structure {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        footer {
            background: #1e1e1e;
            color: white;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 ATS Teamified</h1>
            <p class="subtitle">Repository Template for Development Environment Setup</p>
        </header>
        
        <div class="content">
            <div class="section">
                <h2>About This Template</h2>
                <p>This is a comprehensive repository template designed to streamline the setup of development environments across different platforms. It includes automated setup scripts, pre-configured development tools, and best practices for team collaboration.</p>
            </div>
            
            <div class="section">
                <h2>Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>Cross-Platform Support</h3>
                        <p>Works on Windows, macOS, and Linux with platform-specific setup scripts.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Automated Setup</h3>
                        <p>One-command installation of all development tools and dependencies.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Code Quality Tools</h3>
                        <p>Pre-configured ESLint, Prettier, Pylint, and Black for consistent code style.</p>
                    </div>
                    <div class="feature-card">
                        <h3>CI/CD Ready</h3>
                        <p>Includes GitHub Actions workflows for testing and deployment.</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Quick Start</h2>
                <p>Choose your platform and run the appropriate setup script:</p>
                
                <div class="command-box">
                    <div class="comment"># Cross-platform (recommended)</div>
                    <div class="command">python3 template-setup/setup.py</div>
                    <br>
                    <div class="comment"># macOS</div>
                    <div class="command">./template-setup/setup-macos.sh</div>
                    <br>
                    <div class="comment"># Linux</div>
                    <div class="command">./template-setup/setup-linux.sh</div>
                    <br>
                    <div class="comment"># Windows (PowerShell)</div>
                    <div class="command">.\\template-setup\\setup-windows.ps1</div>
                </div>
            </div>
            
            <div class="section">
                <h2>Development Tools Included</h2>
                <ul class="tool-list">
                    <li>Git with team-standard configuration</li>
                    <li>Visual Studio Code with essential extensions</li>
                    <li>Docker Desktop for containerization</li>
                    <li>Node.js (v18+) with npm, Yarn, and pnpm</li>
                    <li>Python 3.11 with pip, virtualenv, and pipenv</li>
                    <li>Playwright for end-to-end testing</li>
                    <li>Postman for API development</li>
                </ul>
            </div>
            
            <div class="section">
                <h2>Project Structure</h2>
                <div class="file-structure">
├── template-setup/          # Development environment setup
│   ├── README.md           # Detailed setup instructions
│   ├── setup.py            # Cross-platform setup script
│   ├── setup-windows.ps1   # Windows PowerShell script
│   ├── setup-macos.sh      # macOS Bash script
│   ├── setup-linux.sh      # Linux Bash script
│   └── config/             # Configuration files
├── docs/                   # Project documentation
│   ├── architecture/       # Coding standards
│   └── style-guide/        # Style guides
├── src/                    # Your application code
├── tests/                  # Test files
├── .github/workflows/      # CI/CD workflows
├── package.json            # Node.js dependencies
├── requirements.txt        # Python dependencies
└── pyproject.toml          # Python project config
                </div>
            </div>
            
            <div class="section">
                <h2>Documentation</h2>
                <p>Explore the comprehensive documentation to get started:</p>
                <div style="margin-top: 15px;">
                    <a href="/docs/architecture/coding-standards.md" class="button">Coding Standards</a>
                    <a href="/docs/style-guide/style-guide-quick-reference.md" class="button">Style Guide</a>
                    <a href="/docs/prd.md" class="button">PRD</a>
                    <a href="/README.md" class="button">README</a>
                </div>
            </div>
            
            <div class="section">
                <h2>Next Steps</h2>
                <ol>
                    <li>Run the setup script for your platform</li>
                    <li>Customize the template for your project needs</li>
                    <li>Update the documentation in the <code>docs/</code> folder</li>
                    <li>Configure your CI/CD workflows</li>
                    <li>Start developing!</li>
                </ol>
            </div>
        </div>
        
        <footer>
            <p>Happy coding! 🎉</p>
        </footer>
    </div>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_structure(self):
        """Serve the repository structure as JSON"""
        structure = {
            "name": "ats-teamified",
            "type": "template",
            "description": "Repository template for development environment setup"
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(structure).encode())
    
    def serve_file(self, filepath):
        """Serve a file from the repository"""
        try:
            with open(filepath, 'r') as f:
                content = f.read()
            
            self.send_response(200)
            if filepath.endswith('.md'):
                self.send_header('Content-type', 'text/plain')
            else:
                self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(content.encode())
        except FileNotFoundError:
            self.send_error(404, 'File not found')

def run_server(port=5000):
    """Start the documentation server"""
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, DocumentationHandler)
    print(f'Starting documentation server on http://0.0.0.0:{port}')
    print(f'Repository Template Documentation is ready!')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
