# DataRobot Lineage App

> **Visualize and analyze ML dependencies across your DataRobot ecosystem**

Build comprehensive dependency graphs for DataRobot Use Cases with rich, typed relationships and advanced visualization features. Understand how your models, datasets, and applications connect to make better decisions about changes and impact.

## 🎯 **Why Use This App?**

- **🔍 Impact Analysis**: See what breaks when you change models or data
- **📊 Data Lineage**: Trace the full path from source to application
- **🏗️ Model Governance**: Clear model → deployment → application mapping
- **🚀 Quick Setup**: Get started in minutes with automated scripts
- **🎨 Rich Visualization**: 17 node types, 25+ edge types with color coding

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** (v16+) - [Download here](https://nodejs.org/)
- **DataRobot API Token** - Get from Settings > API Access > Generate API Token

### One-Command Setup
```bash
# Clone and start
git clone <repository-url>
cd datarobot-lineage-react
chmod +x start-dev.sh start-prod.sh
./start-dev.sh
```

The script will:
- ✅ Install dependencies automatically
- ✅ Create `.env` template
- ✅ Create python environment to run MCP Server
- ✅ Start development servers
- ✅ Open the app in your browser

**Access**: http://localhost:5173 (frontend) + http://localhost:8080 (backend) + http://localhost:8000 (MCP)

## 📋 **Available Scripts**

| Script | Purpose | Ports |
|--------|---------|-------|
| `./start-dev.sh` | **Development** (hot reload) | Frontend: 5173, Backend: 8080, MCP: 8000|
| `./start-prod.sh` | **Production** (built frontend) | Backend: 8080, MCP: 8000 |
| `npm start` | Backend only | 8080 |
| `npm run start:dev` | Backend with auto-restart | 8080 |

## ⚙️ **Configuration**

### Environment Setup
The startup scripts create `.env` automatically, or copy manually:

```bash
# Option 1: Let startup script create it
./start-dev.sh

# Option 2: Manual setup
cp .env.template .env
nano .env
```

### Required Configuration
```bash
# DataRobot API (Required)
DATAROBOT_ENDPOINT=https://your-datarobot-instance.com/api/v2
DATAROBOT_API_TOKEN=your-api-token-here

# Server (Optional - defaults to 8080)
PORT=8080

# Neo4j (Optional - for chat functionality)
NEO4J_URL=your-neo4j-url-here
NEO4J_PASSWORD=your-neo4j-password-here
```

**⚠️ Get your API token from**: DataRobot Settings > API Access > Generate API Token

## 🎨 **Enhanced Graph Features**

### **Visual Elements**
- **17 Node Types**: datasets, models, applications, LLMs, deployments, etc.
- **25+ Edge Types**: USES_DEPLOYMENT, TRAINED_ON, SOURCED_FROM, etc.
- **Color Coding**: Orange (apps), Blue (ML), Green (data), Purple (AI)
- **Interactive Legends**: Live counts and search functionality
- **Advanced Search**: Find nodes by ID, name, or type with auto-zoom

### **Key Capabilities**
- **Application Dependency Tracking**: See what models/datasets your apps use
- **Impact Analysis**: Understand downstream effects of changes
- **Data Lineage Visualization**: Full path from source to application
- **Model Governance**: Clear model → deployment → application mapping

## 📊 **Use Cases**

### For Engineers
1. **"What apps will break if I change this model?"** → Follow `USES_MODEL` edges
2. **"Which datasets does this app depend on?"** → Trace `REFERENCES_DATASET` paths
3. **"What's the full pipeline behind this deployment?"** → Follow `DEPLOYS_MODEL` → `TRAINED_ON` chain

### For Product Stakeholders
1. **Change Impact Assessment**: Understand downstream effects before making changes
2. **Root Cause Analysis**: Trace issues back through typed connections
3. **Performance Optimization**: Identify bottlenecks in data pipelines
4. **Compliance & Governance**: Track data lineage and model dependencies

## 🗄️ **Database Setup (Optional)**

### Neo4j AuraDB (Recommended)
1. Create free [Neo4j AuraDB instance](https://neo4j.com/product/auradb)
2. **⚠️ Download the password** when creating
3. Add URI and password to `.env`

### Local Docker
```bash
docker run -p 7474:7474 -p 7687:7687 --name neo4j-apoc \
  -e NEO4J_apoc_export_file_enabled=true \
  -e NEO4J_apoc_import_file_enabled=true \
  -e NEO4J_apoc_import_file_use__neo4j__config=true \
  -e NEO4J_PLUGINS=\[\"apoc\"\] \
  neo4j:2025.01
```

**Access**: http://localhost:7474 (user: neo4j, password: neo4j - **change this!**)

## 📚 **Documentation**

- **[Enhanced Graph Guide](docs/ENHANCED-LINEAGE-GRAPH.md)** - Comprehensive feature documentation
- **[Example Files](examples/)** - Sample configurations and responses
  - `custom-model-version-enhanced.json` - Custom model configuration
  - `enhanced-graph-response.json` - Graph response format

## 🛠️ **Troubleshooting**

### Common Issues

**"Permission denied" on startup scripts**
```bash
chmod +x start-dev.sh start-prod.sh
```

**"Port already in use"**
```bash
lsof -ti:8080 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**"Rollup failed to resolve import 'react-bootstrap'"**
```bash
cd client && npm install && npm run build
```

**Authentication issues**
- Check browser console for debug logs
- Verify API token has correct permissions
- Ensure DataRobot endpoint is accessible

**Build failures**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
cd client && rm -rf node_modules package-lock.json && npm install
```

### Health Checks
- **API Health**: http://localhost:8080/auth/check
- **Frontend**: http://localhost:5173 (dev) or http://localhost:8080 (prod)
- **Logs**: Check `logs/backend.log` and `logs/frontend.log`

## 🏗️ **Architecture**

**Frontend**: React 19.0.0 + Vite + vis-network + React Bootstrap
**Backend**: Node.js + Express + Neo4j Driver
**MCP**: Python 3.11.8 + MCP
**Authentication**: Enhanced Bearer token handling with debug logging

---

**Need help?** Check the [Enhanced Graph Guide](docs/ENHANCED-LINEAGE-GRAPH.md) for detailed feature documentation.
