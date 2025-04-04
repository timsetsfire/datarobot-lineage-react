const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const utils = require("./utils/utils.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "client", "dist")));

// Set up Axios to enable communication with the DataRobot
axios.defaults.baseURL = process.env.DATAROBOT_ENDPOINT;
axios.defaults.headers.common = {
  Authorization: `Bearer ${process.env.DATAROBOT_API_TOKEN}`,
};

// Set us some of the App variables
const PORT = process.env.PORT || 8080;
console.log(`__DIRNAME = ${__dirname}`)
// Handle routes and serve the React app
app.get(["/", "/projects"], (req, res) => {
  console.log(path.join(__dirname, "client", "dist", "index.html"))
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// Example of API
app.get("/getUseCases", async (req, res) => {
  // console.log(req.headers)
  try {
    console.log("trying to get use cases")
    const response = await utils.getUseCases(req.headers.token, req.headers.endpoint);
    console.log("logging response")
    console.log(response)
    res.json(response);
  } catch (error) {
    if (error.response) {
      // API responded with an error status
      return res.status(error.response.status).json({
        status: error.response.status,
        data: error.response.data,
        message: error.message,
      });
    } else if (error.request) {
      // No response received
      return res.status(500).json({
        message: "No response from API",
        error: error.request,
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

app.get("/getUseCaseGraph", async (req, res) => {
  console.log(req.query)
  // console.log(req)
  try {
    console.log("trying to get use cases")
    const response = await utils.buildGraph(req.headers.token, req.headers.endpoint, req.query.useCaseId);
    console.log("use case retrieves")
    // console.log(response)
    res.json(response);
  } catch (error) {
    if (error.response) {
      console.error(error.response)
      // API responded with an error status
      return res.status(error.response.status).json({
        status: error.response.status,
        data: error.response.data,
        message: error.message,
      });
    } else if (error.request) {
      console.error(error.response)
      // No response received
      return res.status(500).json({
        message: "No response from API",
        error: error.request,
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
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:8080`);
});

server.setTimeout(100000); // Set timeout to 30 seconds
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:8080`);
// });
