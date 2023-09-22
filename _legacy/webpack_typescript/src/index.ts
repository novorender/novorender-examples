import * as NovoRender from "@novorender/webgl-api";

async function main(canvas) {
  // Create API
  const api = NovoRender.createAPI();

  // Create a view
  const view = await api.createView(
    { background: { color: [0, 0, 0.25, 1] } },
    canvas
  );

  // load a predefined scene into the view, available views are cube, oilrig, condos
  view.scene = await api.loadScene(NovoRender.WellKnownSceneUrls.cube);

  // provide a controller, available controller types are static, orbit, flight and turntable
  view.camera.controller = api.createCameraController({ kind: "turntable" });

  const ctx = canvas.getContext("bitmaprenderer");
  
  // render-loop https://dens.website/tutorials/webgl/render-loop
  while (true) {
    const { clientWidth: width, clientHeight: height } = canvas;
    // handle resizes
    view.applySettings({ display: { width, height } });
    const output = await view.render();

    {
      const image = await output.getImage();
      if (image) {
        // display in canvas
        ctx.transferFromImageBitmap(image);
      }
    }
    (output as any).dispose();
  }
}

main(document.getElementById("output")).then(() =>
  console.log("demo is running!")
);
