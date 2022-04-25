import * as NovoRender from "/novorender/index.js";

main(document.getElementById("output"));

async function main(canvas) {
    // Create API
    const api = NovoRender.createAPI();

    // Create a view
    const view = await api.createView({ background: { color: [0, 0, 0.25, 1] } }, canvas);

    // load a predefined scene into the view, available views are cube, oilrig, condos
    view.scene = await api.loadScene(NovoRender.WellKnownSceneUrls.cube);

    // provide a controller, available controller types are static, orbit, flight and turntable
    view.camera.controller = api.createCameraController({ kind: "turntable" }, canvas);

    const ctx = canvas.getContext("bitmaprenderer");
    for (; ;) {  // render-loop https://dens.website/tutorials/webgl/render-loop

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
        output.dispose();
        
    }
}
