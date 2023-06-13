import dotenv from 'dotenv';
import { BackendServicesClient, GlobalOperationsClient, UrlMapsClient, RegionNetworkEndpointGroupsClient, BackendBucketsClient } from '@google-cloud/compute';
import Path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: Path.join(__dirname, '..', '.env') });

const frontend = new BackendBucketsClient();
const backend = new BackendServicesClient();
const operations = new GlobalOperationsClient();
const mappings = new UrlMapsClient();
const endpoints = new RegionNetworkEndpointGroupsClient();

const project = process.env.PROJECT_NAME;
const loadBalancer = process.env.DEFAULT_LOAD_BALANCER_NAME;
const defaultLocation = process.env.DEFAULT_LOCATION;

export const createEndpoint = async (serviceName) => {
    if (!serviceName) return false;
    try {
        const config = {
            project,
            networkEndpointGroupResource: { 
                name: serviceName,
                cloudRun: { service: serviceName },
                networkEndpointType: 'SERVERLESS'
            },
            region: defaultLocation
        };
        const [ operation ] = await endpoints.insert(config);
        console.log('endpoint', operation);
        if (operation?.error || !operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

// export const awaitEndpoint = async (operationId) => {
//     if (!operationId) return false;
//     try {
//         const config = {
//             project,
//             operation: operationId,
//             region: defaultLocation
//         };
//         const [ operation ] = await regionalOperations.wait(config);
//         if (operation?.error) return false;
//         return operation?.status;
//     } catch (e) {
//         console.error(e);
//         return false;
//     };
// };

export const createFrontendInstance = async (websiteName, bucketName) => {
    if (!websiteName || !bucketName) return false;
    try {
        const config = { 
            project,
            backendBucketResource: { name: websiteName, bucketName }    
        };
        const [ operation ] = await frontend.insert(config);
        console.log(operation);
        if (!operation || operation?.error) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const createBackendInstance = async (serviceName, endpointLink) => {
    if (!serviceName) return false;
    try {
        const config = { 
            project,
            backendServiceResource: {
                name: serviceName,
                backends: [ { group: endpointLink }],
                loadBalancingScheme: 'EXTERNAL_MANAGED'
            }    
        };
        const [ operation ] = await backend.insert(config);
        console.log('created instance', operation);
        if (!operation || operation?.error) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const awaitInstance = async (operationId) => {
    if (!operationId) return false;
    try {
        const config = {
            project,
            operation: operationId
        };
        const [ operation ] = await operations.wait(config);
        console.log(operation, operation?.error);
        if (operation?.error) return false;
        return operation?.status;
    } catch (e) {
        console.error(e);
        return false;
    };
};

const listMappings = async () => {
    try {
        const config = { project };
        const [ [ operation ] ] = await mappings.list(config);
        if (!operation || operation?.error) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const createMapping = async (serviceName, backendLink) => {
    if (!serviceName || !backendLink) return false;
    const list = await listMappings();
    if (!list) return false;
    try {
        const config = {
            project,
            urlMap: loadBalancer,
            urlMapResource: {
                name: loadBalancer,
                pathMatchers: [ ...list?.pathMatchers, { name: `${serviceName}-path`, defaultService: backendLink } ],
                hostRules: [ ...list?.hostRules, { hosts: [ `${serviceName}.idyle.app` ], pathMatcher: `${serviceName}-path` } ]
            }
        };
        const [ operation ] = await mappings.patch(config);
        if (!operation || operation?.error) return false; 
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};