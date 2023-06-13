import 'dotenv/config';
import { createBuild } from './operations/build.js';
import { archiveFile, listFolder } from './operations/files.js';
import { createService, updateService, makePublic } from './operations/run.js';
import { uploadFile, deleteFile, listFiles, deleteFiles, deployFiles, makeFrontendPublic, setMetadata, createBucket } from './operations/storage.js';
import { awaitInstance, createEndpoint, createBackendInstance, createMapping, createFrontendInstance } from './operations/compute.js';

export const createBackend = async (folderPath, serviceName, envVariables) => {
    console.time();

    console.info('STEP 1 of 10: Beginning archive...');
    const archivedFile = await archiveFile(folderPath);
    if (!archivedFile) return console.error('Archive failed!', archivedFile);

    console.info('STEP 2 of 10: Beginning file upload...');
    const upload = await uploadFile(archivedFile);
    if (!upload) return console.error('Upload failed!', upload);

    console.info('STEP 3 of 10: Beginning build creation... (1/3 longrunning - 60%)');
    const build = await createBuild(upload);
    if (!build) return console.error('Build creation failed!', build);

    console.info('STEP 4 of 10: Beginning service creation... (2/3 longrunning - 25%)');
    const service = await createService(serviceName, build?.artifacts?.images?.[0], envVariables);
    if (!service) return console.error('Service creation failed!', service);

    console.info('STEP 5 of 10: Beginning public access...');
    const access = await makePublic(service?.name);
    if (!access) return console.error('Public access failed!', access);

    console.info('STEP 6 of 10: Beginning endpoint creation...');
    const endpoint = await createEndpoint(serviceName);
    if (!endpoint) return console.error('Endpoint creation failed!', endpoint);

    console.info('STEP 7 of 10: Beginning instance creation...');
    const instance = await createBackendInstance(serviceName, endpoint?.latestResponse?.targetLink);
    if (!instance) return console.error('Instance creation failed!', instance);

    console.info('STEP 8 of 10: Tracking instance creation... (3/3 longrunning - 15%)');
    const trackedInstance = await awaitInstance(instance?.name);
    if (!trackedInstance) return console.error('Instance tracking failed!', trackedInstance);

    console.info('STEP 9 of 10: Beginning mapping creation...');
    const mapping = await createMapping(serviceName, instance?.latestResponse?.targetLink);
    if (!mapping) return console.error('Mapping creation failed!', mapping);

    console.info('STEP 10 of 10: Beginning file clean-up...');
    const clean = await Promise.all([ deleteFile(upload) ]);
    for (const file of clean) if (!file) return console.error('File clean-up failed!', clean);

    console.info('Backend successfully created.');
    console.timeEnd();
    return true;
};

export const updateBackend = async (folderPath, serviceName, envVariables) => {
    console.time();

    console.info('STEP 1 of 5: Beginning archive...');
    const archivedFile = await archiveFile(folderPath);
    if (!archivedFile) return console.error('Archive failed!', archivedFile);

    console.info('STEP 2 of 5: Beginning file upload...');
    const upload = await uploadFile(archivedFile);
    if (!upload) return console.error('Upload failed!', upload);

    console.info('STEP 3 of 5: Beginning build creation... (1/3 longrunning - 70%)');
    const build = await createBuild(upload);
    if (!build) return console.error('Build creation failed!', build);

    console.info('STEP 4 of 5: Beginning service creation... (2/2 longrunning - 30%)');
    const service = await updateService(serviceName, build?.artifacts?.images?.[0], envVariables);
    if (!service) return console.error('Service creation failed!', service);

    console.info('STEP 5 of 5: Beginning file clean-up...');
    const clean = await Promise.all([ deleteFile(upload) ]);
    for (const file of clean) if (!file) return console.error('File clean-up failed!', clean);

    console.info('Backend successfully updated.');
    console.timeEnd();
    return true;
};

