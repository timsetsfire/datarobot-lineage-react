import axios from "axios";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced edge type mapping system
export const getTypedEdge = (parentLabel, childLabel, context = {}) => {
    const edgeTypeMap = {
        // Application relationships (most important for lineage clarity)
        'applications-deployments': 'USES_DEPLOYMENT',
        'applications-models': 'USES_MODEL', 
        'applications-projects': 'BUILT_FROM_PROJECT',
        'applications-datasets': 'REFERENCES_DATASET',
        'applications-vectorDatabases': 'USES_VECTOR_DB',
        'applications-registeredModels': 'USES_REGISTERED_MODEL',
        
        // Custom Application relationships
        'customApplications-deployments': 'USES_DEPLOYMENT',
        'customApplications-models': 'USES_MODEL',
        'customApplications-projects': 'BUILT_FROM_PROJECT',
        'customApplications-customApplicationSources': 'BUILT_FROM_SOURCE',
        
        // Core ML Pipeline relationships
        'datasets-projects': 'TRAINED_ON',
        'datasets-models': 'TRAINED_ON',
        'projects-models': 'BELONGS_TO_PROJECT',
        'models-deployments': 'DEPLOYS_MODEL',
        'registeredModels-deployments': 'DEPLOYS_REGISTERED_MODEL',
        'models-registeredModels': 'REGISTERED_FROM',
        'customModelVersion-registeredModels': 'REGISTERED_FROM',
        
        // Data relationships
        'datasource-datasets': 'SOURCED_FROM',
        'datastore-datasets': 'SOURCED_FROM',
        'recipes-datasets': 'PROCESSED_BY',
        'datastore-datasource': 'CONNECTS_TO',
        'datasource-recipes': 'PROCESSES_DATA_FROM',
        'datasets-recipes': 'PROCESSES_DATA_FROM',
        
        // Vector & LLM relationships
        'datasets-vectorDatabases': 'BUILT_FROM_DATASET',
        'vectorDatabases-llmBlueprint': 'USES_VECTOR_DB',
        'llm-llmBlueprint': 'USES_LLM',
        'playgrounds-llmBlueprint': 'CONFIGURED_IN_PLAYGROUND',
        'llm-playgrounds': 'EXPERIMENTS_WITH',
        
        // Custom model relationships
        'customApplicationSources-customModelVersion': 'BUILT_FROM_SOURCE',
        'vectorDatabases-customModelVersion': 'USES_VECTOR_DB',
        'deployments-customModelVersion': 'USES_DEPLOYMENT',
        'llmBlueprint-customModelVersion': 'USES_LLM_BLUEPRINT',
        'playgrounds-customModelVersion': 'CONFIGURED_IN_PLAYGROUND',
        'llm-customModelVersion': 'USES_LLM',
        
        // Query relationships  
        'dataEngineQueries-datasets': 'GENERATED_BY_QUERY'
    };
    
    const edgeKey = `${parentLabel}-${childLabel}`;
    return {
        type: edgeTypeMap[edgeKey] || 'IS_PARENT_OF',
        label: edgeTypeMap[edgeKey] || 'derives from',
        color: getEdgeColor(edgeTypeMap[edgeKey] || 'IS_PARENT_OF')
    };
};

// Color coding for different edge types
export const getEdgeColor = (edgeType) => {
    const colorMap = {
        // Application relationships - Orange family
        'USES_DEPLOYMENT': '#FF6B35',
        'USES_MODEL': '#FF8C42', 
        'BUILT_FROM_PROJECT': '#FFA500',
        'REFERENCES_DATASET': '#FFB84D',
        'USES_VECTOR_DB': '#FF7F50',
        'USES_REGISTERED_MODEL': '#FF9966',
        'BUILT_FROM_SOURCE': '#FFA366',
        
        // Core ML Pipeline - Blue family
        'TRAINED_ON': '#4A90E2',
        'BELONGS_TO_PROJECT': '#357ABD',
        'DEPLOYS_MODEL': '#2E5B89',
        'DEPLOYS_REGISTERED_MODEL': '#1E3A8A',
        'REGISTERED_FROM': '#60A5FA',
        
        // Data relationships - Green family
        'SOURCED_FROM': '#10B981',
        'CONNECTS_TO': '#059669',
        'PROCESSES_DATA_FROM': '#047857',
        'PROCESSED_BY': '#065F46',
        'GENERATED_BY_QUERY': '#34D399',
        
        // Vector & LLM - Purple family
        'BUILT_FROM_DATASET': '#8B46FF',
        'USES_VECTOR_DB': '#9333EA',
        'USES_LLM': '#A855F7',
        'USES_LLM_BLUEPRINT': '#B968F7',
        'CONFIGURED_IN_PLAYGROUND': '#C084FC',
        'EXPERIMENTS_WITH': '#D8B4FE',
        
        // Default
        'IS_PARENT_OF': '#6B7280'
    };
    
    return colorMap[edgeType] || '#6B7280';
};

// Visual styling for different edge types
export const getEdgeWidth = (edgeType) => {
    const widthMap = {
        'USES_DEPLOYMENT': 3,
        'USES_MODEL': 3,
        'USES_LLM_BLUEPRINT': 2,
        'BUILT_FROM_PROJECT': 2,
        'TRAINED_ON': 2,
        'DEPLOYS_MODEL': 2,
        'IS_PARENT_OF': 1
    };
    return widthMap[edgeType] || 1;
};

export const getEdgeDashes = (edgeType) => {
    const dashMap = {
        'REFERENCES_DATASET': [5, 5],  // Dashed for references
        'USES_VECTOR_DB': [3, 3],      // Dotted for vector relationships
        'EXPERIMENTS_WITH': [2, 2]     // Fine dots for experimental
    };
    return dashMap[edgeType] || false;
};

// url related functions 
const getApplicationUrl = (applicationId) => `applications/${applicationId}`
const getCustomApplicationUrl = (customApplicationId) => `customApplications/${customApplicationId}`
const getCustomModelVersionUrl = (customModelId, customModelVersionId) => `customModels/${customModelId}/versions/${customModelVersionId}`
const getDataStoreUrl = (dataStoreId) => `externalDataStores/${dataStoreId}`
const getDataSourceUrl = (dataSourceId) => `externalDataSources/${dataSourceId}`
const getDatasetUrl = (datasetId, datasetVersionId) => datasetVersionId ? `datasets/${datasetId}/versions/${datasetVersionId}` : `datasets/${datasetId}`
const getDeploymentUrl = (deploymentId) => `deployments/${deploymentId}`
const getLLMBlueprintsUrl = (playgroundId) => `genai/llmBlueprints/?playgroundId=${playgroundId}`
const getLLMBlueprintUrl = (llmBlueprintId) => `genai/llmBlueprints/${llmBlueprintId}/`
const getModelsFromProjectUrl = (projectId) => `projects/${projectId}/models`
const getModelFromProjectId = (modelId, projectId) => `projects/${projectId}/models/${modelId}`
const getPlaygroundUrl = (playgroundId) => `genai/playgrounds/${playgroundId}/`
const getProjectUrl = (projectId) => `projects/${projectId}`
const getVectorDatabaseUrl = (vectorDatabaseId) => `genai/vectorDatabases/${vectorDatabaseId}/`
const getRecipeUrl = (recipeId) => `recipes/${recipeId}`
const getRegisteredModelUrl = (registeredModelId, versionId) => `registeredModels/${registeredModelId}/versions/${versionId}`

const STORAGE = "./storage";

// Safe API request wrapper to handle permission and other errors gracefully
export async function safeRequest(fn, label) {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error) {
    const errorInfo = {
      status: error?.response?.status || 'Unknown',
      message: error?.response?.data?.message || error?.message || 'Unknown error',
      data: error?.response?.data || null
    };
    
    // Categorize the error type for better logging
    let errorType = 'Unknown';
    if (error?.response?.status === 401) {
      errorType = 'Authentication';
    } else if (error?.response?.status === 403) {
      errorType = 'Permission';
    } else if (error?.response?.status === 404) {
      errorType = 'Not Found';
    } else if (error?.response?.status >= 500) {
      errorType = 'Server';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      errorType = 'Network';
    }
    
    console.error(`❌ ${errorType} Error in ${label}:`, errorInfo.status, errorInfo.message);
    if (error?.response?.data && typeof error.response.data === 'object') {
      console.error(`📄 Error Details:`, JSON.stringify(error.response.data, null, 2));
    }
    
    return {
      success: false,
      error: errorInfo,
      errorType: errorType
    };
  }
}

// Enhanced permission-aware API wrapper
export async function safeAPICall(client, url, label, options = {}) {
  const { allowPartialFailure = true, isPermissionCritical = false } = options;
  
  return safeRequest(async () => {
    return await fetchDataWithRetry(client, url);
  }, label);
}

