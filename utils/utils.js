
import axios from "axios";
import path from "path";
import fs from "fs";

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

const STORAGE = "./storage";

async function getUseCaseAssetsPromises(client, useCaseId) {
    const useCase = await (client.get(`useCases/${useCaseId}`))
    // const entities = ["projects", "applications", "customApplications", "datasets", "deployments", "notebooks", "playgrounds", "projects", "registeredModelVersions", "vectorDatabases"]
    const uce = Object.keys(useCase.data).filter( (item) => item.includes("Count") ).map( item => item.replace("Count", ""))
    const applications = uce.includes("applications") ? client.get(`useCases/${useCaseId}/applications`) :  Promise.resolve(({ data: [] }))
    const customApplications = uce.includes("customApplications") ? client.get(`useCases/${useCaseId}/customApplications`) :  Promise.resolve(({ data: [] }))
    // in the data use case assets, we only care about the RECIPE entities
    const data = uce.includes("recipes") ? client.get(`useCases/${useCaseId}/data`) :  Promise.resolve(({ data: [] }))
    const datasets = uce.includes("datasets") ? client.get(`useCases/${useCaseId}/datasets`) :  Promise.resolve(({ data: [] }))
    const deployments = uce.includes("deployments") ? client.get(`useCases/${useCaseId}/deployments`) :  Promise.resolve(({ data: [] }))
    const notebooks = uce.includes("notebooks") ? client.get(`useCases/${useCaseId}/notebooks`) :  Promise.resolve(({ data: [] }))
    const playgrounds = uce.includes("playgrounds") ? client.get(`useCases/${useCaseId}/playgrounds`) :  Promise.resolve(({ data: [] }))
    const projects = uce.includes("projects") ? client.get(`useCases/${useCaseId}/projects`) :  Promise.resolve(({ data: [] }))
    const registeredModels = uce.includes("registeredModels") ? client.get(`useCases/${useCaseId}/registeredModels`) :  Promise.resolve(({ data: [] }))
    const vectorDatabases = uce.includes("vectorDatabases") ? client.get(`useCases/${useCaseId}/vectorDatabases`) :  Promise.resolve(({ data: [] }))
    const sharedRoles = client.get(`useCases/${useCaseId}/sharedRoles`)
    return {
        applications: applications,
        customApplications: customApplications,
        data: data,
        datasets: datasets,
        deployments: deployments,
        notebooks: notebooks,
        playgrounds: playgrounds,
        projects: projects,
        registeredModels: registeredModels,
        vectorDatabases: vectorDatabases,
        sharedRoles
    }
}

