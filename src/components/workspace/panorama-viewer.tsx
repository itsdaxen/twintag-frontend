"use client";

import { useEffect, useRef, useState } from "react";
import {
  CubeTexture,
  CubeTextureLoader,
  Euler,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";

const PANORAMA_BASE_URL = "/panoramas/";

type Coordinates = { x: number; y: number; z: number };
type Rotation = Coordinates & { w: number };
type PanoramaImage = {
  sweep_index: number;
  face_index: number;
  path: string;
  position: Coordinates;
  rotation: Rotation;
};
type PanoramaManifest = { images: PanoramaImage[] };
type Sweep = {
  index: number;
  position: Coordinates;
  images: PanoramaImage[];
};

export function PanoramaViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [sweeps, setSweeps] = useState<Sweep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [visible, setVisible] = useState(false);
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0);
  const fieldOfViewRef = useRef(72);
  const [entryHeading, setEntryHeading] = useState(0);
  const [entryPitch, setEntryPitch] = useState(0);
  const [isChangingScan, setIsChangingScan] = useState(false);

  useEffect(() => {
    fetch(`${PANORAMA_BASE_URL}manifest.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Panorama manifest is unavailable");
        return response.json() as Promise<PanoramaManifest>;
      })
      .then((manifest) => {
        const grouped = groupSweeps(manifest.images);
        setSweeps(grouped);
        if (grouped[0] && grouped[1]) {
          setEntryHeading(headingToward(grouped[0], grouped[1]));
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const sweep = sweeps[currentIndex];
    if (!host || !sweep) return;

    let disposed = false;
    let frame = 0;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let yaw = entryHeading;
    let cameraPitch = entryPitch;
    let panorama: CubeTexture | null = null;

    setStatus("loading");
    setHeading(entryHeading);
    setPitch(entryPitch);
    const scene = new Scene();
    const camera = new PerspectiveCamera(fieldOfViewRef.current, 1, 0.01, 100);
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

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

    const updateCamera = () => {
      camera.quaternion.setFromEuler(new Euler(cameraPitch, yaw, 0, "YXZ"));
    };
    updateCamera();
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      yaw -= (event.clientX - previousX) * 0.0035;
      cameraPitch -= (event.clientY - previousY) * 0.0035;
      cameraPitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, cameraPitch),
      );
      previousX = event.clientX;
      previousY = event.clientY;
      updateCamera();
      setHeading(yaw);
      setPitch(cameraPitch);
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grab";
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.fov = Math.max(38, Math.min(88, camera.fov + event.deltaY * 0.025));
      fieldOfViewRef.current = camera.fov;
      camera.updateProjectionMatrix();
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const faces = new Map(sweep.images.map((image) => [image.face_index, image]));
    const faceUrls = [2, 4, 0, 5, 1, 3].map((faceIndex) => {
      const image = faces.get(faceIndex);
      if (!image) throw new Error(`Sweep is missing cube face ${faceIndex}`);
      return `${PANORAMA_BASE_URL}${image.path}`;
    });
    new CubeTextureLoader()
      .loadAsync(faceUrls)
      .then((texture) => {
        if (disposed) return;
        panorama = texture;
        panorama.colorSpace = SRGBColorSpace;
        scene.background = panorama;
        setStatus("ready");
        requestAnimationFrame(() => setVisible(true));
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    const render = () => {
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      panorama?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [currentIndex, entryHeading, entryPitch, sweeps]);

  const changeScan = (index: number) => {
    const current = sweeps[currentIndex];
    const destination = sweeps[index];
    if (!current || !destination || index === currentIndex || isChangingScan) return;

    const worldDirection = panoramaViewToWorld(current, heading, pitch);
    const destinationView = worldDirectionToPanoramaView(
      destination,
      worldDirection,
    );

    setIsChangingScan(true);
    setEntryHeading(destinationView.heading);
    setEntryPitch(destinationView.pitch);
    setCurrentIndex(index);
    setIsChangingScan(false);
  };
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <div
        ref={hostRef}
        className={`absolute inset-0 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className="absolute z-20 flex items-center rounded-full border border-white/10 bg-slate-950/75 text-xs text-white shadow-lg backdrop-blur-md"
        style={{ top: 16, left: 16, gap: 12, padding: "6px 8px 6px 16px" }}
      >
        <label htmlFor="scan-selector" className="text-slate-300">
          Scan
        </label>
        <select
          id="scan-selector"
          value={currentIndex}
          disabled={isChangingScan || status !== "ready"}
          onChange={(event) => changeScan(Number(event.target.value))}
          className="cursor-pointer rounded-full bg-white/10 font-medium outline-none disabled:cursor-wait"
          style={{ padding: "6px 30px 6px 12px" }}
          aria-label="Select scan"
        >
          {sweeps.map((sweep) => (
            <option key={sweep.index} value={sweep.index} className="text-slate-950">
              {String(sweep.index + 1).padStart(2, "0")} / {sweeps.length}
            </option>
          ))}
        </select>
      </div>

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-300">
          Loading photographic view…
        </div>
      )}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-300">
          Photographic view is unavailable.
        </div>
      )}

      <p
        className="pointer-events-none absolute left-4 rounded-full border border-white/10 bg-slate-950/65 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md"
        style={{ bottom: "1rem" }}
      >
        Drag to look · scroll to zoom
      </p>
    </div>
  );
}