export const createFrontend = async (folderPath, websiteName) => {
    console.time();

    console.info('STEP 1 OF 9: Beginning source creation...');
    const source = await createBucket(`idyle-${websiteName}`);
    if (!source) return console.error('Source creation failed!', source);

    console.info('STEP 2 of 9: Beginning instance creation...');
    const instance = await createFrontendInstance(websiteName, `idyle-${websiteName}`);
    if (!instance) return console.error('Instance creation failed!', instance);

    console.info('STEP 3 of 9: Tracking instance creation...');
    const trackedInstance = await awaitInstance(instance?.name);
    if (!trackedInstance) return console.error('Instance tracking failed!', trackedInstance);

    console.info('STEP 4 of 9: Beginning mapping creation...');
    const mapping = await createMapping(websiteName, instance?.latestResponse?.targetLink);
    if (!mapping) return console.error('Mapping creation failed!', mapping);

    console.info('STEP 5 of 9: Beginning file retrieval...');
    const currentFiles = await listFiles(`idyle-${websiteName}`);
    if (!currentFiles) return console.error('File retrieval failed!', currentFiles);

    console.info('STEP 6 of 9: Beginning file clean-up...');
    const deletedFiles = await deleteFiles(currentFiles, `idyle-${websiteName}`);
    if (!deletedFiles) return console.error('File clean-up failed!', deletedFiles);

    console.info('STEP of 7 of 9: Beginning file upload...');
    const uploadedFiles = await deployFiles(folderPath, (await listFolder(folderPath)), `idyle-${websiteName}`);
    if (!uploadedFiles) return console.error('FIle upload failed!', uploadedFiles);

    console.info('STEP 8 of 9: Beginning public access...');
    const access = await makeFrontendPublic(`idyle-${websiteName}`);
    if (!access) return console.error('Public access failed!', access);

    console.info('STEP 9 of 9: Beginning metadata set...');
    const metadata = await setMetadata({ 
        website: { mainPageSuffix: 'index.html', notFoundPage: 'index.html' }
    }, `idyle-${websiteName}`);
    if (!metadata) return console.error('Metadata set failed!', metadata);

    console.info('Frontend successfully created.');
    console.timeEnd();
    return true;
};

export const updateFrontend = async (folderPath, websiteName) => {
    console.time();

    console.info('STEP 1 of 4: Beginning file retrieval...');
    const currentFiles = await listFiles(`idyle-${websiteName}`);
    if (!currentFiles) return console.error('File retrieval failed!', currentFiles);

    console.info('STEP 2 of 4: Beginning file clean-up...');
    const deletedFiles = await deleteFiles(currentFiles, `idyle-${websiteName}`);
    if (!deletedFiles) return console.error('File clean-up failed!', deletedFiles);

    console.info('STEP 3 of 4: Beginning file upload...');
    const uploadedFiles = await deployFiles(folderPath, (await listFolder(folderPath)), `idyle-${websiteName}`);
    if (!uploadedFiles) return console.error('FIle upload failed!', uploadedFiles);

    console.info('STEP 4 of 4: Beginning metadata set...');
    const metadata = await setMetadata({ 
        website: { mainPageSuffix: 'index.html', notFoundPage: 'index.html' }
    }, `idyle-${websiteName}`);
    if (!metadata) return console.error('Metadata set failed!', metadata);

    console.info('Frontend successfully updated.');
    console.timeEnd();
    return true;
};

// createBackend('../api', 'deployerapitestrelease15', [ 
//     { name: 'STRIPE_KEY', value: 'sk_test_51MbGHnBVlu9NzRVapG50u76rafurul6CDL6EY2wodmLM0dcTJL7s0Z6nfCFGqUbGP2Ys8vTnAHnxmqNqzuJKLZoR00HLeLsz94' },
//     { name: 'PROJECT', value: 'idyleio' }, { name: 'DEFAULT_BUCKET', value: 'idyle' }, { name: 'DEFAULT_LOAD_BALANCER', value: 'lb' }
// ])

// updateBackend('../api', 'deployerapitestrelease15', [ 
//     { name: 'STRIPE_KEY', value: 'sk_test_51MbGHnBVlu9NzRVapG50u76rafurul6CDL6EY2wodmLM0dcTJL7s0Z6nfCFGqUbGP2Ys8vTnAHnxmqNqzuJKLZoR00HLeLsz94' },
//     { name: 'PROJECT', value: 'idyleio' }, { name: 'DEFAULT_BUCKET', value: 'idyle' }, { name: 'DEFAULT_LOAD_BALANCER', value: 'lb' },
//     { name: 'API_BASEPATH', value: 'https://idyle.app'}
// ])

// createFrontend('../app/build', 'idyletest');
// updateFrontend('../app/build')