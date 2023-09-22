import { View, getDeviceProfile, createSphereObject } from "@novorender/api";

// get canvas reference
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
// Create a simple sphere mesh object.
const { mesh } = createSphereObject();

async function main(canvas: HTMLCanvasElement) {
    const gpuTier = 2; // laptop with reasonably new/powerful GPU.
    // Get Device Profile
    const deviceProfile = getDeviceProfile(gpuTier);
    const imports = await View.downloadImports({ baseUrl: "public/" }); // or whereever you copied the public/ files from the package.
    // Create a View
    const view = new View(canvas, deviceProfile, imports);
    // load a predefined environment to set it as background
    const envIndexUrl = "https://api.novorender.com/assets/env/index.json";
    const envs = await view.availableEnvironments(envIndexUrl);
    const { url } = envs[2]; // just pick one
    // modify the render state
    // @ts-ignore
    view.modifyRenderState({
        background: { url, blur: 0 }, // may take a while to download
        grid: { enabled: true },
        dynamic: {
            objects: [{
                mesh, // add a metallic sphere
                instances: [{ position: [0, 0, 0], scale: 3 }]
            }]
        }
    });
    // run the view
    await view.run();
    // dispose-off GPU resources
    view.dispose();
}

main(canvas);
