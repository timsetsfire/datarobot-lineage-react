## DataRobot Lineage App

Focused on building **enhanced dependency graphs** for DataRobot Use Cases with rich, typed relationships and advanced visualization features.

Uses React and a Node.js backend with enhanced authentication and comprehensive graph analysis capabilities.

## 🚀 **Key Features**

### **Enhanced Graph Visualization**
- **17 Node Types** - From datasets to LLMs to applications
- **25+ Edge Types** - Typed relationships with visual styling
- **Color-coded relationships** - Orange (apps), Blue (ML), Green (data), Purple (AI)
- **Advanced search** - Find nodes by ID, name, or type with auto-zoom
- **Interactive legends** - Node and edge type legends with live counts

### **Rich Application Lineage**
- **Application dependency tracking** - See what models, datasets, and deployments your apps use
- **Impact analysis** - Understand what breaks when you change models or data
- **Data lineage visualization** - Full path from source to application
- **Model governance** - Clear model → deployment → application mapping

### **Improved Authentication**
- **Enhanced token handling** - Automatic Bearer token formatting
- **Debug logging** - Comprehensive authentication troubleshooting
- **Robust error handling** - Graceful fallbacks for auth issues

## 📚 **Documentation**

- **[Enhanced Lineage Graph Guide](docs/ENHANCED-LINEAGE-GRAPH.md)** - Comprehensive guide to the enhanced graph features
- **[Example Files](examples/)** - Sample JSON files for testing and reference
  - `custom-model-version-enhanced.json` - Example custom model configuration
  - `enhanced-graph-response.json` - Example graph response format

## Key Dependencies

**Frontend (Client):**
- React 19.0.0 - Core UI framework
- React Bootstrap - UI components and styling
- Vite - Build tool and development server
- vis-network - Network graph visualization
- Axios - HTTP client for API calls

**Backend:**
- Node.js - Server runtime
- Neo4j - Graph database for data lineage

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **DataRobot API Token** - Get from your DataRobot instance
- **Optional**: Neo4j instance (for chat functionality)

### **Quick Start (Development)**

The easiest way to get started is using the provided startup scripts:

```bash
# Clone the repository
git clone <repository-url>
cd datarobot-lineage-react

# Make startup scripts executable
chmod +x start-dev.sh start-prod.sh

# Start development server (recommended for development)
./start-dev.sh
```

This will:
- ✅ Install all dependencies automatically
- ✅ Create a `.env` template if missing
- ✅ Start backend server on port 8080
- ✅ Start frontend dev server on port 5173
- ✅ Open the application in your browser

### **Manual Setup (Alternative)**

If you prefer manual setup:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Build frontend for production
cd client && npm run build && cd ..

# Start the application
npm start
```

### **Production Deployment**

For production deployment:

```bash
# Use the production startup script
./start-prod.sh
```

This will:
- ✅ Build the frontend for production
- ✅ Start the production server on port 8080
- ✅ Serve the application from `client/dist/`

### **Available Scripts**

| Script | Description | Port |
|--------|-------------|------|
| `./start-dev.sh` | Development mode with hot reload | Backend: 8080, Frontend: 5173 |
| `./start-prod.sh` | Production mode with built frontend | Backend: 8080 |
| `npm start` | Start backend server only | 8080 |
| `npm run start:dev` | Start backend with nodemon (auto-restart) | 8080 |

### **Access URLs**

- **Development**: http://localhost:5173 (frontend) + http://localhost:8080 (backend)
- **Production**: http://localhost:8080 (serves both frontend and backend)
- **API Health Check**: http://localhost:8080/auth/check

## 🔧 **Configuration**

### **DataRobot API Configuration**
```bash
DATAROBOT_ENDPOINT=https://your-datarobot-instance.com/api/v2
DATAROBOT_API_TOKEN=your-api-token-here
```

### **Neo4j Configuration (for chat functionality)**
```bash
NEO4J_URL=your-neo4j-url-here
NEO4J_PASSWORD=your-neo4j-password-here
```

### **Server Configuration**
```bash
PORT=8080
```

### **Environment Setup**

You have two options for setting up your environment:

#### **Option 1: Use the startup scripts (Recommended)**
The startup scripts will automatically create a `.env` file if one doesn't exist:

```bash
./start-dev.sh
```

This will create a `.env` file with the basic template and prompt you to update it.

#### **Option 2: Manual setup**
Copy the template and configure it manually:

```bash
# Copy the template
cp .env.template .env

