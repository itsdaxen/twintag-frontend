"use client";

import { useEffect, useRef, useState } from "react";
import { PointColorType, PointShape, PointSizeType, Potree } from "potree-core";
import {
  Box3,
  Color,
  MOUSE,
  PerspectiveCamera,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CLOUD_URL = "metadata.json";
const CLOUD_BASE_URL = "/pointcloud/veo-reference/";

type PreviewManifest = {
  minimum: { x: number; y: number; z: number };
  maximum: { x: number; y: number; z: number };
};

type ViewAxis = "x" | "y" | "z" | "reset";
type MoveDirection = "up" | "down" | "left" | "right" | "in" | "out";

type CameraView = {
  setAxis: (axis: ViewAxis) => void;
  move: (direction: MoveDirection) => void;
};

const REFERENCE_VIEW = {
  position: new Vector3(-3.303769, -4.119055, 1.447793),
  direction: new Vector3(-0.999485, 0.028677, 0.014428),
};

export function PointCloudViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraViewRef = useRef<CameraView | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let pointCloud: Awaited<ReturnType<Potree["loadPointCloud"]>> | null = null;

    const scene = new Scene();
    scene.background = new Color(0x050914);

    const camera = new PerspectiveCamera(55, 1, 0.1, 10_000);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = false;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.mouseButtons.LEFT = MOUSE.ROTATE;
    controls.mouseButtons.MIDDLE = MOUSE.DOLLY;
    controls.mouseButtons.RIGHT = MOUSE.PAN;

    const fitView = (
      bounds: Box3,
      openingView?: { position: Vector3; target: Vector3 },
    ) => {
      const sphere = bounds.getBoundingSphere(new Sphere());
      const radius = Math.max(sphere.radius, 1);
      camera.near = Math.max(radius / 10_000, 0.01);
      camera.far = radius * 20;
      camera.up.set(0, 1, 0);
      camera.position.copy(
        openingView?.position ??
          sphere.center.clone().add(new Vector3(radius * 1.35, 0, 0)),
      );
      camera.updateProjectionMatrix();
      controls.target.copy(openingView?.target ?? sphere.center);
      controls.update();

      const resetPosition = camera.position.clone();
      const resetTarget = controls.target.clone();
      cameraViewRef.current = {
        setAxis: (axis) => {
          const distance = axis === "x" ? radius * 1.35 : radius * 2.8;
          camera.up.set(0, 1, 0);

          if (axis === "x") {
            camera.position.copy(sphere.center).add(new Vector3(distance, 0, 0));
          } else if (axis === "y") {
            camera.up.set(0, 0, 1);
            camera.position.copy(sphere.center).add(new Vector3(0, distance, 0));
          } else if (axis === "z") {
            camera.position.copy(sphere.center).add(new Vector3(0, 0, distance));
          } else {
            camera.position.copy(resetPosition);
            controls.target.copy(resetTarget);
            camera.updateProjectionMatrix();
            controls.update();
            return;
          }

          controls.target.copy(sphere.center);
          camera.updateProjectionMatrix();
          controls.update();
        },
        move: (direction) => {
          const step = radius * 0.02;
          const forward = camera.getWorldDirection(new Vector3());
          const right = forward.clone().cross(camera.up).normalize();
          const screenUp = right.clone().cross(forward).normalize();
          const movement =
            direction === "in"
              ? forward
              : direction === "out"
                ? forward.multiplyScalar(-1)
                : direction === "right"
                  ? right
                  : direction === "left"
                    ? right.multiplyScalar(-1)
                    : direction === "up"
                      ? screenUp
                      : screenUp.multiplyScalar(-1);

          movement.multiplyScalar(step);
          camera.position.add(movement);
          controls.target.add(movement);
          controls.update();
        },
      };
    };

    const potree = new Potree();
    potree.pointBudget = 2_000_000;

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const directions: Record<string, MoveDirection> = {
        w: "up",
        ArrowUp: "up",
        s: "down",
        ArrowDown: "down",
        a: "left",
        ArrowLeft: "left",
        d: "right",
        ArrowRight: "right",
        e: "in",
        q: "out",
      };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      cameraViewRef.current?.move(direction);
    };
    window.addEventListener("keydown", handleKeyDown);

    Promise.all([
      potree.loadPointCloud(CLOUD_URL, CLOUD_BASE_URL),
      fetch(`${CLOUD_BASE_URL}preview.json`).then(
        (response) => (response.ok ? response.json() : null) as Promise<PreviewManifest | null>,
      ),
    ])
      .then(([cloud, manifest]) => {
        if (disposed) {
          cloud.dispose();
          return;
        }

        pointCloud = cloud;
        cloud.material.pointColorType = PointColorType.RGB;
        cloud.material.pointSizeType = PointSizeType.FIXED;
        cloud.material.shape = PointShape.CIRCLE;
        cloud.material.size = 2;
        cloud.material.minSize = 1;
        cloud.material.maxSize = 5;
        cloud.material.inputColorEncoding = 1;
        cloud.material.outputColorEncoding = 1;
        cloud.rotation.x = -Math.PI / 2;
        if (manifest) {
          const localCenter = new Vector3(
            (manifest.minimum.x + manifest.maximum.x) / 2,
            (manifest.minimum.y + manifest.maximum.y) / 2,
            (manifest.minimum.z + manifest.maximum.z) / 2,
          ).sub(cloud.pcoGeometry.offset);
          cloud.position.copy(
            localCenter.applyEuler(cloud.rotation).multiplyScalar(-1),
          );
        } else {
          cloud.moveToOrigin();
        }
        cloud.updateMatrixWorld(true);
        scene.add(cloud);

        const viewBounds = manifest
          ? new Box3(
              new Vector3(
                manifest.minimum.x,
                manifest.minimum.y,
                manifest.minimum.z,
              ),
              new Vector3(
                manifest.maximum.x,
                manifest.maximum.y,
                manifest.maximum.z,
              ),
            )
              .translate(cloud.pcoGeometry.offset.clone().multiplyScalar(-1))
              .applyMatrix4(cloud.matrixWorld)
          : cloud.getBoundingBoxWorld();
        const sourceCenter = manifest
          ? new Vector3(
              (manifest.minimum.x + manifest.maximum.x) / 2,
              (manifest.minimum.y + manifest.maximum.y) / 2,
              (manifest.minimum.z + manifest.maximum.z) / 2,
            )
          : null;
        const openingView = sourceCenter
          ? (() => {
              const position = REFERENCE_VIEW.position
                .clone()
                .sub(sourceCenter)
                .applyEuler(cloud.rotation);
              const direction = REFERENCE_VIEW.direction
                .clone()
                .applyEuler(cloud.rotation);
              return {
                position,
                target: position.clone().add(direction.multiplyScalar(8)),
              };
            })()
          : undefined;
        fitView(viewBounds, openingView);
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    const render = () => {
      controls.update();
      if (pointCloud) {
        potree.updatePointClouds([pointCloud], camera, renderer);
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
      controls.dispose();
      cameraViewRef.current = null;
      pointCloud?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0">
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-slate-950 text-sm text-slate-300">
          {status === "loading"
            ? "Loading spatial data…"
            : "Point-cloud preview is not available."}
        </div>
      )}
      {status === "ready" && (
        <>
          <div className="absolute top-3 right-3 z-10 flex items-center rounded-lg border border-white/8 bg-slate-950/55 p-0.5 text-[11px] text-white opacity-65 shadow-sm backdrop-blur-md transition-opacity hover:opacity-100">
            <ViewButton label="X" title="Side view" onClick={() => cameraViewRef.current?.setAxis("x")} />
            <ViewButton label="Y" title="Front view" onClick={() => cameraViewRef.current?.setAxis("y")} />
            <ViewButton label="Z" title="Top view" onClick={() => cameraViewRef.current?.setAxis("z")} />
            <ViewButton label="↺" title="Reset view" onClick={() => cameraViewRef.current?.setAxis("reset")} />
          </div>
          <div className="absolute top-12 right-3 z-10 grid grid-cols-3 gap-0.5 rounded-lg border border-white/8 bg-slate-950/55 p-0.5 text-[11px] text-white opacity-65 shadow-sm backdrop-blur-md transition-opacity hover:opacity-100">
            <span />
            <ViewButton label="↑" title="Move up (W)" onClick={() => cameraViewRef.current?.move("up")} />
            <ViewButton label="E" title="Move into scene (E)" onClick={() => cameraViewRef.current?.move("in")} />
            <ViewButton label="←" title="Move left (A)" onClick={() => cameraViewRef.current?.move("left")} />
            <ViewButton label="↓" title="Move down (S)" onClick={() => cameraViewRef.current?.move("down")} />
            <ViewButton label="→" title="Move right (D)" onClick={() => cameraViewRef.current?.move("right")} />
            <span />
            <ViewButton label="Q" title="Move out of scene (Q)" onClick={() => cameraViewRef.current?.move("out")} />
          </div>
          <p className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
            Drag to orbit · scroll to zoom · right-drag to pan
          </p>
        </>
      )}
    </div>
  );
}

function ViewButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md font-medium text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-400"
    >
      {label}
    </button>
  );
}
