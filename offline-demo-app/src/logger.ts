import { OfflineErrorCode, OfflineViewState } from "@novorender/api";
import { storage, updateSceneInfo } from "./utils";

export const createLogger = (parentSceneId: string, offlineWorkerState: OfflineViewState): OfflineViewState["logger"] => {
    return {
        status: (status) => {
            if (status === "synchronized") {
                const now = new Date().toISOString();
                const scene = storage.get(parentSceneId);
                if (scene) {
                    storage.set({
                        ...scene,
                        lastSynced: now,
                    });
                }
                updateSceneInfo({ scene: parentSceneId, status, lastSync: now, size: offlineWorkerState?.scenes.get(parentSceneId)?.manifest.totalByteSize ?? 0, })
            } else {
                updateSceneInfo({ scene: parentSceneId, status })
            }
        },
        error: (error) => {
            if (error.id === OfflineErrorCode.quotaExceeded) {
                alert("Not enough disk drive space on the device.");
                updateSceneInfo({ scene: parentSceneId, status: "error" })
            }
        },
        progress: (current, max, operation) => {
            if (operation === "download") {
                if (current === max) {
                    updateSceneInfo({ scene: parentSceneId, progress: "100%", size: max })
                }

                if (!max) {
                    updateSceneInfo({ scene: parentSceneId, progress: "" })
                }

                if (current !== undefined && max !== undefined) {
                    const progress = ((current / max) * 100).toFixed(2);
                    updateSceneInfo({ scene: parentSceneId, progress, size: max })
                }
            } else {
                if (current === max) {
                    updateSceneInfo({ scene: parentSceneId, scanProgress: "100%" })
                }

                if (!max) {
                    updateSceneInfo({ scene: parentSceneId, scanProgress: String(current) })
                }

                if (current !== undefined && max !== undefined) {
                    const scanProgress = ((current / max) * 100).toFixed(2);
                    updateSceneInfo({ scene: parentSceneId, scanProgress })
                }
            }
        },
    };
}