import dotenv from 'dotenv';
import Path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: Path.join(__dirname, '..', '.env') });

import { CloudBuildClient } from '@google-cloud/cloudbuild';
import { randomBytes } from 'crypto';

const build = new CloudBuildClient();

const defaultBucket = process.env.IDYLE_CLI_DEFAULT_BUCKET;
const defaultLocation = process.env.IDYLE_CLI_DEFAULT_LOCATION;
// const storageDeploymentBucket = process.env.DEPLOYMENT_BUCKET_NAME;
// const artifactDeploymentRepository = process.env.DEPLOYMENT_REPOSITORY;
// const artifactPath = process.env.ARTIFACT_PATH;

const getClient = async () => {
    const { email, projectId } = await build.auth.getClient();
    return { serviceAccount: email, project: projectId };
};

// create Build

export const createBuild = async (objectFileName) => {
    if (!objectFileName) return false;
    try {
        const { project } = await getClient();
        const artifactPath = `${defaultLocation}-docker.pkg.dev/${project}`;
        const imageName = randomBytes(16).toString('hex');
        const imagePath = `${artifactPath}/deployments/${imageName}`;
        const config = {
            projectId: project,
            build: {
                source: { storageSource: { bucket: defaultBucket, object: `deployments/${objectFileName}` } },
                steps: [
                    {
                        name: 'gcr.io/k8s-skaffold/pack',
                        args: ['pack', 'build', imagePath, '--builder', 'gcr.io/buildpacks/builder']
                    }
                ],
                images: [ imagePath ]
            }
        };

        const [ operation ] = await build.createBuild(config);
        const [ response ] = await operation.promise();
        console.log('RESPOSNE FROM CREATE BUILD', response);
        return response;
    } catch (e) {
        console.error(e);
        return false;
    }
};