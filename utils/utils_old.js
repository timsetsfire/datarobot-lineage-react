
import axios from "axios";
import path from "path";
import fs from "fs";

// url related functions 
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

    // const applications = useCaseAssets.applications 
    // const customApplications = useCaseAssets.customApplications
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
        // applications: applications,
        // customApplications: customApplications,
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
export async function getDataStoreNode(client, useCaseData, nodes, datastoreId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const ds = useCaseData.datastores.filter(item => item.id ===  datastoreId)[0]
    const datastore = ds ? ds : await fetchDataWithRetry(client, getDataStoreUrl(datastoreId))

    return {
        id: datastoreId,
        label: "datastore",
        apiPayload: datastore,
        parents: [],
        url: path.join(baseUrl, "account", "data-connections",), 
        apiUrl: path.join(baseUrl, getDataStoreUrl(datastoreId))
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
        apiPayload: datasource,
        parents: [parentNode],
        url: path.join(baseUrl, "account", "data-connections"),
        apiUrl: getDataSourceUrl(dataSourceId)
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
        apiPayload: node,
        parents: parents,
        url: url,
        apiUrl: getRecipeUrl(recipeId)
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
            url: path.join(baseUrl, "registry", "data", dataset.datasetId),
            apiPayload: dataset,
            parents: parents,
            apiUrl: getDatasetUrl(datasetId, datasetVersionId)
        }
    } catch (error) {
        return { 
            id: `${datasetId}-${datasetVersionId}`,
            label: "datasets",
            parents: [],
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
        url: url,
        apiPayload: vectorDatabase,
        parents: [datasetNode],
        apiUrl: getVectorDatabaseUrl(vdbId)
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
        url: url,
        apiPayload: project,
        parents: parents,
        apiUrl: getProjectUrl(projectId)
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
        url: path.join(baseUrl, "projects", projectId, "models", modelId),
        apiPayload: model,
        parents: parents,
        apiUrl: getModelFromProjectId(modelId, projectId)
    }
}

export async function getCustomModelVersionNode(client, customModelId, customModelVersionId, customModelVersionLabel) {
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
        url: url,
        apiPayload: {...customModel, ...customModelVersion},
        parents: [],
        apiUrl: getCustomModelVersionUrl(customModelId, cmvId)
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
        parents.push(getCustomModelVersionNode(client, customModelId, undefined, versionLabel))
    }
    const url = regModelVersionId ? path.join(baseUrl, "registry", "registered-models", regModelId, "version", regModelVersionId, "info") : path.join(baseUrl, "registry", "registered-models", regModelId)
    return {
        id: `${regModelId}-${regModelVersionId}`,
        label: "registeredModels",
        url: url, 
        apiPayload: regModel,
        parents: parents,
        apiUrl: getRegisteredModelUrl(regModelId, regModelVersionId)
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
        url: url,
        apiPayload: deployment,
        parents: parents,
        apiUrl: getDeploymentUrl(deploymentId)
    }
}

