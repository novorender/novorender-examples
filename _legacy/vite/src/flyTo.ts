import {
  BoundingSphere,
  HierarcicalObjectReference,
  Scene,
  View,
} from "@novorender/webgl-api";
import { vec3 } from "gl-matrix";

export function initFlyTo(
  view: View,
  scene: Scene
): (objects: number | HierarcicalObjectReference[]) => Promise<void> {
  let active = true;
  const flyToButton = document.getElementById("fly_to_button")!;

  // Toggle UI
  flyToButton.addEventListener("click", async () => {
    active = !active;
    active
      ? flyToButton.classList.add("active")
      : flyToButton.classList.remove("active");
  });

  return async (objects) => {
    if (!active) {
      return;
    }

    // If single object ID ( in this case from pick ), load additional required metadata first
    if (typeof objects === "number") {
      const objectData = await scene.getObjectReference(objects).loadMetaData();
      const bounds = objectData.bounds?.sphere;

      if (bounds) {
        view.camera.controller.zoomTo(bounds);
      }
    } else {
      const bounds = getTotalBoundingSphere(objects);

      if (bounds) {
        view.camera.controller.zoomTo(bounds);
      }
    }
  };
}

function getTotalBoundingSphere(
  nodes: HierarcicalObjectReference[]
): BoundingSphere | undefined {
  const spheres: BoundingSphere[] = [];
  for (const node of nodes) {
    const sphere = node.bounds?.sphere;

    if (sphere) {
      spheres.push(sphere);
    }
  }

  if (spheres.length < 1) {
    return;
  }

  const center = vec3.clone(spheres[0].center);
  let radius = spheres[0].radius;

  for (let sphere of spheres) {
    const delta = vec3.sub(vec3.create(), sphere.center, center);
    const dist = vec3.len(delta) + sphere.radius;

    if (dist > radius) {
      radius = (radius + dist) * 0.5;
      vec3.add(center, center, vec3.scale(delta, delta, 1 - radius / dist));
    }
  }

  return { center, radius };
}
