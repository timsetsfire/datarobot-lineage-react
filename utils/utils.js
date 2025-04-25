
import axios from "axios";
import path from "path";
import fs from "fs";

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

export function getUseCaseAssetsUrls(useCaseAssets) {

    const applications = useCaseAssets.applications ? useCaseAssets.applications.map( item => getApplicationUrl(item.applicationId)) : []
    const customApplications = useCaseAssets.customApplications ? useCaseAssets.customApplications.map( item => getCustomApplicationUrl(item.id)) : []
    const recipes = useCaseAssets.recipes ? useCaseAssets.recipes.filter(item => item.entityType === "RECIPE").map(item => getRecipeUrl( item.entityId)) : []
    const datasets = useCaseAssets.datasets ? useCaseAssets.datasets.map(item => getDatasetUrl( item.datasetId, item.versionId)) : []
    const deployments = useCaseAssets.deployments ? useCaseAssets.deployments.map(item => getDeploymentUrl( item.id)) : []
    //  const notebooks = useCaseAssets.notebooks ? useCaseAssets.notebooks
    const playgrounds = useCaseAssets.playgrounds ? useCaseAssets.playgrounds.map(item => getPlaygroundUrl(item.id)) :[]
    const llmBlueprints = useCaseAssets.playgrounds ? useCaseAssets.playgrounds.map(item => getLLMBlueprintsUrl( item.entityId)).flat() : []
    const projects = useCaseAssets.projects ? useCaseAssets.projects.map(item => getProjectUrl( item.projectId)) : []
    const models = useCaseAssets.projects ? useCaseAssets.projects.map(item => getModelsFromProjectUrl( item.projectId)).flat() : []
    const registeredModels = useCaseAssets.registeredModelVersions ? useCaseAssets.registeredModelVersions.map(
        item => {
            const registeredModelId = item.id
            return item.versions.map(
                version => getRegisteredModelUrl( registeredModelId, version.id)
            )
        }
    ).flat() : []
    const vectorDatabases = useCaseAssets.vectorDatabases ? useCaseAssets.vectorDatabases.map(item => getVectorDatabaseUrl( item.id)) : []
    const sharedRoles = useCaseAssets.sharedRoles ? useCaseAssets.sharedRoles.map(item => ({ data: item })) : []
    const urls = {
        applications: applications,
        customApplications: customApplications,
        recipes: recipes,
        datasets: datasets,
        deployments: deployments,
        playgrounds: playgrounds,
        llmBlueprints: llmBlueprints,
        projects: projects,
        models: models,
        registeredModels: registeredModels,
        vectorDatabases: vectorDatabases,
        sharedRoles: sharedRoles
    }
    return urls
}

//
export async function getUseCases(token, endpoint) {
    const axiosClient = axios.create({
        baseURL: endpoint, // Base URL for your API
        // timeout: 10000, // Timeout after 10 seconds
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // If you need authentication
        },
      });
    const response = await axiosClient.get("useCases")
    const useCases = response.data.data.map( item => ({ id: item.id, name: item.name }))
    return useCases
}


