import * as NovoRender from "/novorender/index.js";

main(document.getElementById("output"));

async function main(canvas) {
    const api = NovoRender.createAPI();
    const view = await api.createView(canvas, { background: { color: [0, 0, 0.25, 1] } });
    const scene = await api.loadScene(NovoRender.WellKnownSceneUrls.cube);
    view.scene = scene;
    view.camera.controller = api.createCameraController({ kind: "turntable" });
}