function groupSweeps(images: PanoramaImage[]): Sweep[] {
  const grouped = new Map<number, PanoramaImage[]>();
  for (const image of images) {
    const group = grouped.get(image.sweep_index) ?? [];
    group.push(image);
    grouped.set(image.sweep_index, group);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, sweepImages]) => ({
      index,
      position: sweepImages[0].position,
      images: sweepImages.sort((a, b) => a.face_index - b.face_index),
    }));
}

function panoramaViewToWorld(sweep: Sweep, heading: number, pitch: number) {
  const faces = new Map(sweep.images.map((image) => [image.face_index, image]));
  const localDirection = new Vector3(0, 0, -1).applyEuler(
    new Euler(pitch, heading, 0, "YXZ"),
  );
  const displayRight = imageForwardVector(faces.get(2)?.rotation);
  const displayUp = imageForwardVector(faces.get(0)?.rotation);
  const displayBack = imageForwardVector(faces.get(1)?.rotation);

  return displayRight
    .multiplyScalar(localDirection.x)
    .add(displayUp.multiplyScalar(localDirection.y))
    .add(displayBack.multiplyScalar(localDirection.z))
    .normalize();
}

function worldDirectionToPanoramaView(sweep: Sweep, direction: Vector3) {
  const faces = new Map(sweep.images.map((image) => [image.face_index, image]));
  const displayRight = imageForwardVector(faces.get(2)?.rotation);
  const displayUp = imageForwardVector(faces.get(0)?.rotation);
  const displayBack = imageForwardVector(faces.get(1)?.rotation);
  const localDirection = new Vector3(
    direction.dot(displayRight),
    direction.dot(displayUp),
    direction.dot(displayBack),
  ).normalize();

  return {
    heading: Math.atan2(-localDirection.x, -localDirection.z),
    pitch: Math.asin(Math.max(-1, Math.min(1, localDirection.y))),
  };
}

function headingToward(from: Sweep, to: Sweep) {
  const direction = new Vector3(
    to.position.x - from.position.x,
    to.position.y - from.position.y,
    to.position.z - from.position.z,
  ).normalize();
  return worldDirectionToPanoramaView(from, direction).heading;
}

function imageForwardVector(rotation?: Rotation) {
  if (!rotation) return new Vector3();
  return new Vector3(0, 0, -1).applyQuaternion(
    new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
  );
}
