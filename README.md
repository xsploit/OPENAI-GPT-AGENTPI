# OPENAI-GPT-AGENTPI

# Node.js Express Server with OpenAI and Private Investigator Functionality

## Overview

This application is a Node.js server leveraging Express and other modules, integrated with OpenAI's Assistant API. It functions as a virtual Private Investigator, capable of performing web searches, summarizing content, and analyzing images.

## Features

- **OpenAI Assistant Integration**: Utilizes the OpenAI Assistant API for advanced querying and summarization.
- **Private Investigator Functionality**: Searches Google for links and provides summarized content, aiding in private investigations.
- **Web Scraping**: Scrapes LinkedIn profiles with Puppeteer for detailed information.
- **Image Description**: Analyzes and describes images using OpenAI's Vision API.
- **File Upload**: Supports file uploads for processing using `multer`.
- **Customizable Search**: Fetches search results with a focus on LinkedIn URLs.
- **CORS Support**: Implements Cross-Origin Resource Sharing (CORS) for flexible frontend interaction.

## Prerequisites

- Node.js
- npm (Node Package Manager)
- OpenAI API Key

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd [repository-name]

# Install dependencies
npm install

# Set environment variables
# Create a .env file and add your OpenAI API key
OPENAI_API_KEY=your_key_here
```

## Usage

1. **Starting the Server**
   ```bash
   npm start
   ```
   - The server will run on `localhost:3000` or a specified PORT in the `.env` file.

2. **Endpoints**
   - `/chat`: Interacts with the OpenAI chat model for investigative summaries.
   - `/upload`: Manages file uploads for further processing.
   - `/analyzeImage`: Endpoint for image analysis and description.
   - Additional customized endpoints based on application needs.

3. **API Interaction**
   - Use tools like Postman or integrate with a frontend for API interaction.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b new-feature`
3. Commit changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin new-feature`
5. Submit a pull request.


---