async function getUseCaseAssets(promise) {
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

//todo add applications and custom applications

async function getCustomModelVersionFromId(client, customModelId, customModelVersionId) {
    return client.get(`customModels/${customModelId}/versions/${customModelVersionId}`)
}

async function getDataStoreFromId(client, dataStoreId) {
    return client.get(`externalDataStores/${dataStoreId}`)
}

async function getDataSourceFromId(client, dataSourceId) {
    return client.get(`externalDataSources/${dataSourceId}`)
}

async function getDatasetFromId(client, datasetId, datasetVersionId) {
    // !datasetVersionId ? console.log("dataset version is not defined.  using latest version") : {}
    const url = !datasetVersionId ? `datasets/${datasetId}` : `datasets/${datasetId}/versions/${datasetVersionId}`
    return client.get(url)
}

async function getDeploymentFromId(client, deploymentId) {
    return client.get(`deployments/${deploymentId}`)
}

async function getLLMBlueprintsFromPlaygroundId(client, playgroundId) {
    return client.get("genai/llmBlueprints/",
        {
            params: { playgroundId: playgroundId }
        })
}

async function getModelsFromProjectId(client, projectId) {
    return client.get(`projects/${projectId}/models`)
}

async function getModelFromProjectId(client, modelId, projectId) {
    return client.get(`projects/${projectId}/models/${modelId}`)
}

async function getProjectFromId(client, projectId) {
    const resp = client.get(`projects/${projectId}`)
    return resp
}

async function getVectorDatabaseFromId(client, vectorDatabaseId) {
    return client.get(`genai/vectorDatabases/${vectorDatabaseId}/`)
}

async function getRecipeFromId(client, recipeId) {
    return client.get(`recipes/${recipeId}`)
}

async function getRegisteredModelFromId(client, registeredModelId, versionId) {
    const url = `registeredModels/${registeredModelId}/versions/${versionId}`
    return client.get(url)
}

async function getUseCaseAssetData(client, useCaseAssets) {

    //  const applications = useCaseAssets.applications
    //  const customApplications = useCaseAssets.customApplications
    const data = useCaseAssets.data.data.filter(item => item.entityType === "RECIPE").map(item => getRecipeFromId(client, item.entityId))
    const datasets = useCaseAssets.datasets.data.map(item => getDatasetFromId(client, item.datasetId, item.versionId))
    const deployments = useCaseAssets.deployments.data.map(item => getDeploymentFromId(client, item.id))
    //  const notebooks = useCaseAssets.notebooks
    const playgrounds = useCaseAssets.playgrounds.data.map(item => Promise.resolve(({ data: item })))
    const llmBlueprints = useCaseAssets.playgrounds.data.map(item => getLLMBlueprintsFromPlaygroundId(client, item.entityId)).flat()
    const projects = useCaseAssets.projects.data.map(item => getProjectFromId(client, item.projectId))
    const models = useCaseAssets.projects.data.map(item => getModelsFromProjectId(client, item.projectId)).flat()
    const registeredModels = useCaseAssets.registeredModels.data.map(
        item => {
            const registeredModelId = item.id
            return item.versions.map(
                version => getRegisteredModelFromId(client, registeredModelId, version.id)
            )
        }
    ).flat()
    const vectorDatabases = useCaseAssets.vectorDatabases.data.map(item => getVectorDatabaseFromId(client, item.id))
    const sharedRoles = useCaseAssets.sharedRoles.data.map(item => Promise.resolve(({ data: item })))
    const useCaseAssetDataPromises = {
        // applications: applications,
        // customApplications: customApplications,
        recipes: data,
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

    const results = {}
    for (const key in useCaseAssetDataPromises) {
        if (useCaseAssetDataPromises.hasOwnProperty(key)) {
            results[key] = await Promise.all(useCaseAssetDataPromises[key])
        }
    }
    const useCaseData = Object.fromEntries(Object.entries(results).map(([key, value]) => ([key, value.flat().map(item => item.data).flat()])))
    useCaseData.llmBlueprints = useCaseData.llmBlueprints.map(item => item.data).flat()
    return useCaseData
}

// get nodes
async function getDataStoreNode(client, datastoreId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const resp = await getDataStoreFromId(client, datastoreId)
    const datastore = resp.data
    return {
        assetId: datastoreId,
        id: datastoreId,
        label: "datastore",
        name: datastore.canonicalName,
        driverClassType: datastore.driverClassType,
        parents: [],
        url: path.join(baseUrl, "account", "data-connections",)
    }
}

async function getDataSourceNode(client, dataSourceId, dataStoreId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const resp = await getDataSourceFromId(client, dataSourceId)
    const datasource = resp.data
    const name = datasource.canonicalName
    const dsStoreId = dataStoreId ? dataStoreId : datasource.params.dataStoreId
    return {
        assetId: dataSourceId,
        id: dataSourceId,
        name: name, label: "datasource",
        parents: [getDataStoreNode(client, dsStoreId)],
        url: path.join(baseUrl, "account", "data-connections")
    }
}

async function getRecipeNode(client, useCaseData, recipeId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const recipe = useCaseData.recipes.filter(item => item.recipeId === recipeId)[0]
    const node = recipe ? recipe : (await getRecipeFromId(client, recipeId)).data
    const inputs = node.inputs
    const parents = []
    inputs.forEach(
        input => {
            if (input.inputType === "datasource") {
                parents.push(getDataSourceNode(client, input.dataSourceId, input.dataStoreId))
            } else if (input.inputType === "dataset") {
                parents.push(getDatasetNode(client, useCaseData, input.datasetId, input.datasetVersionId))
            }
        }
    )
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "wrangler", recipeId)
    return {
        assetId: recipeId,
        id: recipeId,
        label: "recipes",
        parents: parents,
        url: url,
        name: node.name
    }
}

async function getDatasetNode(client, useCaseData, datasetId, datasetVersionId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const ds = useCaseData.datasets.filter(item => item.datasetId === datasetId & item.datasetVersionId === datasetVersionId)[0]
    const dataset = ds ? ds : (await getDatasetFromId(client, datasetId, datasetVersionId)).data
    const recipeId = dataset.recipeId
    const dataSourceId = dataset.dataSourceId
    const dataEngineQueryId = dataset.dataEngineQueryId
    const parents = []
    if (recipeId) {
        parents.push(getRecipeNode(client, useCaseData, recipeId))
    }
    if (dataSourceId) {
        parents.push(getDataSourceNode(client, dataSourceId))
    }
    if (dataEngineQueryId) {
        parents.push([{ label: "dataEngineQueries", assetId: dataEngineQueryId }])
    }
    return {
        assetId: datasetId,
        assetVersionId: dataset.versionId,
        id: `${datasetId}-${dataset.versionId}`,
        label: "datasets",
        name: dataset.name,
        url: path.join(baseUrl, "ai-catalog", dataset.datasetId),
        parents: parents
    }
}

async function getVectorDatabaseNode(client, useCaseData, vdbId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const vdb = useCaseData.vectorDatabases.filter(item => item.entityId === vdbId)[0]
    const vectorDatabase = vdb ? vdb : (await getVectorDatabaseFromId(client, vdbId)).data
    const datasetId = vectorDatabase.datasetId
    const datasetNode = getDatasetNode(client, useCaseData, datasetId)
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "vector-databases", vdbId, `?versionId=${vectorDatabase.id}`)
    return {
        assetId: vectorDatabase.familyId,
        assetVersionId: vectorDatabase.id,
        id: `${vectorDatabase.familyId}-${vectorDatabase.id}`,
        label: "vectorDatabases",
        name: vectorDatabase.name,
        url: url,
        parents: [datasetNode]
    }
}

