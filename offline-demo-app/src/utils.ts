import { View } from "@novorender/api";

type OfflineSceneMeta = {
    id: string;
    name: string;
    lastSynced: string;
    viewerScenes: { name: string; id: string; lastSynced: string; }[];
};

const offlineSceneStorageKey = (parentSceneId: string) => `offline_scene/${parentSceneId}`;
export const storage = {
    get: (parentSceneId: string): OfflineSceneMeta | undefined => {
        const stored = localStorage.getItem(offlineSceneStorageKey(parentSceneId));

        if (!stored) {
            return;
        }

        try {
            const scene = JSON.parse(stored) as OfflineSceneMeta;
            return scene;
        } catch (e) {
            console.warn(e);
            localStorage.removeItem(offlineSceneStorageKey(parentSceneId));
        }
    },
    set: (scene: OfflineSceneMeta): void => {
        localStorage.setItem(offlineSceneStorageKey(scene.id), JSON.stringify(scene));
    },
    remove: (parentSceneId: string): void => {
        localStorage.removeItem(offlineSceneStorageKey(parentSceneId));
    },
};


export function getSceneIndexUrl(view: View): URL {
    const url = view.renderState.scene?.url ? new URL(view.renderState.scene.url) : undefined;

    if (!url) {
        throw new Error("Unable to parse url for SAS key");
    }

    url.pathname += "index.json";

    return url;
}

// Utility function to update HTML elements
export function updateSceneInfo(info: {
    progress?: string;
    scanProgress?: string;
    scene?: string;
    size?: number;
    status?: string;
    lastSync?: string;
}): void {
    const progressInfo = document.querySelector('#progressInfo > span');
    const scanProgressInfo = document.querySelector('#scanProgressInfo > span');
    const sceneSpan = document.querySelector('#sceneInfo > span');
    const sizeSpan = document.querySelector('#sizeInfo > span');
    const statusSpan = document.querySelector('#statusInfo > span');
    const lastSyncSpan = document.querySelector('#lastSyncInfo > span');

    // Update the spans based on the provided info
    if (scanProgressInfo && info.scanProgress !== undefined) {
        scanProgressInfo.textContent = info.scanProgress;
    }
    if (progressInfo && info.progress !== undefined) {
        progressInfo.textContent = info.progress;
    }

    if (sceneSpan && info.scene !== undefined) {
        sceneSpan.textContent = info.scene;
    }

    if (sizeSpan && info.size !== undefined) {
        sizeSpan.textContent = String(info.size);
    }

    if (statusSpan && info.status !== undefined) {
        statusSpan.textContent = info.status;
    }

    if (lastSyncSpan && info.lastSync !== undefined) {
        lastSyncSpan.textContent = info.lastSync;
    }
}  
