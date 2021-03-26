import * as NovoRender from "@novotech/novorender";

async function main(canvas) {
    const api = NovoRender.createAPI();
    console.log(api.version);
    const view = await api.createView(canvas, { background: { color: [0, 0, 0.25, 1] } });
    const scene = await api.loadScene(NovoRender.WellKnownSceneUrls.cube);
    view.scene = scene;
    view.camera.controller = api.createCameraController({ kind: "turntable" });
}
main(document.getElementById("output_canvas"));
