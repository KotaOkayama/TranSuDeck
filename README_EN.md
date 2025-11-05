# TranSuDeck

Translation, Summarization & PPTX Generation Application using GenAI Hub

## Overview

TranSuDeck is a web application that leverages GenAI Hub to perform text translation, summarization, and PowerPoint presentation generation.

## UI Screenshots

### API Settings Screen (First Launch)
![API Settings Screen](images/API.png)

### Main UI Screen
![Main UI Screen](images/UI.png)

## Features

- **Translation**: Multilingual text translation (10 languages supported)
- **Summarization**: Automatic summarization of long texts
- **PPTX Generation**: Automatic PowerPoint file generation
- **Model Selection**: Choose from Claude, Llama, and more
- **Initial Setup**: Automatic settings save via API configuration screen

## Supported Languages

| Language | Code |
|----------|------|
| English | en |
| Japanese | ja |
| Korean | ko |
| Chinese | zh |
| French | fr |
| German | de |
| Spanish | es |
| Hindi | hi |
| Vietnamese | vi |
| Thai | th |

## Requirements

- Docker & Docker Compose
- GenAI Hub API access

## 🚀 Quick Start (For Users)

### Using Image from GitHub Container Registry

1. Pull Docker image:
   docker pull ghcr.io/kotaokayama/transudeck:latest

2. Start container:
   docker run -d -p 8001:8001 --name transudeck ghcr.io/kotaokayama/transudeck:latest

   - To change the access port, modify only the left port number (host side)
   - Example: -p 8080:8001 to access via port 8080

3. Access the application:
   - Open http://localhost:8001 in your browser
   - Configure API Key and API URL on first launch

4. Stop container:
   docker stop transudeck

5. Start container (subsequent launches):
   docker start transudeck

6. Remove container:
   docker rm transudeck

   Note: Removing the container will also delete settings and generated files

## Quick Start (For Developers)

### Using Docker

Clone repository:
git clone <repository-url>
cd TranSuDeck

Start:
docker-compose up -d --build

Check logs:
docker-compose logs -f

Access http://localhost:8001 in your browser

### Local Environment

Create and activate virtual environment:
python -m venv venv
source venv/bin/activate
For Windows: venv\Scripts\activate

Install dependencies:
pip install -r requirements.txt

Start application:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

## Usage

1. Access http://localhost:8001 in your browser
2. API settings screen will appear on first launch
3. Enter GenAI Hub API Key and endpoint URL
4. Click "Save Settings"
5. Select a model on the main screen
6. Enter text and click "Translate & Summarize"
7. Send summary results to slide editor with "Send to Editor"
8. After editing slides, click "Generate PPTX" to create PowerPoint file

## Environment Variables

Settings are automatically saved via the initial configuration screen.

In Docker environment, saved to /app/config/.env, in local environment to .env

### Main Configuration Items

| Variable | Description | Required |
|----------|-------------|----------|
| GENAI_API_KEY | GenAI Hub API Key | ✓ |
| GENAI_API_URL | GenAI Hub API Endpoint URL | ✓ |

## Project Structure

TranSuDeck/
├── app/
│   ├── core/              # Translation, summarization, PPTX generation
│   ├── models/            # Data models
│   ├── utils/             # Utilities
│   ├── static/            # HTML/CSS/JS
│   ├── config.py          # Configuration
│   └── main.py            # Main application
├── tests/                 # Tests
├── docker/                # Docker files
├── outputs/               # Generated files output
├── logs/                  # Logs
└── docker-compose.yml     # Docker configuration

## 🧪 Testing

### Run Tests

Run all tests:
make test

Or:
pytest

## Troubleshooting

### Common Issues

1. API Configuration Issues:
   - Verify API Key and API URL are correctly configured
   - Check API Key permissions
   - Ensure API URL is in correct format (e.g., https://api.example.com/v1)

2. Docker Related Issues:
   - Confirm Docker Desktop is running
   - Check container logs: docker logs transudeck
   - Try rebuilding the container

3. Port Already in Use:
   Use a different port:
   docker run -d -p 8080:8001 --name transudeck ghcr.io/kotaokayama/transudeck:latest

### Reset Settings

Docker environment (GitHub Container Registry):
Remove and restart container:
docker stop transudeck
docker rm transudeck
docker run -d -p 8001:8001 --name transudeck ghcr.io/kotaokayama/transudeck:latest

Docker environment (docker-compose):
docker-compose down --volumes
docker-compose up -d

Local environment:
rm .env

After restarting the app, the API settings screen will be displayed again.

### Models Not Displaying

- Verify API settings are correct
- Check browser console for errors (F12 key)
- Check logs: docker logs transudeck

### Complete Reset (docker-compose)

docker-compose down --rmi all --volumes --remove-orphans
docker-compose build --no-cache
docker-compose up -d

## Security Notes

- Keep your API keys secure
- Use HTTPS in production environments
- Never commit configuration files to Git

## License

MIT License - See LICENSE file for details
