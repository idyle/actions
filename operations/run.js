import dotenv from 'dotenv';
import { ServicesClient } from '@google-cloud/run';
import Path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: Path.join(__dirname, '..', '.env') });

const services = new ServicesClient();
const defaultLocation = process.env.IDYLE_CLI_DEFAULT_LOCATION;
// const project = process.env.PROJECT_NAME;
// const serviceAccount = process.env.DEFAULT_SERVICE_ACCOUNT;

const getClient = async () => {
    const { email, projectId } = await services.auth.getClient();
    return { serviceAccount: email, project: projectId };
};

// createService

export const createService = async (serviceName, image, envVariables = []) => {
    if (!serviceName || !image) return false;
    try {
        const { serviceAccount, project } = await getClient();
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
        const { serviceAccount, project } = await getClient();
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