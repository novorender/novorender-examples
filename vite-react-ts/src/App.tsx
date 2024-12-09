import { useEffect, useRef } from 'react'
import { View, getDeviceProfile, createSphereObject } from "@novorender/api";
import './App.css'

const { mesh } = createSphereObject();

function App() {

  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    main(canvas.current);
  }, [])

  // Create a simple sphere mesh object.

  async function main(canvas: HTMLCanvasElement | null) {
    const gpuTier = 2; // laptop with reasonably new/powerful GPU.
    // Get Device Profile
    const deviceProfile = getDeviceProfile(gpuTier);
    const baseUrl = new URL("/novorender/api/", location.origin);
    const imports = await View.downloadImports({ baseUrl }); // or wherever you copied the public/ files from the package.
    // Create a View
    const view = new View(canvas as HTMLCanvasElement, deviceProfile, imports);
    // load a predefined environment to set it as background
    const envIndexUrl = new URL("https://api.novorender.com/assets/env/index.json");
    const envs = await View.availableEnvironments(envIndexUrl);
    const { url } = envs[2]; // just pick one
    // modify the render state
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

  return (
    <>
      <canvas ref={canvas} style={{ width: '100%', height: '100%' }}></canvas>
    </>
  )
}

export default App