async function getProjectNode(client, useCaseData, projectId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const p = useCaseData.projects.filter(item => item.id === projectId)[0]
    const project = p ? p : (await getProjectFromId(client, projectId)).data
    const datasetId = project.catalogId;
    const datasetVersionId = project.catalogVersionId;
    const parents = []
    const url = path.join(baseUrl, "projects", projectId)
    if (datasetId) {
        parents.push(getDatasetNode(client, useCaseData, datasetId, datasetVersionId))
    }
    return {
        assetId: project.id,
        label: "projects",
        id: project.id,
        name: project.projectName,
        targetType: project.targetType,
        datasource: datasetId ? "registry" : "local",
        url: url,
        parents: parents
    }
}

async function getModelNode(client, useCaseData, modelId, projectId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const m = useCaseData.models.filter(item => item.id === modelId)[0]
    const model = m ? m : (await getModelFromProjectId(client, modelId, projectId)).data
    const parents = [getProjectNode(client, useCaseData, projectId)]
    return {
        assetId: modelId,
        label: "models",
        id: modelId,
        url: path.join(baseUrl, "projects", projectId, "models", modelId),
        modelType: model.modelType,
        modelFamily: model.modelFamily,
        parents: parents,
    }
}

async function getCustomModelVersionNode(client, customModelId, customModelVersionId, customModelVersionLabel) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    let cmvId = customModelVersionId
    if (customModelVersionLabel) {
        const customModelVersions = (await client.get(`customModels/${customModelId}/versions`)).data
        const customModelVersion = customModelVersions["data"].filter(item => item.label === customModelVersionLabel)[0]
        cmvId = customModelVersion.id
    } else if (customModelVersionId) {
        { }
    }
    const url = path.join(baseUrl, "registry", "custom-model-workshop", customModelId, "versions", cmvId)
    return {
        assetId: customModelId,
        assetVersionId: cmvId,
        id: `${customModelId}-${cmvId}`,
        url: url,
        parents: []
    }
}

