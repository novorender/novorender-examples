import { View, getDeviceProfile } from "@novorender/api";
import { createAPI, type SceneData } from "@novorender/data-js-api";
import { getSceneIndexUrl, storage, updateSceneInfo } from "./utils";
import { createLogger } from "./logger";

// Get canvas and button references from the HTML document
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const btnFullDownload = document.getElementById("btnFullDownload") as HTMLButtonElement;
const btnIncrementalDownload = document.getElementById("btnIncrementalDownload") as HTMLButtonElement;
const btnDelete = document.getElementById("btnDelete") as HTMLButtonElement;

const gpuTier = 2;  // Assumed GPU tier for a reasonably new/powerful GPU.
const deviceProfile = getDeviceProfile(gpuTier);
const baseUrl = new URL("/novorender/api/", window.location.origin); // or wherever you copied the public/ files from the package.
const serviceUrl = "https://data.novorender.com/api";
const sceneId = "95a89d20dd084d9486e383e131242c4c"; // Default Condos scene ID, which is public.

const imports = await View.downloadImports({ baseUrl });
const view = new View(canvas, deviceProfile, imports);
let projectId = view?.renderState.scene?.config.id;
const offlineWorkerState = await view.manageOfflineStorage();
const dataApi = createAPI({ serviceUrl });

// Load scene metadata
const sceneData = await dataApi.loadScene(sceneId);
const { url: _url } = sceneData as SceneData;
const url = new URL(_url);
const parentSceneId = url.pathname.replaceAll("/", "");
url.pathname = "";

// Load the scene using URL obtained from `sceneData`
const config = await view.loadScene(url, parentSceneId, "index.json");
const { center, radius } = config.boundingSphere;
// Attempt to fit controller position such that the specified bounding sphere is brought into view.
view.activeController.autoFit(center, radius);

// Initialize scene ID with a delay to ensure it's available
const interval = setInterval(() => {
    if (view?.renderState.scene?.config.id) {
        projectId = view.renderState.scene.config.id;
        clearInterval(interval);
    }
}, 100);

// Attach button event handlers
btnFullDownload.onclick = initFullDownload;
btnIncrementalDownload.onclick = initIncrementalDownload;
btnDelete.onclick = deleteOfflineScene;

// check the initial offline status
if (offlineWorkerState) {
    [...offlineWorkerState.scenes.values()].forEach((scene) => {
        const meta = storage.get(scene.id);

        if (!meta) return;

        updateSceneInfo({
            scene: scene.id,
            status: scene.manifest.numFiles === 0 ? "incremental" : "synchronized",
            lastSync: meta.lastSynced,
            progress: "",
            scanProgress: "",
            size: scene.manifest.totalByteSize,
        });

        scene.logger = createLogger(scene.id, offlineWorkerState);
    });
}

// Run the view and clean up resources
await view.run();
view.dispose();

/**
 * Initializes the incremental download process.
 */
async function initIncrementalDownload() {
    const scene =
        offlineWorkerState.scenes.get(parentSceneId) ??
        (await offlineWorkerState.addScene(parentSceneId));

    if (!scene) return;

    if (
        (await scene.readManifest(getSceneIndexUrl(view), new AbortController().signal)) === undefined
    ) {
        return alert("Invalid format");
    }

    const sceneData = await dataApi.loadScene(sceneId);
    if ("error" in sceneData) {
        scene.logger?.status("error");
        return;
    }

    const persisted = await navigator.storage.persisted();
    if (!persisted) {
        await navigator.storage.persist();
    }

    const meta = storage.get(parentSceneId);
    const viewerScene = {
        id: sceneId,
        name: sceneData.title,
        lastSynced: new Date().toISOString(),
    };

    const toStore = {
        id: parentSceneId,
        name: parentSceneId,
        lastSynced: meta?.lastSynced ?? "",
        viewerScenes: meta
            ? meta.viewerScenes.find((vs) => vs.id === sceneId)
                ? meta.viewerScenes.map((vs) => (vs.id === sceneId ? viewerScene : vs))
                : meta.viewerScenes.concat(viewerScene)
            : [viewerScene],
    };
    storage.set(toStore);

    updateSceneInfo({
        scene: parentSceneId,
        status: "incremental",
        lastSync: toStore.lastSynced,
        size: scene.manifest.totalByteSize,
    });

    scene.logger = createLogger(parentSceneId, offlineWorkerState);
}

/**
 * Initializes the full download process for offline use.
 */
async function initFullDownload() {
    console.log("Init Full Download", projectId);

    if (!projectId) return;

    const parentSceneId = projectId;
    const scene =
        offlineWorkerState?.scenes.get(parentSceneId) ?? (await offlineWorkerState?.addScene(parentSceneId));

    if (!scene) return;

    const { quota, usage } = offlineWorkerState.initialStorageEstimate ?? {};

    if (quota === undefined || usage === undefined) return;

    const availableSize = Math.max(0, quota - usage);
    const totalSize = await scene.readManifest(
        view.offline!.manifestUrl,
        new AbortController().signal // implement a proper `AbortController` in your production code
    );
    const usedSize = await scene.getUsedSize();

    if (totalSize === undefined) return;

    if (totalSize - usedSize >= availableSize) {
        const requiredSize = Math.max(0, totalSize - usedSize);
        alert(
            `Synchronizing this scene will require ${requiredSize}, which is more than the ${availableSize} estimated available storage space. This process will likely fail.`
        );
    }

    const sceneData = await dataApi.loadScene(sceneId);
    if ("error" in sceneData) {
        scene.logger?.status("error");
        return;
    }

    const persisted = await navigator.storage.persisted();
    if (!persisted) {
        await navigator.storage.persist();
    }

    const meta = storage.get(parentSceneId);
    const viewerScene = {
        id: sceneId,
        name: sceneData.title,
        lastSynced: new Date().toISOString(),
    };

    const toStore = {
        id: parentSceneId,
        name: parentSceneId,
        lastSynced: meta?.lastSynced ?? "",
        viewerScenes: meta
            ? meta.viewerScenes.find((vs) => vs.id === sceneId)
                ? meta.viewerScenes.map((vs) => (vs.id === sceneId ? viewerScene : vs))
                : meta.viewerScenes.concat(viewerScene)
            : [viewerScene],
    };
    storage.set(toStore);

    // implement a proper `AbortController` in your production code
    const abortController = new AbortController();
    scene.logger = createLogger(parentSceneId, offlineWorkerState);
    scene.sync(getSceneIndexUrl(view), abortController.signal);
}

/**
 * Deletes the offline scene from the storage.
 */
async function deleteOfflineScene() {
    const id = parentSceneId;
    await offlineWorkerState.scenes.get(id)?.delete();
    storage.remove(id);

    updateSceneInfo({
        progress: "N/A",
        scanProgress: "N/A",
        scene: "N/A",
        size: 0,
        status: "N/A",
        lastSync: "N/A",
    });
}