# Edit the file with your credentials
nano .env  # or use your preferred editor
```

#### **Required Configuration**
Update your `.env` file with your actual credentials:

```bash
# DataRobot API Configuration
DATAROBOT_ENDPOINT=https://your-datarobot-instance.com/api/v2
DATAROBOT_API_TOKEN=your-api-token-here

# Server Configuration
PORT=8080

# Neo4j Configuration (optional - only needed for chat functionality)
NEO4J_URL=your-neo4j-url-here
NEO4J_PASSWORD=your-neo4j-password-here
```

**⚠️ Important**: 
- Replace `your-api-token-here` with your actual DataRobot API token
- Get your API token from DataRobot: Settings > API Access > Generate API Token
- The `.env` file is automatically ignored by git for security

## 🗄️ **Database Setup**

### Using AuraDB

The easiest path is to create a free [neo4j auradb instance](https://neo4j.com/product/auradb)

You'll need to create login, then create an instance.  

**⚠️ MAKE SURE TO DOWNLOAD THE PASSWORD**

After the instance is created, you will need the instance URI.   
![alt ext](image.png)

Add the password and the instance URI to `.env` file as `NEO4J_PASSWORD` and `NEO4J_URL`.  

### Using Docker locally

```bash
docker run \
    -p 7474:7474 -p 7687:7687 \
    --name neo4j-apoc \
    -e NEO4J_apoc_export_file_enabled=true \
    -e NEO4J_apoc_import_file_enabled=true \
    -e NEO4J_apoc_import_file_use__neo4j__config=true \
    -e NEO4J_PLUGINS=\[\"apoc\"\] \
    neo4j:2025.01
```

Every time you start the docker image, you should login to the neo4j UI at localhost:7474. User and password is neo4j. You MUST reset the password and update `.env` before using the chat piece of the app.

## 🎯 **Enhanced Graph Features**

### **Node Types (17 Total)**
- **Data & Storage**: datasets, datastore, datasource, vectorDatabases, dataEngineQueries
- **Projects & Models**: projects, models, customModelVersion, registeredModels  
- **AI & LLM**: llm, llmBlueprint, playgrounds
- **Applications**: applications, customApplications, customApplicationSources
- **Processing & Deployment**: deployments, recipes

### **Edge Types (25+ Types)**
- **Application Relationships**: USES_DEPLOYMENT, USES_MODEL, BUILT_FROM_PROJECT
- **ML Pipeline**: TRAINED_ON, BELONGS_TO_PROJECT, DEPLOYS_MODEL
- **Data Flow**: SOURCED_FROM, CONNECTS_TO, PROCESSES_DATA_FROM
- **AI & LLM**: BUILT_FROM_DATASET, USES_LLM, USES_LLM_BLUEPRINT

### **Visual Enhancements**
- **Color coding** by relationship type
- **Line thickness** indicating importance (1-3px)
- **Dash patterns** for special relationships
- **Interactive legends** with live counts
- **Advanced search** with golden highlighting

## 🛠️ **Troubleshooting**

### Build Errors

**"Rollup failed to resolve import 'react-bootstrap'"**

This error occurs when the react-bootstrap dependency is missing. Ensure all dependencies are installed:

```bash
cd client
npm install
npm run build
```

If the error persists, check that `react-bootstrap` and `bootstrap` are listed in `client/package.json` dependencies.

### Authentication Issues

The app now includes enhanced debug logging for authentication. Check the browser console for detailed token information and authentication flow debugging.

### Graph Loading Issues

- Ensure your DataRobot API token has the necessary permissions
- Check that the DataRobot endpoint is accessible
- Verify the token format (the app now handles Bearer prefix automatically)

### Startup Issues

**"Permission denied" when running startup scripts**
```bash
chmod +x start-dev.sh start-prod.sh
```

**"Port already in use" errors**
The startup scripts will automatically kill processes on the required ports, but if you encounter issues:
```bash
# Kill processes on port 8080
lsof -ti:8080 | xargs kill -9

# Kill processes on port 5173 (development)
lsof -ti:5173 | xargs kill -9
```

**"Node.js is not installed"**
Download and install Node.js from [nodejs.org](https://nodejs.org/)

**"npm install" fails**
Try clearing npm cache and reinstalling:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Frontend build fails**
Check that all client dependencies are installed:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📊 **Example Use Cases**

1. **Application Impact Analysis**: "What apps will break if I change this model?"
2. **Data Lineage Tracking**: "Which datasets does this app depend on?"
3. **Model Governance**: "What's the full pipeline behind this deployment?"
4. **Root Cause Analysis**: Trace issues back through typed connections
5. **Performance Optimization**: Identify bottlenecks in data pipelines