export async function getLlmNode(client, llmId) {
    return {
        assetId: llmId,
        id: llmId,
        label: "llm",
        parents: []
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
        url: url,
        apiPayload: playground, 
        parents: [],
        apiUrl: getPlaygroundUrl(playgroundId)
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
    parents.push(getLlmNode(client, llmId))
    parents.push(getPlaygroundNode(client, useCaseData, nodes, playgroundId))
    return {
        id: llmBp.id,
        label: "llmBlueprint",
        url: url,
        apiPayload: llmBp,
        parents: parents,
        apiUrl: getLLMBlueprintUrl(playgroundId)
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
    const llmBlueprintNodes = await Promise.all(useCaseData.llmBlueprints.map( async llmBlueprint => await getLlmBlueprintNode(client, useCaseData, nodes, llmBlueprint.id))) 
    nodes["llmBlueprints"] = Object.fromEntries( llmBlueprintNodes.map( node => [node.id, node])) 
    console.log("llm blueprints nodes are done")
    const playgroundNodes = await Promise.all(useCaseData.playgrounds.map( async playground => await getPlaygroundNode(client, useCaseData, nodes, playground.id))) 
    nodes["playgrounds"] = Object.fromEntries( playgroundNodes.map( node => [node.id, node])) 
    console.log("playground nodes are done")
    delete nodes.dataSources
    delete nodes.dataStores
    // const nodes = {
    //     recipeNodes: useCaseData.recipes.map(recipe => getRecipeNode(client, useCaseData, nodes, recipe.recipeId)),
    //     datasetNodes: useCaseData.datasets.map(dataset => getDatasetNode(client, useCaseData, dataset.datasetId, dataset.versionId)),
    //     vdbNodes: useCaseData.vectorDatabases.map(vdb => getVectorDatabaseNode(client, useCaseData, vdb.id)),
    //     projectNodes: useCaseData.projects.map(proj => getProjectNode(client, useCaseData, proj.id)),
    //     modelNodes: useCaseData.models.map(msodel => getModelNode(client, useCaseData, model.id, model.projectId)),
    //     registeredModelNodes: useCaseData.registeredModels.map(regModel => getRegisteredModelNode(client, useCaseData, regModel.registeredModelId, regModel.id)),
    //     deploymentNodes: useCaseData.deployments.map(dep => getDeploymentNode(client, useCaseData, dep.id)),
    //     llmBlueprintNodes: useCaseData.llmBlueprints.map(llmBp => getLlmBlueprintNode(client, useCaseData, llmBp.id)),
    //     playgroundNodes: useCaseData.playgrounds.map(playground => getPlaygroundNode(client, useCaseData, playground.id)),
    // }
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


// const token = "NjIwZWFlYzc2MDM3MmE1NjI4YzQ4ZDE4OmRxTW91ZDNjLysrd3d2ajh1M1RhM2NWeUFGMklQYmRPd21BNDgvT0lUZHM9"
// const { default: axios } = await import("axios")
// const token = "Njc5N2I5ODk0OGFiN2FmOWQwZDcyZmFhOjRKZXg4NkluNzNEOCtjQys4UWY4ZnRQdDVjQTV5eUFJaHNCbTExanhpTGM9"
// const endpoint = "https://app.datarobot.com/api/v2"
// const axiosClient = axios.create({
//     baseURL: endpoint, // Base URL for your API
//     // timeout: 10000, // Timeout after 10 seconds
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`, // If you need authentication
//     },
//   });
// const response = await axiosClient.get("useCases")
// response.data.data.map( item => ({ id: item.id, name: item.name }))
// const useCaseId = "6601960e307c50932f22fa3e"
// const graph = buildGraph(token, endpoint, useCaseId)

    // const results = {}
    // for (const key in useCaseData) {
    //     if (useCaseData.hasOwnProperty(key)) {
    //         results[key] = await Promise.all(useCaseData[key])
    //     }
    // }
    // const useCaseData = Object.fromEntries(Object.entries(results).map(([key, value]) => ([key, value.flat().map(item => item.data).flat()])))
    // useCaseData.llmBlueprints = useCaseData.llmBlueprints.map(item => item.data).flat()



    // async function getUseCaseAssetDataOclient, ld(useCaseAssets) { 
    //     const data = Object.entries(useCaseAssets).map(([key, value]) => [key, value.data.map(item => assetFunction[key](item, "dummY"))] )
    //     const datadict = Object.fromEntries(data)
    //     ls = []
    //     for( const assetType in datadict) { 
    //         assets = []
    //         for( item in datadict[assetType]){

    //             result = await datadict[assetType][item]
    //             assets.push(result)
    //         }
    //         ls.push([assetType, assets])
    //     }
    //     ls = Object.fromEntries(ls)
    //     console.log( ls.sharedRoles)
    //     registeredModels = []
    //     for(const regModel in ls.registeredModels) { 
    //         for(const regModelVersion in ls.registeredModels[regModel]) { 
    //             result = await (ls.registeredModels[regModel][regModelVersion]);
    //             registeredModels.push(result)
    //         }
    //     }
    //     ls.registeredModels = registeredModels
    //     const dataReturn = Object.entries(ls).map( ([assetType, assets]) => [assetType, assets.map(asset => asset.data ) ]) 
    //     return Object.fromEntries(dataReturn)
    // }


    // const results = {}
    // for(const key in useCaseAssetDataPromises  ) {
    //     if( useCaseAssetDataPromises.hasOwnProperty(key)) {
    //         results[key] = await Promise.all( useCaseAssetDataPromises[key])
    //     }
    // }
    // const useCaseData = Object.fromEntries(Object.entries(results).map( ([key, value]) => ([key, value.flat().map(item => item.data).flat()])))
    // useCaseData.llmBlueprints = useCaseData.llmBlueprints.map( item => item.data).flat()


    //     const intermediateResult =[]
    //     Promise.all(useCaseAssetDataPromises[key]).then(results => {
    //         intermediateResult.push(results.flat())
    //     }).catch(error => {
    //     console.error('Error:', error);
    //     });
    //     results.push( [key, intermediateResult])
    // }



    // get nodes 
    // async function getDataset(datasetData) { 
    //     const datasetId = datasetData.datasetId 
    //     const datasetVersionId = datasetData.versionId
    //     return getDatasetUrl(client, datasetId, datasetVersionId)
    // }


    // async function getDeployment(deploymentData, useCaseId) { 
    //     const deploymentId = deploymentData.id
    //     return getDeploymentUrl(client, deploymentId)
    // }

    // //todo add notebooks
    // async function getPlayground(playgroundData, useCaseId) { 
    //     return {data: playgroundData}
    // }

    // async function getProject(projectData, useCaseId) {
    //     const projectId = projectData.projectId
    //     return getProjectUrl(client, projectId)
    // }

    // async function getRegisteredModel(registeredModelData, useCaseId) { 
    //     const registeredModelId = registeredModelData.id
    //     const versions = registeredModelData.versions 
    //     const resps = versions.map( 
    //         version => getRegisteredModelUrl(client, registeredModelId, version.id)
    //     )
    //     return resps
    // }

    // async function getVectorDatabase(vectorDatabaseData, useCaseId) { 
    //     return getVectorDatabaseUrl(client, vectorDatabaseData.id)
    // }

    // async function getSharedRoles(sharedRoleData) { 
    //     return {data: sharedRoleData}
    // }

    // async function getRecipeData(recipeData) { 
    //     if( recipeData.entityType === "RECIPE") { 
    //         return getRecipeUrl(client, recipeData.entityId)
    //     } else { 
    //         return {}
    //     }
    // }



    // assetFunction = { 
    //     'applications': (item) => [],
    //     'customApplications':  (items) => [],
    //     'data':  getRecipeData,
    //     'datasets': getDataset,
    //     'deployments': getDeployment,
    //     'notebooks':  (items) => [],
    //     'playgrounds': getPlaygrounds, 
    //     'projects': getProject, 
    //     'registeredModels': getRegisteredModel, 
    //     'vectorDatabases': getVectorDatabase, 
    //     'sharedRoles':  getSharedRoles
    // }





    // const useCaseId = "6601960e307c50932f22fa3e"
    // const useCasePromises = getUseCaseAssetsPromises(client, useCaseId)
    // const useCaseAssets = await getUseCaseAssets(useCasePromises)
    // const useCaseData = await getUseCaseAssetData(client, useCaseAssets)

    // const results = {}
    // for (const key in nodes) {
    //     if (nodes.hasOwnProperty(key)) {
    //         results[key] = await Promise.all(nodes[key])
    //     }
    // }

    // async function resolveNestedParentsArray(input) {
    //     // Loop over each object in the array and resolve its parents property recursively
    //     return await Promise.all(input.map(async (item) => {
    //         // Resolve the current object
    //         return await resolveNestedParents(item);
    //     }));
    // }

    // async function resolveNestedParents(input) {
    //     // If input is a Promise, resolve it first
    //     if (input && typeof input.then === 'function') {
    //         input = await input; // Wait for the promise to resolve
    //     }

    //     // If input has a 'parents' property which is an array of promises, resolve them
    //     if (input && Array.isArray(input.parents)) {
    //         // Resolve all promises in the 'parents' array
    //         input.parents = await Promise.all(input.parents.map(resolveNestedParents));
    //     }

    //     // Return the fully resolved object
    //     return input;
    // }


//     useCaseNodes.llmBlueprintNodes.map(getNodes).flat()
// useCaseNodes.recipeNodes.map(getNodes)
// useCaseNodes.datasetNodes.map(getNodes)
// useCaseNodes.vdbNodes.map(getNodes)
// useCaseNodes.projectNodes.map(getNodes)
// useCaseNodes.modelNodes.map(getNodes)
// useCaseNodes.registeredModelNodes.map(getNodes)
// useCaseNodes.deploymentNodes.map(getNodes)
// useCaseNodes.llmBlueprintNodes.map(getNodes)
// useCaseNodes.playgroundNodes.map(getNodes)
