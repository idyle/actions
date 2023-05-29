import dotenv from 'dotenv';
import Path from 'path';
dotenv.config({ path: Path.resolve('../cli/.env') });
// temporary import 
import { ServicesClient } from '@google-cloud/run';
import { promisify } from 'util';

const services = new ServicesClient();
const project = process.env.PROJECT_NAME;
const serviceAccount = process.env.DEFAULT_SERVICE_ACCOUNT;
const defaultLocation = process.env.DEFAULT_LOCATION;

// createService

export const createService = async (serviceName, image, envVariables = []) => {
    if (!serviceName || !image) return false;
    try {
        const config = {
            parent: `projects/${project}/locations/${defaultLocation}`,
            service: {
                ingress: 'INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER',
                template: { serviceAccount, containers: [ { image, env: envVariables }] }
            },
            serviceId: serviceName
        };

        const [ operation ] = await services.createService(config);
        const [ response ] = await operation.promise();
        console.log('RESPONSE FROM CREATE SERVICE', response);
        return response;

    } catch (e) {
        console.error(e);
        return false;
    }
};

// updateService

export const updateService = async (serviceName, image, envVariables = []) => {
    if (!serviceName || !image) return false;
    try {
        const config = {
            service: {
                name: `projects/${project}/locations/${defaultLocation}/services/${serviceName}`,
                ingress: 'INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER',
                template: { serviceAccount, containers: [ { image, env: envVariables }] }
            }
        };

        const [ operation ] = await services.updateService(config);
        const [ response ] = await operation.promise();
        console.log('RESPONSE FROM UPDATE SERVICE', response);
        return response;

    } catch (e) {
        console.error(e);
        return false;
    }
};


// makePublic

export const makePublic = async (serviceName) => {
    if (!serviceName) return false;
    try {
        const config = {
            policy: { bindings: [ { role: "roles/run.invoker", members: [ "allUsers" ] } ] },
            resource: serviceName
        };

        const operation = await services.setIamPolicy(config);
        console.log('RESPONSE FROM MAKE PUBLIC', operation);
        return operation;

    } catch (e) {
        console.error(e);
        return false;
    }
};

// // awaitService

// export const getOperation = async (operationName) => {
//     if (!operationName) return false;
//     try {
//         const config = {
//             name: operationName
//         };

//         const [ operation ] = await services.getOperation(config);
//         if (operation?.error || !operation) return false;
//         return operation;

//     } catch (e) {
//         console.error(e);
//         return false;
//     }
// };

// export const awaitService = async (operationName) => {
//     for (let round = 0; round < 40; round++) {
//         // max build time is 40 * 3000ms = 120s / 2m
//         const startTime = Date.now();
//         const service = await getOperation(operationName);
//         if (service?.done && check?.error) return false;
//         else if (service?.done && check?.response) return true;
//         await promisify(setTimeout)(3000 - (Date.now() - startTime));
//     }
//     return false;
// };