async function getRegisteredModelNode(client, useCaseData, regModelId, regModelVersionId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const m = useCaseData.registeredModels.filter(item => item.registeredModelId === regModelId & item.id === regModelVersionId)[0]
    const url = path.join(baseUrl, "registry", "registered-models", regModelId, "version", regModelVersionId, "info")
    const regModel = m ? m : (await getRegisteredModelFromId(client, regModelId, regModelVersionId)).data
    const source = regModel.sourceMeta.projectId ? "project" : "customModel"
    const parents = []
    if (source === "project") {
        const projectId = regModel.sourceMeta.projectId
        const modelId = regModel.modelId
        parents.push(getModelNode(client, useCaseData, modelId, projectId))
    } else {
        const customModelId = regModel.sourceMeta.customModelDetails.id
        const versionLabel = regModel.sourceMeta.customModelDetails.versionLabel
        parents.push(getCustomModelVersionNode(client, customModelId, undefined, versionLabel))
    }
    return {
        assetId: regModelId,
        assetVersionId: regModelVersionId,
        id: `${regModelId}-${regModelVersionId}`,
        url: url,
        label: "registeredModels",
        name: regModel.name,
        parents: parents
    }

}

async function getDeploymentNode(client, useCaseData, deploymentId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const dep = useCaseData.deployments.filter(item => item.id === deploymentId)[0]
    const deployment = dep ? dep : (await getDeploymentFromId(client, deploymentId)).data;
    const regModelId = deployment.modelPackage.registeredModelId
    const regModelVersionId = deployment.modelPackage.id
    const parents = [getRegisteredModelNode(client, useCaseData, regModelId, regModelVersionId)]
    const url = path.join(baseUrl, "console-nextgen", "deployments", deployment.id, "overview")
    return {
        assetId: deployment.id,
        name: deployment.label,
        id: deployment.id,
        label: "deployments",
        url: url,
        parents: parents

    }
}

async function getLlmNode(client, llmId) {
    return {
        assetId: llmId,
        id: llmId,
        label: "llm",
        parents: []
    }
}

async function getPlaygroundNode(client, useCaseData, playgroundId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    // const pg = useCaseData.playgrounds.filter( item => item.id === playgroundId)[0]
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "playgrounds", playgroundId, "comparison")
    return {
        assetId: playgroundId,
        id: playgroundId,
        label: "playgrounds",
        url: url,
        parents: []
    }
}

async function getLlmBlueprintNode(client, useCaseData, llmBlueprintId) {
    const baseUrl = client.getUri().replace("/api/v2", "")
    const llmBp = useCaseData.llmBlueprints.filter(item => item.id === llmBlueprintId)[0]
    const vdbId = llmBp.vectorDatabaseId
    const llmId = llmBp.llmId
    const playgroundId = llmBp.playgroundId
    const url = path.join(baseUrl, "usecases", useCaseData.useCaseId, "playgrounds", playgroundId, "llmBlueprint", llmBp.id)
    const parents = []
    if (vdbId) {
        parents.push(getVectorDatabaseNode(client, useCaseData, vdbId))
    }
    parents.push(getLlmNode(client, llmId))
    parents.push(getPlaygroundNode(client, useCaseData, playgroundId))
    return {
        assetId: llmBp.id,
        id: llmBp.id,
        label: "llmBlueprint",
        name: llmBp.name,
        url: url,
        parents: parents
    }

}

