import "../index.css";
import "./style.css";
import { createAPI, View } from "@novorender/webgl-api";
import { createAPI as createDataAPI } from "@novorender/data-js-api";

const api = createAPI({
  scriptBaseUrl: window.location.origin + "/novorender/webgl-api/",
});
const canvas = document.getElementById("3d_canvas") as HTMLCanvasElement;
const access_token = localStorage.getItem("access_token");
// Initialize the data API with the Novorender data server service
const dataApi = createDataAPI({
  serviceUrl: "https://data.novorender.com/api",
  authHeader: async () => ({
    header: "Authorization",
    value: access_token ?? "",
  }),
});

main();

async function main(): Promise<void> {
  try {
    // Load scene metadata
    const sceneData = await dataApi
      // Condos scene ID, but can be changed to any scene ID
      .loadScene("7a0a302fe9b24ddeb3c496fb36e932b0")
      .then((res) => {
        if ("error" in res) {
          throw res;
        } else {
          return res;
        }
      });

    // Destructure relevant properties into variables
    const { url, db, settings, camera: cameraParams } = sceneData;

    // Load scene
    const scene = await api.loadScene(url, db);

    // Create a view with the scene's saved settings
    const view = await api.createView(settings, canvas);

    // Set resolution scale to 1
    view.applySettings({ quality: { resolution: { value: 1 } } });

    // Create a camera controller with the saved parameters with turntable as fallback
    const camera = cameraParams ?? ({ kind: "turntable" } as any);
    view.camera.controller = api.createCameraController(camera, canvas);

    // Assign the scene to the view
    view.scene = scene;

    // Run render loop
    run(view, canvas);
  } catch (e) {
    // Handle errors however you like
    console.warn(e);

    if (
      e &&
      typeof e === "object" &&
      "error" in e &&
      typeof e.error === "string" &&
      e.error.toLowerCase() === "not authorized"
    ) {
      localStorage.removeItem("access_token");
      window.location.replace("/login/index.html");
    } else {
      console.warn(e)
    }
  }
}

async function run(view: View, canvas: HTMLCanvasElement): Promise<void> {
  // Handle canvas resizes
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
      view.applySettings({
        display: { width: canvas.width, height: canvas.height },
      });
    }
  });

  resizeObserver.observe(canvas);

  // Create a bitmap context to display render output
  const ctx = canvas.getContext("bitmaprenderer");

  // Main render loop
  while (true) {
    // Render frame
    const output = await view.render();
    {
      // Finalize output image
      const image = await output.getImage();
      if (image) {
        // Display in canvas
        ctx?.transferFromImageBitmap(image);
        image.close();
      }
    }
  }
}