export function getUseCaseAssetsUrls(useCaseAssets) {

    // Helper function to filter assets by access
    const filterAccessibleAssets = (assets, assetType) => {
        if (!assets || !Array.isArray(assets)) return [];
        
        const accessible = assets.filter(item => {
            if (item.userHasAccess === false) {
                console.warn(`⚠️  Skipping inaccessible ${assetType}: ${item.id || item.applicationId || item.projectId || item.datasetId || 'unknown'}`);
                return false;
            }
            return true;
        });
        
        console.log(`📋 ${assetType}: Processing ${accessible.length} accessible out of ${assets.length} total`);
        return accessible;
    };

    const accessibleApplications = filterAccessibleAssets(useCaseAssets.applications, 'applications');
    const applications = accessibleApplications.map(item => getApplicationUrl(item.applicationId));
    
    const accessibleCustomApps = filterAccessibleAssets(useCaseAssets.customApplications, 'customApplications');
    const customApplications = accessibleCustomApps.map(item => getCustomApplicationUrl(item.id));
    
    const accessibleProjects = filterAccessibleAssets(useCaseAssets.projects, 'projects');
    const projects = accessibleProjects.map(item => getProjectUrl(item.projectId));
    
    const accessibleDatasets = filterAccessibleAssets(useCaseAssets.datasets, 'datasets');
    const datasets = accessibleDatasets.map(item => getDatasetUrl(item.datasetId, item.versionId));
    
    const accessibleDeployments = filterAccessibleAssets(useCaseAssets.deployments, 'deployments');
    const deployments = accessibleDeployments.map(item => getDeploymentUrl(item.id));
    
    const accessibleNotebooks = filterAccessibleAssets(useCaseAssets.notebooks, 'notebooks');
    const notebooks = accessibleNotebooks.map(item => `notebooks/${item.id}`);
    
    const accessiblePlaygrounds = filterAccessibleAssets(useCaseAssets.playgrounds, 'playgrounds');
    const playgrounds = accessiblePlaygrounds.map(item => getPlaygroundUrl(item.id));
    
    const accessibleVectorDatabases = filterAccessibleAssets(useCaseAssets.vectorDatabases, 'vectorDatabases');
    const vectorDatabases = accessibleVectorDatabases.map(item => getVectorDatabaseUrl(item.id));
    
    const accessibleRegisteredModels = filterAccessibleAssets(useCaseAssets.registeredModelVersions, 'registeredModels');
    const registeredModels = accessibleRegisteredModels.map(
        item => {
            const registeredModelId = item.id
            return item.versions.map(
                version => getRegisteredModelUrl(registeredModelId, version.id)
            )
        }
    ).flat();
    
    // Handle recipes differently as they might not have userHasAccess field
    const recipes = useCaseAssets.recipes ? 
        useCaseAssets.recipes
            .filter(item => item.entityType === "RECIPE")
            .map(item => getRecipeUrl(item.entityId)) : [];
    
    // Models are derived from projects, so if projects are filtered, models should be too
    const models = accessibleProjects.map(item => getModelsFromProjectUrl(item.projectId)).flat();
    
    const llmBlueprints = accessiblePlaygrounds.map(item => getLLMBlueprintsUrl(item.entityId)).flat();
    
    const sharedRoles = useCaseAssets.sharedRoles ? useCaseAssets.sharedRoles.map(item => ({ data: item })) : []
    
    const urls = {
        applications: applications,
        customApplications: customApplications,
        recipes: recipes,
        datasets: datasets,
        deployments: deployments,
        notebooks: notebooks,
        playgrounds: playgrounds,
        llmBlueprints: llmBlueprints,
        projects: projects,
        models: models,
        registeredModels: registeredModels,
        vectorDatabases: vectorDatabases,
        sharedRoles: sharedRoles
    }
    
    console.log(`📊 Final URL counts:`, Object.entries(urls).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.length : 0}`));
    
    return urls
}

//
export async function getUseCases(token, endpoint) {
    // Debug token format
    console.log(`🔍 DEBUG: Token length: ${token?.length || 'undefined'}`);
    console.log(`🔍 DEBUG: Token preview: "${token?.substring(0, 20)}..."`);
    console.log(`🔍 DEBUG: Token starts with 'Bearer'?: ${token?.startsWith('Bearer ')}`);
    
    // Clean up token - remove any existing "Bearer " prefix and trim whitespace
    const cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
    const authHeader = `Bearer ${cleanToken}`;
    
    console.log(`🔍 DEBUG: Clean token preview: "${cleanToken?.substring(0, 20)}..."`);
    console.log(`🔍 DEBUG: Final auth header: "${authHeader.substring(0, 30)}..."`);

    const axiosClient = axios.create({
        baseURL: endpoint, // Base URL for your API
        // timeout: 30000, // Increased timeout for better reliability
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

    // Use safeRequest wrapper for better error handling
    const result = await safeRequest(async () => {
        const response = await axiosClient.get("useCases");
        return response.data.data.map(item => ({ id: item.id, name: item.name }));
    }, 'Fetch Use Cases');

    if (!result.success) {
        // Check if it's a permission issue
        if (result.errorType === 'Authentication' || result.errorType === 'Permission') {
            throw new Error(`PERMISSION_ERROR: ${result.error.message}`);
        }
        // Re-throw other errors
        throw new Error(result.error.message);
    }

    return result.data;
}


export const fetchDataWithRetry = async (client, url, retries = 3) => {
    const fullUrl = `${client.getUri()}/${url.replace(/^\//, '')}`;
    const startTime = Date.now();
    
    console.log(`🌐 API Request: ${fullUrl}`);
    console.log(`📡 Method: GET | Timeout: ${client.defaults.timeout}ms`);
    
    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await client.get(url);
        const duration = Date.now() - startTime;
        
        console.log(`✅ API Success [${response.status}]: ${fullUrl}`);
        console.log(`⏱️  Duration: ${duration}ms | Size: ${JSON.stringify(response.data).length} chars`);
        console.log(`📊 Response preview: ${JSON.stringify(response.data).substring(0, 200)}...`);
        
        return response.data;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error.response) {
          console.error(`❌ API Error [${error.response.status}]: ${fullUrl}`);
          console.error(`⏱️  Duration: ${duration}ms | Error: ${error.response.statusText}`);
          console.error(`📄 Error Data: ${JSON.stringify(error.response.data)}`);
          
        // If it's a 404 (resource not found), don't retry - it won't come back
          if (error.response.status === 404) {
            console.warn(`💡 Resource not found - likely stale reference in use case data`);
          throw error;
          }
        } else if (error.request) {
          console.error(`🔌 Network Error: ${fullUrl} - No response received`);
          console.error(`⏱️  Duration: ${duration}ms`);
        } else {
          console.error(`🐛 Request Setup Error: ${error.message}`);
        }
        
        attempt++;
        if (attempt >= retries) {
          console.error(`💀 Max retries (${retries}) reached for: ${fullUrl}`);
          throw error;
        }
        
        const delayMs = 2000 * attempt; // Progressive delay: 2s, 4s, 6s
        console.log(`⏳ Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  };

  
export async function getUseCaseAssetsPromises(client, useCaseId) {
    const entitiesToUrls = { 
        applications: (id) => `useCases/${id}/applications`,
        customApplications: (id) => `useCases/${id}/customApplications`,
        customJobs: (id) => `useCases/${id}/customJobs`,
        recipes: (id) => `useCases/${id}/data`,
        datasets: (id) => `useCases/${id}/datasets`, 
        deployments: (id) => `useCases/${id}/deployments`, 
        notebooks: (id) => `useCases/${id}/notebooks`, 
        playgrounds: (id) => `useCases/${id}/playgrounds`, 
        projects:  (id) => `useCases/${id}/projects` , 
        registeredModelVersions: (id) => `useCases/${id}/registeredModels`, 
        vectorDatabases: (id) => `useCases/${id}/vectorDatabases`,
        // Add missing entity types that commonly appear in use cases
        datastores: (id) => `useCases/${id}/externalDataStores`,
        datasources: (id) => `useCases/${id}/externalDataSources`,
        customModels: (id) => `useCases/${id}/customModels`,
        predictionDatasets: (id) => `useCases/${id}/predictionDatasets`,
        challenges: (id) => `useCases/${id}/challenges`,
    }

    const useCase = await (client.get(`useCases/${useCaseId}`))

    const uce = Object.entries(useCase.data).filter(entry => entry[0].includes("Count")).filter( entry => entry[1] > 0 ).map( item => item[0].replace("Count", "")).filter( item => item !== "models")

    console.log(`🔍 Found entity types in use case:`, uce);
    console.log(`📋 Full use case data counts:`, Object.entries(useCase.data).filter(entry => entry[0].includes("Count")));
    
    // Filter out entity types that don't have URL mappings and log warnings
    const supportedEntities = uce.filter(entity => {
        if (entitiesToUrls[entity]) {
            return true;
        } else {
            console.warn(`⚠️  Skipping unsupported entity type: ${entity}`);
            return false;
        }
    });
    
    console.log(`✅ Processing supported entity types:`, supportedEntities);

    // Build URLs and log them
    const entityUrls = supportedEntities.map( entity => [entity, entitiesToUrls[entity](useCaseId)]);
    console.log(`🔗 Generated API URLs:`);
    entityUrls.forEach(([entityType, url]) => {
        console.log(`   ${entityType}: ${client.getUri()}/${url}`);
    });

    const value = entityUrls.map( item => [item[0], client.get(item[1])] )
    const sharedRoles = client.get(`useCases/${useCaseId}/sharedRoles`)
    value.push( ["sharedRoles", sharedRoles])
    return Object.fromEntries(value)
}

export async function getUseCaseAssets(promise) {
    const results = {};
    const useCasePromises = await promise;
    for (const assetType in useCasePromises) {
        if (useCasePromises.hasOwnProperty(assetType)) {
            const result = await useCasePromises[assetType]
            results[assetType] = result.data
            
            // Debug custom applications specifically 
            if (assetType === 'customApplications') {
                console.log(`🔍 Custom Applications found in use case:`, result.data);
                if (result.data && result.data.data) {
                    console.log(`📱 Custom Application IDs:`, result.data.data.map(app => app.id));
                }
            }
        }
    }
    return results
}

async function getRemaining(client, useCaseAsset) {
    
    const remainingAssets = []

    const totalCount = useCaseAsset.totalCount
    const count = useCaseAsset.count 
    if(!useCaseAsset.next) { 
        return useCaseAsset
    }
    
    const next = []
    const nextUrl = useCaseAsset.next.replace(client.getUri(), "")
    for (let i = count; i < totalCount; i += count) {
        const url = nextUrl.replace("offset=100", `offset=${i}`)
        next.push(client.get(url))
    }
    const nextResponses = await Promise.all(next)
    nextResponses.map(item => Array.prototype.push.apply(remainingAssets, item.data.data))
    Array.prototype.push.apply(useCaseAsset.data, remainingAssets)
    return useCaseAsset
}

export async function getUseCaseAssetsPart2(client, useCaseAssets) { 
    const useCaseAssetsComplete = Object.fromEntries(await Promise.all( Object.entries(useCaseAssets).map(async ([entityType, data]) => [entityType, getRemaining(client, data)] )))
    const results = {};
    for ( const entry in useCaseAssetsComplete) {
        if (useCaseAssetsComplete.hasOwnProperty(entry)) {
            const result = await useCaseAssetsComplete[entry]
            results[entry] = result.data
        }
    }
    return results
}

export async function getUseCaseData(client, useCaseAssetsUrls) { 

    const promises = {}
    for( const k in useCaseAssetsUrls) { 
        if(useCaseAssetsUrls.hasOwnProperty(k)) { 
            const requests = useCaseAssetsUrls[k].map( async (url) => {
                const result = await safeRequest(async () => {
                    return await fetchDataWithRetry(client, url);
                }, `Fetch ${k} from ${url}`);
                
                if (!result.success) {
                    console.warn(`⚠️  Failed to fetch ${k} from ${url}: ${result.error.status} ${result.error.message}`);
                    if (result.errorType === 'Permission' || result.errorType === 'Authentication') {
                        console.warn(`🔒 Permission denied for ${k} - user may lack required roles`);
                    }
                    console.warn(`💡 Continuing with partial data...`);
                    return null; // Return null for failed requests instead of throwing
                }
                
                return result.data;
            })
            promises[k] = requests
        }
    }
    const data = {}
    for( const k in promises) { 
        if(promises.hasOwnProperty(k)) { 
            // Use Promise.allSettled instead of Promise.all for better error handling
            const results = await Promise.allSettled(promises[k])
            const resolvedResults = results
                .filter(result => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);
            
            // Log any failures
            const failedResults = results.filter(result => result.status === 'rejected');
            if (failedResults.length > 0) {
                console.warn(`⚠️  ${failedResults.length} ${k} requests failed - continuing with partial data`);
            }
            
            data[k] = resolvedResults;
            if(k === "llmBlueprints") {
                data[k] = data[k].map( item => item.data ).flat() 
            }
        }
    }
    return data

}

//todo add applications and custom applications

// get nodes
export async function getApplicationNode(client, useCaseData, nodes, applicationId) { 
    const baseUrl = client.getUri().replace("/api/v2", "")
    const app = useCaseData.applications.filter(item => item.id ===  applicationId)[0]
    const application = app ? app : await fetchDataWithRetry(client, getApplicationUrl(applicationId))
    
    // Enhanced relationship extraction
    const relatedDeploymentIds = application.deploymentIds || []
    const relatedEntities = application.relatedEntities || {}
    const relatedModelId = relatedEntities.modelId 
    const relatedProjectId = relatedEntities.projectId
    const referencedDatasets = application.datasets || []
    const sources = application.sources || []
    
    const parents = []
    
    // Direct model relationship
    if (relatedModelId) { 
        const modelNode = await getModelNode(client, useCaseData, nodes, relatedModelId, relatedProjectId)
        parents.push({
            ...modelNode,
            edgeType: getTypedEdge('applications', 'models')
        })
    }
    
    // Direct project relationship
    if (relatedProjectId) {
        const projectNode = await getProjectNode(client, useCaseData, nodes, relatedProjectId)
        parents.push({
            ...projectNode,
            edgeType: getTypedEdge('applications', 'projects')
        })
    }
    
    // Deployment relationships
    if (relatedDeploymentIds.length > 0) {
        for (const deploymentId of relatedDeploymentIds) {
            const deploymentNode = await getDeploymentNode(client, useCaseData, nodes, deploymentId)
            parents.push({
                ...deploymentNode,
                edgeType: getTypedEdge('applications', 'deployments')
            })
        }
    }
    
    // Dataset references
    if (referencedDatasets.length > 0) {
        for (const dataset of referencedDatasets) {
            const datasetNode = await getDatasetNode(client, useCaseData, nodes, dataset.datasetId, dataset.versionId)
            parents.push({
                ...datasetNode,
                edgeType: getTypedEdge('applications', 'datasets')
            })
        }
    }
    
    // Vector database relationships (inferred from sources)
    const vectorDbSources = sources.filter(source => 
        source.source === "deployment" && 
        source.deploymentType === "vector_search"
    )
    
    for (const vdbSource of vectorDbSources) {
        // Find associated vector databases
        const relatedVectorDbs = useCaseData.vectorDatabases?.filter(vdb => 
            vdbSource.deploymentId && vdb.deploymentId === vdbSource.deploymentId
        ) || []
        
        for (const vdb of relatedVectorDbs) {
            const vdbNode = await getVectorDatabaseNode(client, useCaseData, nodes, vdb.id)
            parents.push({
                ...vdbNode,
                edgeType: getTypedEdge('applications', 'vectorDatabases')
            })
        }
    }
    
    return { 
        id: applicationId, 
        label: "applications", 
        name: application.name, 
        url: path.join(baseUrl, "useCases", useCaseData.useCaseId, "overview/apps/no-code-applications"), 
        assetId: applicationId, 
        apiPayload: application, 
        parents: parents, 
        useCaseId: useCaseData.useCaseId, 
        useCaseName: useCaseData.useCaseName,
        
        // Enhanced metadata for lineage
        applicationTypes: sources.map(s => s.source),
        deploymentIds: relatedDeploymentIds,
        relatedEntities: relatedEntities,
        referencedDatasets: referencedDatasets
    }   
}

export async function getCustomApplicationNode(client, useCaseData, nodes, customApplicationId) { 
    const baseUrl = client.getUri().replace("/api/v2", "")
    const app = useCaseData.applications.filter(item => item.id ===  customApplicationId)[0]
    const application = app ? app : await fetchDataWithRetry(client, getCustomApplicationUrl(customApplicationId))    
    return { 
        id: customApplicationId, 
        label: "customApplications", 
        name: application.name, 
        url: application.applicationUrl, 
        assetId: customApplicationId, 
        apiPayload: application, 
        parents: [ getCustomApplicationSourceNode(client, useCaseData, nodes, application.customApplicationSourceId, application.customApplicationSourceVersionId, customApplicationId)], 
        useCaseId: useCaseData.useCaseId, 
        useCaseName: useCaseData.useCaseName
    }
}

export async function getCustomApplicationSourceNode(client, useCaseData, nodes, sourceId, sourceVersionId, customApplicationId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    return { 
        id: `${sourceId}-${sourceVersionId}`, 
        label: "customApplicationSources", 
        name: "custom-app-source",
        url: path.join(baseUrl, "registry/applications", sourceId, "app-info", customApplicationId), 
        assetId: sourceId, 
        assetVersionId: sourceVersionId,
        apiPayload: {},
        parents: [], 
        useCaseId: useCaseData.useCaseId, 
        useCaseName: useCaseData.useCaseName
    }
}

export async function getDataStoreNode(client, useCaseData, nodes, datastoreId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const ds = useCaseData.datastores.filter(item => item.id ===  datastoreId)[0]
    const datastore = ds ? ds : await fetchDataWithRetry(client, getDataStoreUrl(datastoreId))

    return {
        id: datastoreId,
        label: "datastore",
        name: datastore.canonicalName,
        url: path.join(baseUrl, "account", "data-connections",), 
        assetId: datastoreId,
        driverClassType: datastore.driverClassType,
        apiPayload: datastore, 
        parents: [],
        apiUrl: path.join(client.getUri(), getDataStoreUrl(datastoreId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getDataSourceNode(client, useCaseData, nodes, dataSourceId, dataStoreId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const ds = useCaseData.datasources.filter(item => item.id ===  dataSourceId)[0]
    const datasource = ds ? ds : await fetchDataWithRetry(client, getDataSourceUrl(dataSourceId))
    const name = datasource.canonicalName
    const dsStoreId = dataStoreId ? dataStoreId : datasource.params.dataStoreId
    const parentNode = nodes.dataStores[dsStoreId] ? nodes.dataStores[dsStoreId] : getDataStoreNode(client, useCaseData, nodes, dsStoreId)
    return {
        id: dataSourceId,
        label: "datasource",
        name: name, 
        url: path.join(baseUrl, "account", "data-connections"),
        assetId: dataSourceId,
        apiPayload: datasource,
        parents: [parentNode],
        apiUrl: path.join(client.getUri(), getDataSourceUrl(dataSourceId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getRecipeNode(client, useCaseData, nodes, recipeId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const recipe = useCaseData.recipes.filter(item => item.recipeId === recipeId)[0]
    const node = recipe ? recipe : await fetchDataWithRetry(client, getRecipeUrl(client, recipeId))
    const inputs = node.inputs
    const parents = []
    inputs.forEach(
        input => {
            if (input.inputType === "datasource") {
                const dataSourceId = input.dataSourceId
                const dataStoreId = input.dataStoreId
                const dataSourceNode = nodes.dataSources[input.dataSourceId]
                parents.push( dataSourceNode ? dataSourceNode : getDataSourceNode(client, useCaseData, nodes, input.dataSourceId, input.dataStoreId))
            } else if (input.inputType === "dataset") {
                const datasetId = input.datasetId
                const datasetVersionId = input.versionId
                const datasetNode = nodes.datasets[`${datasetId}-${datasetVersionId}`]
                parents.push(datasetNode ? datasetNode : getDatasetNode(client, useCaseData, nodes, input.datasetId, input.datasetVersionId))
            }
        }
    )
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "wrangler", recipeId)
    return {
        id: recipeId,
        label: "recipes",
        name: node.name,
        url: url,
        assetId: recipeId,
        apiPayload: node, 
        parents: parents,
        apiUrl: path.join(client.getUri(), getRecipeUrl(recipeId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getDatasetNode(client, useCaseData, nodes, datasetId, datasetVersionId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    
    // Add null checks for datasetId
    if (!datasetId || datasetId === 'null') {
        console.warn(`⚠️  Invalid datasetId: ${datasetId}, creating placeholder node`);
        return {
            id: `invalid-dataset-${datasetVersionId || 'unknown'}`,
            label: "datasets",
            name: "Invalid Dataset",
            url: `${baseUrl}/registry/data`,
            assetId: datasetId || 'unknown',
            assetVersionId: datasetVersionId || 'unknown',
            apiPayload: { error: 'Invalid dataset ID' },
            parents: [],
            useCaseId: useCaseData.useCaseId,
            useCaseName: useCaseData.useCaseName,
            error: 'Invalid dataset ID'
        };
    }
    
    const ds = useCaseData.datasets.filter(item => item.datasetId === datasetId & item.versionId === datasetVersionId)[0]
    try {
        const dataset = ds ? ds : await fetchDataWithRetry(client, getDatasetUrl(datasetId, datasetVersionId))
        const recipeId = dataset.recipeId
        const dataSourceId = dataset.dataSourceId
        const dataEngineQueryId = dataset.dataEngineQueryId
        const parents = []
        if (recipeId) {
            const recipeNode = nodes.recipes[recipeId]
            parents.push( recipeNode ? recipeNode : getRecipeNode(client, useCaseData, nodes, recipeId))
        }
        if (dataSourceId) {
            const dataSourceNode = nodes.dataSources[dataSourceId]
            parents.push(dataSourceNode ? dataSourceNode : getDataSourceNode(client,  useCaseData, nodes, dataSourceId))
        }
        if (dataEngineQueryId) {
            parents.push({ label: "dataEngineQueries", assetId: dataEngineQueryId, id: dataEngineQueryId, parents : []})
        }
        return {
            id: `${datasetId}-${dataset.versionId}`,
            label: "datasets",
            name: dataset.name,
            url: path.join(baseUrl, "registry", "data", datasetId),
            assetId: datasetId,
            assetVersionId: dataset.versionId,
            apiPayload: dataset,
            parents: parents,
            apiUrl: path.join(client.getUri(), getDatasetUrl(datasetId, datasetVersionId)),
            useCaseId: useCaseData.useCaseId,
            useCaseName: useCaseData.useCaseName

        }
    } catch (error) {
        console.log(error)
        console.log(`some error with dataset ${datasetId}`)
        
        // Add null check here too for the error case
        const safeDatasetId = datasetId || 'unknown';
        const safeVersionId = datasetVersionId || 'unknown';
        
        return { 
            id: `${safeDatasetId}-${safeVersionId}`,
            label: "datasets",
            name: `Error Dataset (${safeDatasetId})`,
            url: path.join(baseUrl, "registry", "data", safeDatasetId),
            assetId: safeDatasetId,
            assetVersionId: safeVersionId, 
            parents: [],
            useCaseId: useCaseData.useCaseId,
            useCaseName: useCaseData.useCaseName,
            error: error
        }
    }
}

export async function getVectorDatabaseNode(client, useCaseData, nodes, vdbId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const vdb = useCaseData.vectorDatabases.filter(item => item.entityId === vdbId)[0]
    const vectorDatabase = vdb ? vdb : await fetchDataWithRetry(client, getVectorDatabaseUrl(vdbId))
    const datasetId = vectorDatabase.datasetId
    
    // Add null check and proper parameter passing for getDatasetNode
    let datasetNode = null;
    if (datasetId && datasetId !== 'null') {
        const datasetVersionId = vectorDatabase.datasetVersionId; // Get version ID if available
        const nodeKey = datasetVersionId ? `${datasetId}-${datasetVersionId}` : datasetId;
        datasetNode = nodes.datasets[nodeKey] ? nodes.datasets[nodeKey] : getDatasetNode(client, useCaseData, nodes, datasetId, datasetVersionId);
    } else {
        console.warn(`⚠️  Vector database ${vdbId} has invalid datasetId: ${datasetId}`);
        // Create a placeholder dataset node
        datasetNode = {
            id: `placeholder-dataset-${vdbId}`,
            label: "datasets",
            name: "No Dataset",
            parents: [],
            error: 'No valid dataset reference'
        };
    }
    
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "vector-databases", vdbId, `?versionId=${vectorDatabase.id}`)
    return {
        id: `${vectorDatabase.familyId}-${vectorDatabase.id}`,
        label: "vectorDatabases",
        name: vectorDatabase.name,
        url: url,
        assetId: vectorDatabase.familyId,
        assetVersionId: vectorDatabase.id,
        apiPayload: vectorDatabase,
        parents: datasetNode ? [datasetNode] : [], 
        apiUrl: path.join(client.getUri(), getVectorDatabaseUrl(vdbId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getProjectNode(client, useCaseData, nodes, projectId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const p = useCaseData.projects.filter(item => item.id === projectId)[0]
    const project = p ? p : await fetchDataWithRetry(client, getProjectUrl(projectId))
    const datasetId = project.catalogId;
    const datasetVersionId = project.catalogVersionId;
    const parents = []
    const url = path.join(baseUrl, "projects", projectId)
    if (datasetId) {
        const datasetNode = nodes.datasets[`${datasetId}-${datasetVersionId}`]
        parents.push(datasetNode ? datasetNode : getDatasetNode(client, useCaseData, nodes, datasetId, datasetVersionId))
    }
    return {
        id: project.id,
        label: "projects",
        name: project.projectName,
        url: url,
        assetId: project.id,
        targetType: project.targetType,
        datasource: datasetId ? "registry" : "local",
        apiPayload: project,
        parents: parents,
        apiUrl: path.join(client.getUri(), getProjectUrl(projectId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getModelNode(client, useCaseData, nodes, modelId, projectId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const m = useCaseData.models.filter(item => item.id === modelId)[0]
    
    let model = m;
    if (!model) {
        // Use safeRequest wrapper to handle errors gracefully
        const result = await safeRequest(async () => {
            return await fetchDataWithRetry(client, `projects/${projectId}/models/${modelId}`);
        }, `Fetch Model ${modelId} from Project ${projectId}`);
        
        if (!result.success) {
            console.warn(`⚠️  Failed to fetch model ${modelId} from project ${projectId}: ${result.error.message}`);
            // Return a placeholder model node if fetch fails
            return {
                id: modelId,
                label: "models",
                name: `Error Model (${modelId})`,
                url: path.join(baseUrl, "projects", projectId, "models", modelId),
                assetId: modelId,
                apiPayload: { error: result.error.message },
                parents: [],
                apiUrl: path.join(client.getUri(), `projects/${projectId}/models/${modelId}`),
                useCaseId: useCaseData.useCaseId,
                useCaseName: useCaseData.useCaseName,
                error: result.error
            };
        }
        model = result.data;
    }
    
    const projectNode = nodes.projects[projectId]
    const parents = [ projectNode ? projectNode : getProjectNode(client, useCaseData, nodes, projectId)]
    
    return {
        id: modelId,
        label: "models",
        name: `${model.modelType} ${model.modelNumber}`,
        url: path.join(baseUrl, "projects", projectId, "models", modelId),
        assetId: modelId,
        apiPayload: model,
        parents: parents,
        apiUrl: path.join(client.getUri(), `projects/${projectId}/models/${modelId}`),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getCustomModelVersionNode(client, useCaseData, nodes, customModelId, customModelVersionId, customModelVersionLabel) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    let cmvId = customModelVersionId
    let customModelVersion = null
    
    if (customModelVersionLabel) {
        const versionsResult = await safeRequest(async () => {
            return await fetchDataWithRetry(client, `customModels/${customModelId}/versions`);
        }, `Fetch Custom Model Versions ${customModelId}`);
        
        if (!versionsResult.success) {
            console.warn(`⚠️  Failed to fetch custom model versions for ${customModelId}: ${versionsResult.error.message}`);
            return {
                id: `${customModelId}-error`,
                label: "customModelVersion",
                name: `Error Custom Model (${customModelId})`,
                url: path.join(baseUrl, "registry", "custom-model-workshop", customModelId, "versions", "error"),
                assetId: customModelId,
                assetVersionId: "error",
                apiPayload: { error: versionsResult.error.message },
                parents: [],
                apiUrl: path.join(client.getUri(), `customModels/${customModelId}/versions`),
                useCaseId: useCaseData.useCaseId,
                useCaseName: useCaseData.useCaseName,
                error: versionsResult.error
            };
        }
        
        customModelVersion = versionsResult.data["data"].filter(item => item.label === customModelVersionLabel)[0]
        cmvId = customModelVersion.id
    } else if (customModelVersionId) {
        const versionResult = await safeRequest(async () => {
            return await fetchDataWithRetry(client, getCustomModelVersionUrl(customModelId, customModelVersionId));
        }, `Fetch Custom Model Version ${customModelId}/${customModelVersionId}`);
        
        if (!versionResult.success) {
            console.warn(`⚠️  Failed to fetch custom model version ${customModelId}/${customModelVersionId}: ${versionResult.error.message}`);
            customModelVersion = { error: versionResult.error.message };
        } else {
            customModelVersion = versionResult.data;
        }
    }
    
    const modelResult = await safeRequest(async () => {
        return await fetchDataWithRetry(client, `customModels/${customModelId}`);
    }, `Fetch Custom Model ${customModelId}`);
    
    if (!modelResult.success) {
        console.warn(`⚠️  Failed to fetch custom model ${customModelId}: ${modelResult.error.message}`);
        return {
            id: `${customModelId}-${cmvId}`,
            label: "customModelVersion",
            name: `Error Custom Model (${customModelId})`,
            url: path.join(baseUrl, "registry", "custom-model-workshop", customModelId, "versions", cmvId),
            assetId: customModelId,
            assetVersionId: cmvId,
            apiPayload: { error: modelResult.error.message },
            parents: [],
            apiUrl: path.join(client.getUri(), `customModels/${customModelId}/versions`),
            useCaseId: useCaseData.useCaseId,
            useCaseName: useCaseData.useCaseName,
            error: modelResult.error
        };
    }
    
    let customModel = modelResult.data;
    
    // Parse configuration fields from runtimeParameters to build rich relationships
    const parents = [];
    const configFields = {};
    
    // Extract configuration values from runtimeParameters
    if (customModelVersion && customModelVersion.runtimeParameters) {
        console.log(`🔍 Parsing ${customModelVersion.runtimeParameters.length} runtime parameters for custom model version ${cmvId}`);
        
        customModelVersion.runtimeParameters.forEach(param => {
            const fieldName = param.fieldName;
            const value = param.currentValue || param.overrideValue || param.defaultValue;
            
            if (value && value !== 'null' && value !== null && String(value).trim() !== '') {
                configFields[fieldName] = value;
                console.log(`📋 Found runtime parameter: ${fieldName} = ${value}`);
            }
        });
    }
    
    // Also check for top-level playgroundId field
    if (customModelVersion && customModelVersion.playgroundId) {
        configFields.PLAYGROUND_ID = customModelVersion.playgroundId;
        console.log(`📋 Found top-level playgroundId: ${customModelVersion.playgroundId}`);
    }
    
    // Create relationships based on configuration fields
    console.log(`🔗 Building relationships for custom model version ${cmvId} with ${Object.keys(configFields).length} config fields`);
    
    // 1. Vector Database relationship
    if (configFields.VECTOR_DATABASE_ID) {
        try {
            const vdbNode = nodes.vectorDatabases ? nodes.vectorDatabases[configFields.VECTOR_DATABASE_ID] : null;
            const vectorDbNode = vdbNode ? vdbNode : await getVectorDatabaseNode(client, useCaseData, nodes, configFields.VECTOR_DATABASE_ID);
            parents.push({
                ...vectorDbNode,
                edgeType: getTypedEdge('vectorDatabases', 'customModelVersion')
            });
            console.log(`🔗 Added vector database relationship: ${configFields.VECTOR_DATABASE_ID}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create vector database relationship for ${configFields.VECTOR_DATABASE_ID}:`, error.message);
        }
    }
    
    // 2. Vector Database Deployment relationship
    if (configFields.VECTOR_DATABASE_DEPLOYMENT_ID) {
        try {
            const depNode = nodes.deployments ? nodes.deployments[configFields.VECTOR_DATABASE_DEPLOYMENT_ID] : null;
            const deploymentNode = depNode ? depNode : await getDeploymentNode(client, useCaseData, nodes, configFields.VECTOR_DATABASE_DEPLOYMENT_ID);
            parents.push({
                ...deploymentNode,
                edgeType: getTypedEdge('deployments', 'customModelVersion')
            });
            console.log(`🔗 Added deployment relationship: ${configFields.VECTOR_DATABASE_DEPLOYMENT_ID}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create deployment relationship for ${configFields.VECTOR_DATABASE_DEPLOYMENT_ID}:`, error.message);
        }
    }
    
    // 3. LLM Blueprint relationship
    if (configFields.LLM_BLUEPRINT_ID) {
        try {
            const llmBpNode = nodes.llmBlueprints ? nodes.llmBlueprints[configFields.LLM_BLUEPRINT_ID] : null;
            const llmBlueprintNode = llmBpNode ? llmBpNode : await getLlmBlueprintNode(client, useCaseData, nodes, configFields.LLM_BLUEPRINT_ID);
            parents.push({
                ...llmBlueprintNode,
                edgeType: getTypedEdge('llmBlueprint', 'customModelVersion')
            });
            console.log(`🔗 Added LLM blueprint relationship: ${configFields.LLM_BLUEPRINT_ID}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create LLM blueprint relationship for ${configFields.LLM_BLUEPRINT_ID}:`, error.message);
        }
    }
    
    // 4. Playground relationship (check both runtime parameter and top-level field)
    if (configFields.PLAYGROUND_ID) {
        try {
            const pgNode = nodes.playgrounds ? nodes.playgrounds[configFields.PLAYGROUND_ID] : null;
            const playgroundNode = pgNode ? pgNode : await getPlaygroundNode(client, useCaseData, nodes, configFields.PLAYGROUND_ID);
            parents.push({
                ...playgroundNode,
                edgeType: getTypedEdge('playgrounds', 'customModelVersion')
            });
            console.log(`🔗 Added playground relationship: ${configFields.PLAYGROUND_ID}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create playground relationship for ${configFields.PLAYGROUND_ID}:`, error.message);
        }
    }
    
    // 5. LLM relationship
    if (configFields.LLM_ID) {
        try {
            const llmNode = await getLlmNode(client, useCaseData, configFields.LLM_ID);
            parents.push({
                ...llmNode,
                edgeType: getTypedEdge('llm', 'customModelVersion')
            });
            console.log(`🔗 Added LLM relationship: ${configFields.LLM_ID}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create LLM relationship for ${configFields.LLM_ID}:`, error.message);
        }
    }
    
    console.log(`✅ Custom model version ${cmvId} created with ${parents.length} typed relationships`);
    
    const url = path.join(baseUrl, "registry", "custom-model-workshop", customModelId, "versions", cmvId)
    return {
        id: `${customModelId}-${cmvId}`,
        label: "customModelVersion",
        name: customModel.name,
        url: url,
        assetId: customModelId,
        assetVersionId: cmvId,
        apiPayload: {...customModel, ...customModelVersion},
        parents: parents,
        configFields: configFields, // Store extracted config for debugging
        apiUrl: path.join(client.getUri(), `customModels/${customModelId}/versions`),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getRegisteredModelNode(client, useCaseData, nodes, regModelId, regModelVersionId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const m = useCaseData.registeredModels.filter(item => item.registeredModelId === regModelId & item.id === regModelVersionId)[0]
    
    let regModel = m;
    if (!regModel) {
        const result = await safeRequest(async () => {
            return await fetchDataWithRetry(client, getRegisteredModelUrl(regModelId, regModelVersionId));
        }, `Fetch Registered Model ${regModelId}/${regModelVersionId}`);
        
        if (!result.success) {
            console.warn(`⚠️  Failed to fetch registered model ${regModelId}/${regModelVersionId}: ${result.error.message}`);
            return {
                id: `${regModelId}-${regModelVersionId}`,
                label: "registeredModels",
                name: `Error Registered Model (${regModelId})`,
                url: path.join(baseUrl, "registry", "registered-models", regModelId, "version", regModelVersionId, "info"),
                assetId: regModelId,
                assetVersionId: regModelVersionId,
                apiPayload: { error: result.error.message },
                parents: [],
                apiUrl: path.join(client.getUri(), getRegisteredModelUrl(regModelId, regModelVersionId)),
                useCaseId: useCaseData.useCaseId,
                useCaseName: useCaseData.useCaseName,
                error: result.error
            };
        }
        regModel = result.data;
    }
    
    const source = regModel.sourceMeta?.projectId ? "project" : "customModel"
    const parents = []
    if (source === "project") {
        const projectId = regModel.sourceMeta.projectId
        const modelId = regModel.modelId
        const modelNode = nodes.models[modelId]
        parents.push( modelNode ? modelNode : getModelNode(client, useCaseData, nodes, modelId, projectId))
    } else {
        const customModelId = regModel.sourceMeta?.customModelDetails?.id
        const versionLabel = regModel.sourceMeta?.customModelDetails?.versionLabel
        if (customModelId) {
        parents.push(getCustomModelVersionNode(client, useCaseData, nodes, customModelId, undefined, versionLabel))
        }
    }
    const url = regModelVersionId ? path.join(baseUrl, "registry", "registered-models", regModelId, "version", regModelVersionId, "info") : path.join(baseUrl, "registry", "registered-models", regModelId)
    return {
        id: `${regModelId}-${regModelVersionId}`,
        label: "registeredModels",
        name: regModel.name,
        url: url,
        assetId: regModelId,
        assetVersionId: regModelVersionId,
        apiPayload: regModel,
        parents: parents,
        apiUrl: path.join(client.getUri(), getRegisteredModelUrl(regModelId, regModelVersionId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }

}

export async function getDeploymentNode(client, useCaseData, nodes, deploymentId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const dep = useCaseData.deployments.filter(item => item.id === deploymentId)[0]
    
    let deployment = dep;
    if (!deployment) {
        const result = await safeRequest(async () => {
            return await fetchDataWithRetry(client, getDeploymentUrl(deploymentId));
        }, `Fetch Deployment ${deploymentId}`);
        
        if (!result.success) {
            console.warn(`⚠️  Failed to fetch deployment ${deploymentId}: ${result.error.message}`);
            return {
                id: deploymentId,
                label: "deployments",
                name: `Error Deployment (${deploymentId})`,
                url: path.join(baseUrl, "console-nextgen", "deployments", deploymentId, "overview"),
                assetId: deploymentId,
                apiPayload: { error: result.error.message },
                parents: [],
                apiUrl: path.join(client.getUri(), getDeploymentUrl(deploymentId)),
                useCaseId: useCaseData.useCaseId,
                useCaseName: useCaseData.useCaseName,
                error: result.error
            };
        }
        deployment = result.data;
    }
    
    const regModelId = deployment.modelPackage?.registeredModelId
    const regModelVersionId = deployment.modelPackage?.id
    let parents = [];
    
    if (regModelId && regModelVersionId) {
    const regModelNode = nodes.registeredModels[`${regModelId}-${regModelVersionId}`]
        parents = [regModelNode ? regModelNode : getRegisteredModelNode(client, useCaseData, nodes, regModelId, regModelVersionId)]
    }
    
    const url = path.join(baseUrl, "console-nextgen", "deployments", deployment.id, "overview")
    return {
        id: deployment.id,
        label: "deployments",
        name: deployment.label,
        url: url,
        assetId: deployment.id,
        apiPayload: deployment,
        parents: parents,
        apiUrl: path.join(client.getUri(), getDeploymentUrl(deploymentId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName

    }
}

export async function getLlmNode(client, useCaseData, llmId) {
    return {
        id: llmId,
        label: "llm",
        assetId: llmId,
        parents: [],
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getPlaygroundNode(client, useCaseData, nodes, playgroundId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    
    const result = await safeRequest(async () => {
        return await fetchDataWithRetry(client, getPlaygroundUrl(playgroundId));
    }, `Fetch Playground ${playgroundId}`);
    
    if (!result.success) {
        console.warn(`⚠️  Failed to fetch playground ${playgroundId}: ${result.error.message}`);
        return {
            id: playgroundId,
            label: "playgrounds",
            name: `Error Playground (${playgroundId})`,
            url: path.join(baseUrl, "usecases", useCaseData.useCaseId, "playgrounds", playgroundId, "comparison"),
            assetId: playgroundId,
            apiPayload: { error: result.error.message },
            parents: [],
            apiUrl: path.join(client.getUri(), getPlaygroundUrl(playgroundId)),
            useCaseId: useCaseData.useCaseId,
            useCaseName: useCaseData.useCaseName,
            error: result.error
        };
    }
    
    const playground = result.data;
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "playgrounds", playgroundId, "comparison")
    return {
        id: playgroundId,
        label: "playgrounds",
        name: playground.name,
        url: url,
        assetId: playgroundId,
        apiPayload: playground, 
        parents: [],
        apiUrl: path.join(client.getUri(), getPlaygroundUrl(playgroundId)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getLlmBlueprintNode(client, useCaseData, nodes, llmBlueprintId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    let llmBp = useCaseData.llmBlueprints.filter(item => item.id === llmBlueprintId)[0]
    
    // If LLM blueprint not found in cached data, fetch it directly
    if (!llmBp) {
        console.log(`🔍 LLM Blueprint ${llmBlueprintId} not found in cached data, fetching directly from API...`);
        const result = await safeRequest(async () => {
            return await fetchDataWithRetry(client, getLLMBlueprintUrl(llmBlueprintId));
        }, `Fetch LLM Blueprint ${llmBlueprintId}`);
        
        if (!result.success) {
            console.warn(`⚠️  Failed to fetch LLM blueprint ${llmBlueprintId}: ${result.error.message}`);
            return {
                id: llmBlueprintId,
                label: "llmBlueprint",
                name: `Error LLM Blueprint (${llmBlueprintId})`,
                url: path.join(baseUrl, "usecases", useCaseData.useCaseId, "llmBlueprint", llmBlueprintId),
                assetId: llmBlueprintId,
                apiPayload: { error: result.error.message },
                parents: [],
                apiUrl: path.join(client.getUri(), getLLMBlueprintUrl(llmBlueprintId)),
                useCaseId: useCaseData.useCaseId,
                useCaseName: useCaseData.useCaseName,
                error: result.error
            };
        }
        llmBp = result.data;
        console.log(`✅ Successfully fetched LLM Blueprint: ${llmBp.name} (${llmBlueprintId})`);
    }
    
    const vdbId = llmBp.vectorDatabaseId
    const llmId = llmBp.llmId
    const playgroundId = llmBp.playgroundId
    
    // Build URL - if no playground ID, use fallback URL structure
    const url = playgroundId ? 
        path.join(baseUrl, "usecases", useCaseData.useCaseId, "playgrounds", playgroundId, "llmBlueprint", llmBp.id) :
        path.join(baseUrl, "usecases", useCaseData.useCaseId, "llmBlueprint", llmBp.id);
    
    const parents = []
    
    // Add vector database relationship if present
    if (vdbId) {
        try {
            const vdbNode = nodes.vectorDatabases[vdbId]
            const vectorDbNode = vdbNode ? vdbNode : await getVectorDatabaseNode(client, useCaseData, nodes, vdbId);
            parents.push({
                ...vectorDbNode,
                edgeType: getTypedEdge('vectorDatabases', 'llmBlueprint')
            });
            console.log(`🔗 Added vector database relationship to LLM Blueprint: ${vdbId}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create vector database relationship for LLM Blueprint ${llmBlueprintId}:`, error.message);
        }
    }
    
    // Add LLM relationship if present
    if (llmId) {
        try {
            const llmNode = await getLlmNode(client, useCaseData, llmId);
            parents.push({
                ...llmNode,
                edgeType: getTypedEdge('llm', 'llmBlueprint')
            });
            console.log(`🔗 Added LLM relationship to LLM Blueprint: ${llmId}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create LLM relationship for LLM Blueprint ${llmBlueprintId}:`, error.message);
        }
    }
    
    // Add playground relationship if present
    if (playgroundId) {
        try {
            const playgroundNode = await getPlaygroundNode(client, useCaseData, nodes, playgroundId);
            parents.push({
                ...playgroundNode,
                edgeType: getTypedEdge('playgrounds', 'llmBlueprint')
            });
            console.log(`🔗 Added playground relationship to LLM Blueprint: ${playgroundId}`);
        } catch (error) {
            console.warn(`⚠️  Failed to create playground relationship for LLM Blueprint ${llmBlueprintId}:`, error.message);
        }
    }
    
    return {
        id: llmBp.id,
        label: "llmBlueprint",
        name: llmBp.name,
        url: url,
        assetId: llmBp.id,
        apiPayload: llmBp,
        parents: parents,
        apiUrl: path.join(client.getUri(), getLLMBlueprintUrl(llmBp.id)),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }

}

export async function resolveNestedParentsArray(input) {
    
    // Loop over each object in the array and resolve its parents property recursively
    return await Promise.all(input.map(async (item) => {
        // Resolve the current object
        return await resolveNestedParents(item);
    }));
}

export async function resolveNestedParents(input) {
    // If input is a Promise, resolve it first
    if (input && typeof input.then === 'function') {
        input = await input; // Wait for the promise to resolve
    }

    // If input has a 'parents' property which is an array of promises, resolve them
    if (input && Array.isArray(input.parents)) {
        // Resolve all promises in the 'parents' array
        input.parents = await Promise.all(input.parents.map(resolveNestedParents));
    }

    // Return the fully resolved object
    return input;
}

export async function getUseCaseNodes(client, useCaseData) {
    const nodes = {datasets: {}, dataSources: {}, recipes: {}, projects: {}, models: {}, dataStores: {}, vectorDatabases: {}, registeredModels: {}, deployments: {}, playgrounds: {}, llmBlueprints: {}, llms: {}, customModelVersions: {}}

    // Helper function to filter assets by access with detailed logging
    const filterAccessibleAssets = (assets, assetType) => {
        if (!assets || !Array.isArray(assets)) {
            console.log(`📋 ${assetType}: No assets found`);
            return [];
        }
        
        const accessible = assets.filter(item => {
            if (item.userHasAccess === false) {
                console.warn(`⚠️  Skipping inaccessible ${assetType}: ${item.id || item.applicationId || item.projectId || item.datasetId || item.registeredModelId || 'unknown'}`);
                return false;
            }
            return true;
        });
        
        console.log(`✅ ${assetType}: Processing ${accessible.length} accessible out of ${assets.length} total`);
        return accessible;
    };

    // Filter and process datastores (if any)
    const accessibleDatastores = filterAccessibleAssets(useCaseData.datastores || [], 'datastores');
    try {
        const dataStoreResults = await Promise.allSettled(accessibleDatastores.map( async item =>  {
            try {
                return await getDataStoreNode(client, useCaseData, [], item.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create datastore node ${item.id}:`, error.message);
                return { id: item.id, label: "datastore", name: "Error Datastore", error: error.message, parents: [] };
            }
        }))
        
        const dataStoreNodes = dataStoreResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
            
        const failedDataStores = dataStoreResults.filter(result => result.status === 'rejected');
        if (failedDataStores.length > 0) {
            console.warn(`⚠️  ${failedDataStores.length} datastore operations failed`);
        }
        
    nodes["dataStores"] = Object.fromEntries(dataStoreNodes.map( node => [node.id, node] ))
    console.log("datastore nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process datastores:`, error.message);
        nodes["dataStores"] = {};
    }
    
    // Filter and process datasources (if any)
    const accessibleDatasources = filterAccessibleAssets(useCaseData.datasources || [], 'datasources');
    try {
        const dataSourceResults = await Promise.allSettled(accessibleDatasources.map( async datasource => {
            try {
                return await getDataSourceNode(client, useCaseData, nodes, datasource.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create datasource node ${datasource.id}:`, error.message);
                return { id: datasource.id, label: "datasource", name: "Error Datasource", error: error.message, parents: [] };
            }
        }))
        
        const dataSourcesNodes = dataSourceResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
            
        const failedDataSources = dataSourceResults.filter(result => result.status === 'rejected');
        if (failedDataSources.length > 0) {
            console.warn(`⚠️  ${failedDataSources.length} datasource operations failed`);
        }
        
    nodes["dataSources"] =  Object.fromEntries(dataSourcesNodes.map( node => [node.id, node] ))
    console.log("datasource nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process datasources:`, error.message);
        nodes["dataSources"] = {};
    }
    
    // Filter and process datasets
    const accessibleDatasets = filterAccessibleAssets(useCaseData.datasets || [], 'datasets');
    console.log(`🔄 Processing ${accessibleDatasets.length} datasets...`);
    
    const datasetResults = await Promise.allSettled(accessibleDatasets.map(async dataset => {
        console.log(`📊 Fetching dataset: ${dataset.datasetId}-${dataset.versionId}`);
        return await getDatasetNode(client, useCaseData, nodes, dataset.datasetId, dataset.versionId);
    }));
    
    const datasetNodes = datasetResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    
    const datasetErrors = datasetResults.filter(result => result.status === 'rejected');
    console.log(`✅ Successfully processed ${datasetNodes.length} datasets`);
    if (datasetErrors.length > 0) {
        console.warn(`⚠️  Failed to process ${datasetErrors.length} datasets`);
        datasetErrors.forEach((error, index) => {
            console.warn(`   Dataset ${index + 1}: ${error.reason?.message || error.reason}`);
        });
    }
    
    nodes["datasets"] = Object.fromEntries(datasetNodes.map(node => [node.id, node]));
    
    // Process recipes (may not have userHasAccess field)
    try {
        const recipeNodes =  await Promise.all((useCaseData.recipes || []).map( async recipe => {
            try {
                return await getRecipeNode(client, useCaseData, nodes, recipe.recipeId);
            } catch (error) {
                console.warn(`⚠️  Failed to create recipe node ${recipe.recipeId}:`, error.message);
                return { id: recipe.recipeId, label: "recipes", name: "Error Recipe", error: error.message, parents: [] };
            }
        }))
    nodes["recipes"] = Object.fromEntries( recipeNodes.map( node => [node.id, node]))
    console.log("recipe nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process recipes:`, error.message);
        nodes["recipes"] = {};
    }
    
    // Filter and process projects
    const accessibleProjects = filterAccessibleAssets(useCaseData.projects || [], 'projects');
    console.log(`🔄 Processing ${accessibleProjects.length} projects...`);
    
    const projectResults = await Promise.allSettled(accessibleProjects.map(async proj => {
        console.log(`🚀 Fetching project: ${proj.id}`);
        return await getProjectNode(client, useCaseData, nodes, proj.id);
    }));
    
    const projectNodes = projectResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    
    const projectErrors = projectResults.filter(result => result.status === 'rejected');
    console.log(`✅ Successfully processed ${projectNodes.length} projects`);
    if (projectErrors.length > 0) {
        console.warn(`⚠️  Failed to process ${projectErrors.length} projects`);
        projectErrors.forEach((error, index) => {
            console.warn(`   Project ${index + 1}: ${error.reason?.message || error.reason}`);
        });
    }
    
    nodes["projects"] = Object.fromEntries(projectNodes.map(node => [node.id, node]));
    
    // Filter and process models (if any)
    const accessibleModels = filterAccessibleAssets(useCaseData.models || [], 'models');
    try {
        const modelResults = await Promise.allSettled(accessibleModels.map( async model => {
            try {
                return await getModelNode(client, useCaseData, nodes, model.id, model.projectId);
            } catch (error) {
                console.warn(`⚠️  Failed to create model node ${model.id}:`, error.message);
                return { id: model.id, label: "models", name: "Error Model", error: error.message, parents: [] };
            }
        }))
        
        const modelNodes = modelResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
            
        const failedModels = modelResults.filter(result => result.status === 'rejected');
        if (failedModels.length > 0) {
            console.warn(`⚠️  ${failedModels.length} model operations failed`);
        }
        
    nodes["models"] = Object.fromEntries( modelNodes.map( node => [node.id, node])) 
    console.log("model nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process models:`, error.message);
        nodes["models"] = {};
    }
    
    // Filter and process registered models
    const accessibleRegisteredModels = filterAccessibleAssets(useCaseData.registeredModels || [], 'registeredModels');
    try {
        const registeredModelNodes = await Promise.all(accessibleRegisteredModels.map( async regModel => {
            try {
                return await getRegisteredModelNode(client, useCaseData, nodes, regModel.registeredModelId, regModel.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create registered model node ${regModel.registeredModelId}:`, error.message);
                return { id: `${regModel.registeredModelId}-${regModel.id}`, label: "registeredModels", name: "Error Registered Model", error: error.message, parents: [] };
            }
        }))
    nodes["registeredModels"] = Object.fromEntries( registeredModelNodes.map( node => [node.id, node])) 
    console.log("registered model nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process registered models:`, error.message);
        nodes["registeredModels"] = {};
    }
    
    // Filter and process deployments
    const accessibleDeployments = filterAccessibleAssets(useCaseData.deployments || [], 'deployments');
    try {
        const deploymentNodes = await Promise.all(accessibleDeployments.map( async deployment => {
            try {
                return await getDeploymentNode(client, useCaseData, nodes, deployment.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create deployment node ${deployment.id}:`, error.message);
                return { id: deployment.id, label: "deployments", name: "Error Deployment", error: error.message, parents: [] };
            }
        }))
    nodes["deployments"] = Object.fromEntries( deploymentNodes.map( node => [node.id, node])) 
    console.log("deployment nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process deployments:`, error.message);
        nodes["deployments"] = {};
    }
    
    // Filter and process vector databases
    const accessibleVectorDatabases = filterAccessibleAssets(useCaseData.vectorDatabases || [], 'vectorDatabases');
    try {
        const vectorDatabaseNodes = await Promise.all(accessibleVectorDatabases.map( async vdb => {
            try {
                return await getVectorDatabaseNode(client, useCaseData, nodes, vdb.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create vector database node ${vdb.id}:`, error.message);
                return { id: vdb.id, label: "vectorDatabases", name: "Error Vector Database", error: error.message, parents: [] };
            }
        }))
    nodes["vectorDatabases"] = vectorDatabaseNodes
    console.log("vector databases are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process vector databases:`, error.message);
        nodes["vectorDatabases"] = [];
    }
    
    // Process LLM blueprints (if any)
    try {
        const llmBlueprintNodes = await Promise.all((useCaseData.llmBlueprints || []).map( async llmBlueprint => {
            try {
                return await getLlmBlueprintNode(client, useCaseData, nodes, llmBlueprint.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create LLM blueprint node ${llmBlueprint.id}:`, error.message);
                return { id: llmBlueprint.id, label: "llmBlueprints", name: "Error LLM Blueprint", error: error.message, parents: [] };
            }
        }))
    nodes["llmBlueprints"] = Object.fromEntries( llmBlueprintNodes.map( node => [node.id, node])) 
    console.log("llm blueprints nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process LLM blueprints:`, error.message);
        nodes["llmBlueprints"] = {};
    }
    
    // Filter and process playgrounds
    const accessiblePlaygrounds = filterAccessibleAssets(useCaseData.playgrounds || [], 'playgrounds');
    try {
        const playgroundNodes = await Promise.all(accessiblePlaygrounds.map( async playground => {
            try {
                return await getPlaygroundNode(client, useCaseData, nodes, playground.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create playground node ${playground.id}:`, error.message);
                return { id: playground.id, label: "playgrounds", name: "Error Playground", error: error.message, parents: [] };
            }
        }))
    nodes["playgrounds"] = Object.fromEntries( playgroundNodes.map( node => [node.id, node])) 
    console.log("playground nodes are done")
    } catch (error) {
        console.warn(`⚠️  Failed to process playgrounds:`, error.message);
        nodes["playgrounds"] = {};
    }
    
    // Filter and process applications
    const accessibleApplications = filterAccessibleAssets(useCaseData.applications || [], 'applications');
    try {
        const applicationNodes = await Promise.all(accessibleApplications.map( async item => {
            try {
                return await getApplicationNode(client, useCaseData, nodes, item.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create application node ${item.id}:`, error.message);
                return { id: item.id, label: "applications", name: "Error Application", error: error.message, parents: [] };
            }
        }))
    nodes["applications"] = Object.fromEntries(applicationNodes.map( node => [node.id, node] ))
    } catch (error) {
        console.warn(`⚠️  Failed to process applications:`, error.message);
        nodes["applications"] = {};
    }
    
    // Filter and process custom applications
    const accessibleCustomApps = filterAccessibleAssets(useCaseData.customApplications || [], 'customApplications');
    try {
        const customApplicationNodes = await Promise.all(accessibleCustomApps.map( async item => {
            try {
                return await getCustomApplicationNode(client, useCaseData, nodes, item.id);
            } catch (error) {
                console.warn(`⚠️  Failed to create custom application node ${item.id}:`, error.message);
                return { id: item.id, label: "customApplications", name: "Error Custom Application", error: error.message, parents: [] };
            }
        }))
    nodes["customApplications"] = Object.fromEntries(customApplicationNodes.map( node => [node.id, node] ))
    } catch (error) {
        console.warn(`⚠️  Failed to process custom applications:`, error.message);
        nodes["customApplications"] = {};
    }

    // Filter and process custom models and their latest versions
    const accessibleCustomModels = filterAccessibleAssets(useCaseData.customModels || [], 'customModels');
    console.log(`🔄 Processing ${accessibleCustomModels.length} custom models...`);
    try {
        const customModelVersionNodes = [];
        
        for (const customModel of accessibleCustomModels) {
            try {
                console.log(`🤖 Processing custom model: ${customModel.id} (${customModel.name})`);
                
                // Fetch the latest version of the custom model
                const versionsResult = await safeRequest(async () => {
                    return await fetchDataWithRetry(client, `customModels/${customModel.id}/versions`);
                }, `Fetch Custom Model Versions ${customModel.id}`);
                
                if (versionsResult.success && versionsResult.data && versionsResult.data.data) {
                    const versions = versionsResult.data.data;
                    
                    // Process each version, but prioritize the latest one
                    const latestVersion = versions.find(v => v.isFrozen) || versions[0];
                    
                    if (latestVersion) {
                        console.log(`🔄 Creating node for custom model version: ${customModel.id}-${latestVersion.id} (${latestVersion.label})`);
                        
                        const customModelVersionNode = await getCustomModelVersionNode(
                            client, 
                            useCaseData, 
                            nodes, 
                            customModel.id, 
                            latestVersion.id, 
                            undefined
                        );
                        
                        customModelVersionNodes.push(customModelVersionNode);
                        console.log(`✅ Successfully created custom model version node: ${customModelVersionNode.id}`);
                    } else {
                        console.warn(`⚠️  No versions found for custom model ${customModel.id}`);
                    }
                } else {
                    console.warn(`⚠️  Failed to fetch versions for custom model ${customModel.id}: ${versionsResult.error?.message || 'Unknown error'}`);
                    
                    // Create a placeholder node for the custom model if we can't fetch versions
                    const placeholderNode = {
                        id: `${customModel.id}-unknown`,
                        label: "customModelVersion",
                        name: customModel.name || `Custom Model ${customModel.id}`,
                        url: `${client.getUri().replace("/api/v2", "")}/registry/custom-model-workshop/${customModel.id}`,
                        assetId: customModel.id,
                        assetVersionId: "unknown",
                        apiPayload: customModel,
                        parents: [],
                        useCaseId: useCaseData.useCaseId,
                        useCaseName: useCaseData.useCaseName,
                        error: versionsResult.error?.message || 'Failed to fetch versions'
                    };
                    customModelVersionNodes.push(placeholderNode);
                }
            } catch (error) {
                console.warn(`⚠️  Failed to process custom model ${customModel.id}:`, error.message);
                
                // Create error placeholder
                const errorNode = {
                    id: `${customModel.id}-error`,
                    label: "customModelVersion", 
                    name: `Error: ${customModel.name || customModel.id}`,
                    error: error.message,
                    parents: [],
                    useCaseId: useCaseData.useCaseId,
                    useCaseName: useCaseData.useCaseName
                };
                customModelVersionNodes.push(errorNode);
            }
        }
        
        nodes["customModelVersions"] = Object.fromEntries(customModelVersionNodes.map(node => [node.id, node]));
        console.log(`✅ Successfully processed ${customModelVersionNodes.length} custom model versions`);
        
    } catch (error) {
        console.warn(`⚠️  Failed to process custom models:`, error.message);
        nodes["customModelVersions"] = {};
    }

    delete nodes.dataSources
    delete nodes.dataStores

    const results = {}
    for (const key in nodes) {
        if (nodes.hasOwnProperty(key)) {
            results[key] = await Promise.all( Object.values(nodes[key]))
        }
    }

    for (const key in results) {
        if (results.hasOwnProperty(key)) {
            results[key] = await resolveNestedParentsArray(results[key])
        }
    }

    return results
}

export function getNodes(node) {
    const nodes = []
    function helper(node, parents) {
        console.log(`${node.label} ${node.id}`)
        nodes.push(node)
        parents.map((n) => {
            nodes.push(n)
            return helper(n, n.parents)
        })
    }
    helper(node, node.parents)
    return nodes.flat()
}

export function flattenNodes(nodes) {
    const allNodes = []
    for (const key in nodes) {
        if (nodes.hasOwnProperty(key)) {
            console.log(key)
            const n = nodes[key].map(getNodes).flat()
            allNodes.push(n)
        }
    }
    return allNodes.flat()
}

export async function buildGraph(token, endpoint, useCaseId) {
    const client = axios.create({
        baseURL: endpoint, // Base URL for your API
        timeout: 100000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // If you need authentication
        },
      });
    if (fs.existsSync(path.join(STORAGE, `${useCaseId}-edges.json`))) {
        const edgeData = fs.readFileSync(path.join(STORAGE, `${useCaseId}-edges.json`), "utf-8")
        const nodeData = fs.readFileSync(path.join(STORAGE, `${useCaseId}-nodes.json`), "utf-8")
        return { nodes: JSON.parse(nodeData), edges: JSON.parse(edgeData) }
    } else {

        const useCasePromises = getUseCaseAssetsPromises(client, useCaseId)
        const useCaseAssetsIncomplete = await getUseCaseAssets(useCasePromises)
        const useCaseAssets = await getUseCaseAssetsPart2(client, useCaseAssetsIncomplete)
        const sharedRoles = useCaseAssets.sharedRoles
        delete useCaseAssets.sharedRoles
        const useCaseAssetsUrls =  getUseCaseAssetsUrls(useCaseAssets)
        
        const useCaseData = await getUseCaseData(client, useCaseAssetsUrls)
        if (useCaseData.hasOwnProperty("models")) {
            useCaseData.models = useCaseData.models.flat() 
        }
        useCaseData["useCaseId"] = useCaseId
        useCaseData["useCaseName"] = (await (client.get(`useCases/${useCaseId}`))).data.name
        
        try {
        useCaseData["datastores"] = (await fetchDataWithRetry(client, "externalDataStores")).data
        } catch (error) {
            console.warn(`⚠️  Failed to fetch datastores: ${error.message}`);
            useCaseData["datastores"] = [];
        }
        
        try {
        useCaseData["datasources"] = (await fetchDataWithRetry(client, "externalDataSources")).data
        } catch (error) {
            console.warn(`⚠️  Failed to fetch datasources: ${error.message}`);
            useCaseData["datasources"] = [];
        }

        const useCaseNodes = await getUseCaseNodes(client, useCaseData)

        delete useCaseNodes.datastores
        delete useCaseNodes.datasources

        const allNodes = flattenNodes(useCaseNodes)

        const removeDups = []
        const nodes = []
        allNodes.forEach((item) => {
            if (!removeDups.includes(item.id)) {
                removeDups.push(item.id)
                nodes.push(item)
            }
        }
        )
        const edges = []
        nodes.forEach((node) => {
            const parents = node.parents
            parents.forEach(parent => {
                const edgeInfo = getTypedEdge(parent.label, node.label);
                edges.push({
                    from: node.id,      // Flipped: now goes FROM child TO parent 
                    to: parent.id,      // This makes the labels read correctly semantically
                    type: edgeInfo.type,
                    label: edgeInfo.label,
                    color: edgeInfo.color,
                    width: getEdgeWidth(edgeInfo.type),
                    dashes: getEdgeDashes(edgeInfo.type)
                });
            });
        })
        // nodes.map( node => node.parents.map( parentNode) => parentNode.nodes)
        const graph = { nodes: nodes, edges: edges }
        fs.writeFileSync(path.join(STORAGE, `${useCaseId}-edges.json`), JSON.stringify(graph.edges))
        fs.writeFileSync(path.join(STORAGE, `${useCaseId}-nodes.json`), JSON.stringify(graph.nodes))

        return graph
    }
}