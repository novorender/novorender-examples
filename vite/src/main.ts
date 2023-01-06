import {
  createAPI,
  HierarcicalObjectReference,
  Scene,
  View,
} from "@novorender/webgl-api";
import { createAPI as createDataAPI } from "@novorender/data-js-api";

import { initSearch } from "./search";
import { initProperties } from "./properites";
import { initFlyTo } from "./flyTo";

import "../index.css";
import "./main.css";

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
    const view = await initView();
    const scene = view.scene!;
    run(view, canvas);

    // Show HUD and init the extra functionality
    document.querySelector(".hud")?.classList.remove("hidden");
    const displayProperties = initProperties(scene);
    const flyTo = initFlyTo(view, scene);
    const highlight = initHighlighter(view, scene);


    // Setup search with callback
    initSearch(scene, (result: HierarcicalObjectReference[]) => {
      const ids = result.map((obj) => obj.id);
      highlight(ids);
      displayProperties(ids.at(-1));
      flyTo(result);
    });

    // Setup event listener for picking in 3D
    canvas.addEventListener("click", async (event) => {
      const result = await view.lastRenderOutput?.pick(
        event.offsetX,
        event.offsetY
      );

      if (!result) {
        return;
      }

      highlight([result.objectId]);
      displayProperties(result.objectId);
      flyTo(result.objectId);
    });
  } catch (e) {
    // Handle errors however you like
    // Here we just redirect to login page if user is not autorized to acces scene
    const isNotAuthorized =
      e &&
      typeof e === "object" &&
      "error" in e &&
      typeof e.error === "string" &&
      e.error.toLowerCase() === "not authorized";

    if (isNotAuthorized) {
      localStorage.removeItem("access_token");
      window.location.replace("/login/index.html");
    } else {
      console.warn(e);
    }
  }
}

function initHighlighter(view: View, scene: Scene): (ids: number[]) => void {
  // Init highlights with green as highlight color
  view.settings.objectHighlights = [
    api.createHighlight({ kind: "neutral" }),
    api.createHighlight({ kind: "color", color: [0, 1, 0, 1] }),
  ];

  return (ids) => {
    // Reset highlight of all objects
    scene.objectHighlighter.objectHighlightIndices.fill(0);
    // Set new highlight on selected objects
    ids.forEach(
      (id) => (scene.objectHighlighter.objectHighlightIndices[id] = 1)
    );
    scene.objectHighlighter.commit();
  };
}

// Load scene and initialize the 3D view
async function initView() {
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

  return view;
}

// Run render loop
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