export const fetchDataWithRetry = async (client, url, retries = 3) => {
    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await client.get(url);
        return response.data;
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed.`);
        if (attempt >= retries) {
          console.error('Max retries reached.');
          console.error(url)
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 10000*(attempt+1))); // Delay 10 seconds before retry
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
    }

    const useCase = await (client.get(`useCases/${useCaseId}`))

    const uce = Object.entries(useCase.data).filter(entry => entry[0].includes("Count")).filter( entry => entry[1] > 0 ).map( item => item[0].replace("Count", "")).filter( item => item !== "models")

    const value = uce.map( entity => [entity, entitiesToUrls[entity](useCaseId)]).map( item => [item[0], client.get(item[1])] ).filter( item => item !== "models")
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
            const requests = useCaseAssetsUrls[k].map( async (url) => fetchDataWithRetry(client, url))
            promises[k] = requests
        }
    }
    const data = {}
    for( const k in promises) { 
        if(promises.hasOwnProperty(k)) { 
            const results = Promise.all(promises[k])
            data[k] = await results
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
    const relatedDeploymentIds = application.deploymentIds
    const relatedEntities = application.relatedEntities 
    const relatedModelId = relatedEntities.modelId 
    const relatedProjectId = relatedEntities.projectId
    const parents = []
    if( relatedModelId) { 
        parents.push( getModelNode(client, useCaseData, nodes, relatedModelId, relatedProjectId))
    }
    if(relatedDeploymentIds.length > 0) {
        relatedDeploymentIds.forEach( deploymentId => {
            parents.push( getDeploymentNode(client, useCaseData, nodes, deploymentId))
        })
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
        useCaseName: useCaseData.useCaseName
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
        return { 
            id: `${datasetId}-${datasetVersionId}`,
            label: "datasets",
            url: path.join(baseUrl, "registry", "data", datasetId),
            assetId: datasetId,
            assetVersionId: datasetVersionId, 
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
    const datasetNode = nodes.datasets[datasetId] ? nodes.datasets[datasetId] : getDatasetNode(client, useCaseData, nodes, datasetId)
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "vector-databases", vdbId, `?versionId=${vectorDatabase.id}`)
    return {
        id: `${vectorDatabase.familyId}-${vectorDatabase.id}`,
        label: "vectorDatabases",
        name: vectorDatabase.name,
        url: url,
        assetId: vectorDatabase.familyId,
        assetVersionId: vectorDatabase.id,
        apiPayload: vectorDatabase,
        parents: [datasetNode], 
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
    const model = m ? m : await fetchDataWithRetry(client, `projects/${projectId}/models/${modelId}`)
    const projectNode = nodes.projects[projectId]
    const parents = [ projectNode ? projectNode : getProjectNode(client, useCaseData, nodes, projectId)]
    // const parents =[]
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

export async function getCustomModelVersionNode(client, useCaseData, customModelId, customModelVersionId, customModelVersionLabel) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    let cmvId = customModelVersionId
    let customModelVersion = null
    if (customModelVersionLabel) {
        const customModelVersions = await fetchDataWithRetry(client, `customModels/${customModelId}/versions`)
        customModelVersion = customModelVersions["data"].filter(item => item.label === customModelVersionLabel)[0]
        cmvId = customModelVersion.id
    } else if (customModelVersionId) {
        customModelVersion = await fetchDataWithRetry(client, getCustomModelVersionUrl(customModelId, customModelVersionId))
    }
    let customModel = await fetchDataWithRetry(client, `customModels/${customModelId}`)
    const url = path.join(baseUrl, "registry", "custom-model-workshop", customModelId, "versions", cmvId)
    return {
        id: `${customModelId}-${cmvId}`,
        label: "customModelVersion",
        name: customModel.name,
        url: url,
        assetId: customModelId,
        assetVersionId: cmvId,
        apiPayload: {...customModel, ...customModelVersion},
        parents: [],
        apiUrl: path.join(client.getUri(), `customModels/${customModelId}/versions`),
        useCaseId: useCaseData.useCaseId,
        useCaseName: useCaseData.useCaseName
    }
}

export async function getRegisteredModelNode(client, useCaseData, nodes, regModelId, regModelVersionId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const m = useCaseData.registeredModels.filter(item => item.registeredModelId === regModelId & item.id === regModelVersionId)[0]
    const regModel = m ? m : await fetchDataWithRetry(client, getRegisteredModelUrl(regModelId, regModelVersionId))
    const source = regModel.sourceMeta.projectId ? "project" : "customModel"
    const parents = []
    if (source === "project") {
        const projectId = regModel.sourceMeta.projectId
        const modelId = regModel.modelId
        const modelNode = nodes.models[modelId]
        parents.push( modelNode ? modelNode : getModelNode(client, useCaseData, nodes, modelId, projectId))
    } else {
        const customModelId = regModel.sourceMeta.customModelDetails.id
        const versionLabel = regModel.sourceMeta.customModelDetails.versionLabel
        parents.push(getCustomModelVersionNode(client, useCaseData, customModelId, undefined, versionLabel))
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
    const deployment = dep ? dep : await fetchDataWithRetry(client, getDeploymentUrl(deploymentId))
    const regModelId = deployment.modelPackage.registeredModelId
    const regModelVersionId = deployment.modelPackage.id
    const regModelNode = nodes.registeredModels[`${regModelId}-${regModelVersionId}`]
    const parents = [regModelNode ? regModelNode : getRegisteredModelNode(client, useCaseData, nodes, regModelId, regModelVersionId)]
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
    const playground = await fetchDataWithRetry(client, getPlaygroundUrl(playgroundId))
    // const pg = useCaseData.playgrounds.filter( item => item.id === playgroundId)[0]
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
    const llmBp = useCaseData.llmBlueprints.filter(item => item.id === llmBlueprintId)[0]
    const vdbId = llmBp.vectorDatabaseId
    const llmId = llmBp.llmId
    const playgroundId = llmBp.playgroundId
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "playgrounds", playgroundId, "llmBlueprint", llmBp.id)
    const parents = []
    if (vdbId) {
        const vdbNode = nodes.vectorDatabases[vdbId]
        parents.push(vdbNode ? vdbNode : getVectorDatabaseNode(client, useCaseData, nodes, vdbId))
    }
    parents.push(getLlmNode(client, useCaseData, llmId))
    parents.push(getPlaygroundNode(client, useCaseData, nodes, playgroundId))
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
    const nodes = {datasets: {}, dataSources: {}, recipes: {}, projects: {}, models: {}, dataStores: {}, vectorDatabases: {}, registeredModels: {}, deployments: {}, playgrounds: {}, llmBlueprints: {}, llms: {}}


    const dataStoreNodes = await Promise.all(useCaseData.datastores.map( async item =>  await getDataStoreNode(client, useCaseData, [], item.id) ))
    nodes["dataStores"] = Object.fromEntries(dataStoreNodes.map( node => [node.id, node] ))
    console.log("datastore nodes are done")
    const dataSourcesNodes = await Promise.all(useCaseData.datasources.map( async datasource => await getDataSourceNode(client, useCaseData, nodes, datasource.id)))
    nodes["dataSources"] =  Object.fromEntries(dataSourcesNodes.map( node => [node.id, node] ))
    console.log("datasource nodes are done")
    const datasetNodes = await Promise.all(useCaseData.datasets.map( async dataset => await getDatasetNode(client, useCaseData, nodes, dataset.datasetId, dataset.versionId)))
    nodes["datasets"] = Object.fromEntries( datasetNodes.map( node => [node.id, node]))
    console.log("dataset nodes are done")
    const recipeNodes =  await Promise.all(useCaseData.recipes.map( async recipe => await getRecipeNode(client, useCaseData, nodes, recipe.recipeId)))
    nodes["recipes"] = Object.fromEntries( recipeNodes.map( node => [node.id, node]))
    console.log("recipe nodes are done")
    const projectNodes = await Promise.all(useCaseData.projects.map( async proj => await getProjectNode(client, useCaseData, nodes, proj.id)))
    nodes["projects"] = Object.fromEntries( projectNodes.map( node => [node.id, node])) 
    console.log("project nodes are done")
    const modelNodes = await Promise.all(useCaseData.models.map( async model => await getModelNode(client, useCaseData, nodes, model.id, model.projectId)))
    nodes["models"] = Object.fromEntries( modelNodes.map( node => [node.id, node])) 
    console.log("model nodes are done")
    const registeredModelNodes = await Promise.all(useCaseData.registeredModels.map( async regModel => await getRegisteredModelNode(client, useCaseData, nodes, regModel.registeredModelId, regModel.id)))
    nodes["registeredModels"] = Object.fromEntries( registeredModelNodes.map( node => [node.id, node])) 
    console.log("registered model nodes are done")
    const deploymentNodes = await Promise.all(useCaseData.deployments.map( async deployment => await getDeploymentNode(client, useCaseData, nodes, deployment.id)))
    nodes["deployments"] = Object.fromEntries( deploymentNodes.map( node => [node.id, node])) 
    console.log("deployment nodes are done")
    const vectorDatabaseNodes = await Promise.all(useCaseData.vectorDatabases.map( async vdb => await getVectorDatabaseNode(client, useCaseData, nodes, vdb.id))) 
    nodes["vectorDatabases"] = vectorDatabaseNodes
    console.log("vector databases are done")
    const llmBlueprintNodes = await Promise.all(useCaseData.llmBlueprints.map( async llmBlueprint => await getLlmBlueprintNode(client, useCaseData, nodes, llmBlueprint.id))) 
    nodes["llmBlueprints"] = Object.fromEntries( llmBlueprintNodes.map( node => [node.id, node])) 
    console.log("llm blueprints nodes are done")
    const playgroundNodes = await Promise.all(useCaseData.playgrounds.map( async playground => await getPlaygroundNode(client, useCaseData, nodes, playground.id))) 
    nodes["playgrounds"] = Object.fromEntries( playgroundNodes.map( node => [node.id, node])) 
    console.log("playground nodes are done")
    const applicationNodes = await Promise.all(useCaseData.applications.map( async item =>  await getApplicationNode(client, useCaseData, nodes, item.id) ))
    nodes["applications"] = Object.fromEntries(applicationNodes.map( node => [node.id, node] ))
    const customApplicationNodes = await Promise.all(useCaseData.customApplications.map( async item =>  await getCustomApplicationNode(client, useCaseData, nodes, item.id) ))
    nodes["customApplications"] = Object.fromEntries(customApplicationNodes.map( node => [node.id, node] ))

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
        
        useCaseData["datastores"] = (await fetchDataWithRetry(client, "externalDataStores")).data
        useCaseData["datasources"] = (await fetchDataWithRetry(client, "externalDataSources")).data

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
            parents.forEach(parent => edges.push(({ from: parent.id, to: node.id })))
        })
        // nodes.map( node => node.parents.map( parentNode) => parentNode.nodes)
        const graph = { nodes: nodes, edges: edges }
        fs.writeFileSync(path.join(STORAGE, `${useCaseId}-edges.json`), JSON.stringify(graph.edges))
        fs.writeFileSync(path.join(STORAGE, `${useCaseId}-nodes.json`), JSON.stringify(graph.nodes))

        return graph
    }
}