import 'dotenv/config';
// temporary import

import { CloudBuildClient } from '@google-cloud/cloudbuild';
import { randomBytes } from 'crypto';
import { promisify } from 'util';

const build = new CloudBuildClient();

const project = process.env.PROJECT_NAME;
const storageBucket = process.env.DEFAULT_BUCKET_NAME;
const storageDeploymentBucket = process.env.DEPLOYMENT_BUCKET_NAME;
const artifactDeploymentRepository = process.env.DEPLOYMENT_REPOSITORY;
const artifactPath = process.env.ARTIFACT_PATH;

// create Build

export const createBuild = async (objectFileName) => {
    if (!objectFileName) return false;
    try {
        const imageName = randomBytes(16).toString('hex');
        const imagePath = `${artifactPath}/${artifactDeploymentRepository}/${imageName}`;
        const config = {
            projectId: project,
            build: {
                source: { storageSource: { bucket: storageBucket, object: `${storageDeploymentBucket}/${objectFileName}` } },
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

// // get build status

// const getBuild = async (buildId) => {
//     if (!buildId) return false;
//     try {
//         const config = { projectId: project, id: buildId };
//         const [ response ] = await build.getBuild(config);
//         console.log('RESPONSE FROMG ET BUILD', response);
//         return response;
//     } catch (e) {
//         console.error(e);
//         return false;
//     }
// };

// // track build

// export const awaitBuild = async (buildId) => {
//     for (let round = 0; round < 40; round++) {
//         // max build time is 40 * 3000ms = 120s / 2m
//         const startTime = Date.now();
//         const build = await getBuild(buildId);
//         console.log(`Round ${round}, Status: ${build?.status}`);
//         if (build?.status === 'FAILURE' || build?.status === 'INTERNAL_ERROR') return false;
//         else if (build?.status === 'SUCCESS') return true;
//         await promisify(setTimeout)(3000-(Date.now() - startTime));
//     }
//     return false;
// };
