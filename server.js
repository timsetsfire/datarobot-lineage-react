const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const os = require("os");
const utils = require("./utils/utils.js");
const chat = require("./utils/chat.js");
const gdb = require("./utils/gdb.js");
require('dotenv').config();

// Function to get all available IP addresses
function getAllIPAddresses() {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const interface of interfaces) {
      // Skip internal addresses and non-IPv4
      if (!interface.internal && interface.family === 'IPv4') {
        addresses.push({
          name: interfaceName,
          address: interface.address
        });
      }
    }
  }
  return addresses;
}

const app = express();

app.use(cors());
app.use(express.json());

// Set up Axios to enable communication with the DataRobot
axios.defaults.baseURL = process.env.DATAROBOT_ENDPOINT;
axios.defaults.headers.common = {
  Authorization: `Bearer ${process.env.DATAROBOT_API_TOKEN}`,
};



// Set us some of the App variables
const PORT = process.env.PORT || 8080;
console.log(`__DIRNAME = ${__dirname}`)
console.log(`🔧 DEBUG: process.env.PORT = "${process.env.PORT}"`)
console.log(`🔧 DEBUG: Using PORT = ${PORT}`)
// Root route for React app (specific routes handled by catch-all at end)

// Enhanced auth check endpoint (optional)
app.get("/auth/check", async (req, res) => {
  const startTime = Date.now();
  console.log(`\n🔍 GET /auth/check - ${new Date().toISOString()}`);
  console.log(`📋 Headers: token=${req.headers.token ? 'present' : 'missing'}, endpoint=${req.headers.endpoint || 'missing'}`);
  
  const token = req.headers.token;
  const endpoint = req.headers.endpoint;
  
  if (!token || !endpoint) {
    return res.status(400).json({
      validToken: false,
      hasProjectAccess: false,
      roles: [],
      error: 'Missing token or endpoint in headers'
    });
  }

  try {
    // Test basic API access with a simple call
    const axiosClient = axios.create({
      baseURL: endpoint,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`⏳ Testing token validity with DataRobot...`);
    
    // Try to get user info first
    let userInfo = null;
    let userRoles = [];
    try {
      const userResponse = await axiosClient.get('account/users/me/');
      userInfo = userResponse.data;
      
      // Try to get user roles if available
      if (userInfo.username) {
        try {
          const rolesResponse = await axiosClient.get(`account/users/${userInfo.username}/roles/`);
          userRoles = rolesResponse.data.map(role => role.name);
        } catch (rolesError) {
          console.warn(`⚠️  Could not fetch user roles: ${rolesError.response?.status}`);
        }
      }
    } catch (userError) {
      console.warn(`⚠️  Could not fetch user info: ${userError.response?.status}`);
    }

    // Test access to use cases (main functionality)
    let hasProjectAccess = false;
    let useCaseError = null;
    try {
      await axiosClient.get('useCases?limit=1');
      hasProjectAccess = true;
    } catch (useCaseErr) {
      useCaseError = {
        status: useCaseErr.response?.status,
        message: useCaseErr.response?.data?.message || useCaseErr.message
      };
      
      if (useCaseErr.response?.status === 403) {
        console.warn(`🔒 User lacks permissions for use cases - may need backoffice/admin/project_viewer roles`);
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      validToken: true,
      hasProjectAccess: hasProjectAccess,
      roles: userRoles,
      userInfo: userInfo ? {
        username: userInfo.username,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName
      } : null,
      error: useCaseError ? `Access denied to use cases: ${useCaseError.message}` : null,
      recommendation: !hasProjectAccess ? 
        'Your token is valid but lacks permissions to fetch use cases. Please contact your DataRobot admin to request backoffice, admin, or project_viewer roles.' : 
        null
    };

    console.log(`✅ Auth check completed in ${duration}ms`);
    console.log(`👤 User: ${userInfo?.username || 'unknown'}`);
    console.log(`🎭 Roles: ${userRoles.join(', ') || 'none found'}`);
    console.log(`🔓 Use Case Access: ${hasProjectAccess ? 'Yes' : 'No'}`);
    
    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Auth check failed after ${duration}ms:`, error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        validToken: false,
        hasProjectAccess: false,
        roles: [],
        error: 'Invalid or expired token'
      });
    }

    res.status(500).json({
      validToken: false,
      hasProjectAccess: false,
      roles: [],
      error: 'Could not validate token - please check your DataRobot connection'
    });
  }
});

// Example of API
app.get("/getUseCases", async (req, res) => {
  const startTime = Date.now();
  console.log(`\n🔍 GET /getUseCases - ${new Date().toISOString()}`);
  console.log(`📋 Headers: token=${req.headers.token ? 'present' : 'missing'}, endpoint=${req.headers.endpoint || 'missing'}`);
  
  try {
    console.log(`⏳ Fetching use cases from DataRobot...`);
    const response = await utils.getUseCases(req.headers.token, req.headers.endpoint);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Use cases fetched successfully in ${duration}ms`);
    console.log(`📊 Found ${response?.length || 0} use cases:`);
    response?.forEach((useCase, index) => {
      console.log(`   ${index + 1}. ${useCase.name} (${useCase.id})`);
    });
    
    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Use cases fetch failed after ${duration}ms:`, error.message);
    
    // Handle permission errors gracefully
    if (error.message.startsWith('PERMISSION_ERROR:')) {
      console.error(`🔒 Permission denied - user may lack required DataRobot roles`);
      return res.status(200).json({
        usecases: [],
        warning: 'Could not retrieve use cases. Your token may lack the required permissions (backoffice, admin, or project_viewer roles).',
        error: {
          type: 'PERMISSION_DENIED',
          message: error.message.replace('PERMISSION_ERROR: ', ''),
          recommendation: 'Please contact your DataRobot administrator to request the appropriate roles.'
        }
      });
    }
    
    if (error.response) {
      // API responded with an error status
      if (error.response.status === 401) {
        return res.status(200).json({
          usecases: [],
          warning: 'Authentication failed. Please check your DataRobot token.',
          error: {
            type: 'AUTHENTICATION_FAILED',
            message: 'Invalid or expired token',
            recommendation: 'Please generate a new DataRobot API token.'
          }
        });
      }
      
      if (error.response.status === 403) {
        return res.status(200).json({
          usecases: [],
          warning: 'Access denied. Your token lacks the required permissions.',
          error: {
            type: 'ACCESS_DENIED',
            message: error.response.data?.message || 'Insufficient permissions',
            recommendation: 'Please contact your DataRobot administrator to request backoffice, admin, or project_viewer roles.'
          }
        });
      }
      
      return res.status(error.response.status).json({
        status: error.response.status,
        data: error.response.data,
        message: error.message,
      });
    } else if (error.request) {
      // No response received
      return res.status(500).json({
        message: "No response from DataRobot API - please check your endpoint URL and network connection",
        error: "Connection timeout or network error",
      });
    } else {
      // Other unexpected errors
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
});

app.post("/chat", async (req, res) => {
    const data = req.body;
    console.log("checking data")
    console.log(data)
    try {
      const graphChatAgent = await chat.getOrCreateGraphChatAgent()
      const stream = await graphChatAgent.stream(
        {
          messages: [{ role: "user", content: data.query }],
        },
        {
          streamMode: "values",
          configurable: { thread_id: data.threadId }
  
        }
      )
      result = []
      for await (const chunk of stream) {
        const lastMessage = chunk.messages[chunk.messages.length - 1];
        const type = lastMessage._getType();
        const content = lastMessage.content;
        const toolCalls = lastMessage.tool_calls;
        result.push( {type: type, content: content, toolCalls: toolCalls})
        console.dir({
          type,
          content,
          toolCalls
        }, { depth: null });
      }
      res.send(result);
    } catch (error) { 
      console.error("Error in chat route:", error);
      res.send([{ content: `I'm sorry Dave, i can't do that: ${error}` }]);
    }
    // res.send({"message": "Hello from the server!"});
})

app.get("/getUseCaseGraph", async (req, res) => {
  const startTime = Date.now();
  const useCaseId = req.query.useCaseId;
  
  console.log(`\n🔍 Building graph for use case ID: ${useCaseId}`);
  console.log(`📋 Request headers:`, { 
    token: req.headers.token ? 'present' : 'missing',
    endpoint: req.headers.endpoint || 'missing'
  });
  
  try {
    console.log(`⏳ Starting graph build...`);
    const graph = await utils.buildGraph(req.headers.token, req.headers.endpoint, req.query.useCaseId);
    
    const buildTime = Date.now() - startTime;
    console.log(`✅ Graph built in ${buildTime}ms`);
    console.log(`📊 Nodes: ${graph.nodes?.length || 0}, Edges: ${graph.edges?.length || 0}`);
    
    // Try to populate Neo4j (but don't fail the request if this fails)
    try { 
      console.log(`⏳ Populating Neo4j...`);
      await gdb.populateNeo4jGraph(graph)
      console.log(`✅ Neo4j populated successfully`);
    } catch(error) { 
      console.warn(`⚠️  Neo4j population failed (continuing anyway):`, error.message);
    }
    
    const totalTime = Date.now() - startTime;
          console.log(`🎉 Request completed in ${totalTime}ms\n`);
      res.json(graph);
    } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ Graph build failed after ${errorTime}ms:`, error.message);
    
    // Handle permission errors gracefully
    if (error.message.includes('PERMISSION_ERROR') || error.message.includes('permission')) {
      console.error(`🔒 Permission denied during graph build - user may lack required DataRobot roles`);
      return res.status(200).json({
        nodes: [],
        edges: [],
        warning: 'Could not build complete graph due to permission restrictions. Some assets may not be accessible.',
        error: {
          type: 'PERMISSION_DENIED',
          message: 'Insufficient permissions to access some use case assets',
          recommendation: 'Please contact your DataRobot administrator to request appropriate permissions for use case assets.'
        }
      });
    }
    
    if (error.response) {
      console.error(`📡 DataRobot API Error:`, error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        return res.status(200).json({
          nodes: [],
          edges: [],
          warning: 'Authentication failed while building graph.',
          error: {
            type: 'AUTHENTICATION_FAILED',
            message: 'Invalid or expired token',
            recommendation: 'Please generate a new DataRobot API token.'
          }
        });
      }
      
      if (error.response.status === 403) {
        return res.status(200).json({
          nodes: [],
          edges: [],
          warning: 'Access denied while building graph.',
          error: {
            type: 'ACCESS_DENIED',
            message: error.response.data?.message || 'Insufficient permissions',
            recommendation: 'Please contact your DataRobot administrator to request permissions for use case assets.'
          }
        });
      }
      
      return res.status(error.response.status).json({
        status: error.response.status,
        data: error.response.data,
        message: error.message,
      });
    } else if (error.request) {
      console.error(`🔌 No response from DataRobot API`);
      return res.status(500).json({
        message: "No response from DataRobot API - please check your endpoint URL and network connection",
        error: "Connection timeout or network error",
      });
    } else {
      console.error(`🐛 Unexpected error:`, error.stack || error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
});

// Clear cache endpoint
app.delete("/cache", async (req, res) => {
  const startTime = Date.now();
  console.log(`\n🗑️  DELETE /cache - ${new Date().toISOString()}`);
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const storageDir = path.join(__dirname, 'storage');
    
    console.log(`📂 Checking storage directory: ${storageDir}`);
    
    // Get all files in storage directory
    const files = await fs.readdir(storageDir);
    const cacheFiles = files.filter(file => 
      file.endsWith('-nodes.json') || file.endsWith('-edges.json')
    );
    
    console.log(`🔍 Found ${cacheFiles.length} cache files to delete:`, cacheFiles);
    
    if (cacheFiles.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`✅ No cache files found - cache is already clear (${duration}ms)`);
      return res.json({
        success: true,
        message: 'Cache is already clear',
        filesDeleted: 0,
        files: []
      });
    }
    
    // Delete each cache file
    const deletedFiles = [];
    for (const file of cacheFiles) {
      const filePath = path.join(storageDir, file);
      try {
        await fs.unlink(filePath);
        deletedFiles.push(file);
        console.log(`🗑️  Deleted: ${file}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete ${file}:`, error.message);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Cache cleared successfully in ${duration}ms`);
    console.log(`📊 Deleted ${deletedFiles.length}/${cacheFiles.length} files`);
    
    res.json({
      success: true,
      message: `Successfully cleared cache`,
      filesDeleted: deletedFiles.length,
      files: deletedFiles
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Cache clear failed after ${duration}ms:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// Serve static files AFTER all API routes are defined
app.use(express.static(path.join(__dirname, "client", "dist")));

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  const addresses = getAllIPAddresses();
  console.log(`\n🚀 Server running on:`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - Local:   http://127.0.0.1:${PORT}`);
  
  if (addresses.length > 0) {
    console.log(`\n📡 Network access:`);
    addresses.forEach(addr => {
      console.log(`  - ${addr.name.padEnd(8)}: http://${addr.address}:${PORT}`);
    });
  } else {
    console.log(`\n⚠️  No external network interfaces found`);
  }
  
  console.log(`\n💡 Try these if the network URLs don't work:`);
  console.log(`   - Check firewall settings`);
  console.log(`   - Use 'ipconfig getifaddr en0' or 'hostname -I' to find your IP`);
  console.log(`   - Connect from the same WiFi network\n`);
});

server.setTimeout(100000); // Set timeout to 30 seconds
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:8080`);
// });
