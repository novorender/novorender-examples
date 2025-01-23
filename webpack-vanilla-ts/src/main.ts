import {
    createSphereObject,
    getDeviceProfile,
    type RenderStateChanges,
    View,
} from "@novorender/api";

// get canvas reference
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
// Create a simple sphere mesh object.
const { mesh } = createSphereObject();

async function main(canvas: HTMLCanvasElement) {
    const gpuTier = 2; // laptop with reasonably new/powerful GPU.
    // Get Device Profile
    const deviceProfile = getDeviceProfile(gpuTier);
    const baseUrl = new URL("/novorender/api/", location.origin);
    const imports = await View.downloadImports({ baseUrl });
    // Create a View
    const view = new View(canvas, deviceProfile, imports);
    // load a predefined environment to set it as background
    const envIndexUrl = new URL(
        "https://assets.novorender.com/env/index.json",
    );
    const envs = await View.availableEnvironments(envIndexUrl);
    const { url } = envs[2]; // just pick one
    // modify the render state
    view.modifyRenderState({
        background: { url, blur: 0 }, // may take a while to download
        grid: { enabled: true },
        dynamic: {
            objects: [{
                mesh, // add a metallic sphere
                instances: [{ position: [0, 0, 0], scale: 3 }],
            }],
        },
    } as RenderStateChanges);
    // run the view
    await view.run();
    // dispose-off GPU resources
    view.dispose();
}

main(canvas);