async function resolveNestedParentsArray(input) {
    
    // Loop over each object in the array and resolve its parents property recursively
    return await Promise.all(input.map(async (item) => {
        // Resolve the current object
        return await resolveNestedParents(item);
    }));
}

async function resolveNestedParents(input) {
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

async function getUseCaseNodes(client, useCaseData) {
    const nodes = {

        recipeNodes: useCaseData.recipes.map(recipe => getRecipeNode(client, useCaseData, recipe.recipeId)),
        datasetNodes: useCaseData.datasets.map(dataset => getDatasetNode(client, useCaseData, dataset.datasetId, dataset.versionId)),
        vdbNodes: useCaseData.vectorDatabases.map(vdb => getVectorDatabaseNode(client, useCaseData, vdb.id)),
        projectNodes: useCaseData.projects.map(proj => getProjectNode(client, useCaseData, proj.id)),
        modelNodes: useCaseData.models.map(model => getModelNode(client, useCaseData, model.id, model.projectId)),
        registeredModelNodes: useCaseData.registeredModels.map(regModel => getRegisteredModelNode(client, useCaseData, regModel.registeredModelId, regModel.id)),
        deploymentNodes: useCaseData.deployments.map(dep => getDeploymentNode(client, useCaseData, dep.id)),
        llmBlueprintNodes: useCaseData.llmBlueprints.map(llmBp => getLlmBlueprintNode(client, useCaseData, llmBp.id)),
        playgroundNodes: useCaseData.playgrounds.map(playground => getPlaygroundNode(client, useCaseData, playground.id)),

    }

    // const results = {}
    for (const key in nodes) {
        if (nodes.hasOwnProperty(key)) {
            nodes[key] = await Promise.all(nodes[key])
        }
    }

    for (const key in nodes) {
        if (nodes.hasOwnProperty(key)) {
            nodes[key] = await resolveNestedParentsArray(nodes[key])
        }
    }

    return nodes
}

function getNodes(node) {
    const nodes = []
    function helper(node, parents) {
        nodes.push(node)
        parents.map((n) => {
            nodes.push(n)
            return helper(n, n.parents)
        })
    }
    helper(node, node.parents)
    return nodes.flat()
}

function flattenNodes(nodes) {
    const allNodes = []
    for (const key in nodes) {
        if (nodes.hasOwnProperty(key)) {
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
        const useCaseAssets = await getUseCaseAssets(useCasePromises)
        const useCaseData = await getUseCaseAssetData(client, useCaseAssets)
        useCaseData["useCaseId"] = useCaseId
        const useCaseNodes = await getUseCaseNodes(client, useCaseData)
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
    //     return getDatasetFromId(client, datasetId, datasetVersionId)
    // }


    // async function getDeployment(deploymentData, useCaseId) { 
    //     const deploymentId = deploymentData.id
    //     return getDeploymentFromId(client, deploymentId)
    // }

    // //todo add notebooks
    // async function getPlayground(playgroundData, useCaseId) { 
    //     return {data: playgroundData}
    // }

    // async function getProject(projectData, useCaseId) {
    //     const projectId = projectData.projectId
    //     return getProjectFromId(client, projectId)
    // }

    // async function getRegisteredModel(registeredModelData, useCaseId) { 
    //     const registeredModelId = registeredModelData.id
    //     const versions = registeredModelData.versions 
    //     const resps = versions.map( 
    //         version => getRegisteredModelFromId(client, registeredModelId, version.id)
    //     )
    //     return resps
    // }

    // async function getVectorDatabase(vectorDatabaseData, useCaseId) { 
    //     return getVectorDatabaseFromId(client, vectorDatabaseData.id)
    // }

    // async function getSharedRoles(sharedRoleData) { 
    //     return {data: sharedRoleData}
    // }

    // async function getRecipeData(recipeData) { 
    //     if( recipeData.entityType === "RECIPE") { 
    //         return getRecipeFromId(client, recipeData.entityId)
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
