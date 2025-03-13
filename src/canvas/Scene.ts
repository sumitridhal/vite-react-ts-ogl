import { Camera, OGLRenderingContext, Renderer, Transform } from "ogl";

import type { Media } from "../objects";
import { lerp } from "../utils/math";

type Scroll = { ease: number; current: number; target: number; last: number };
class Scene {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  public gl: OGLRenderingContext;
  private camera: Camera;
  private scene: Transform;
  private meshs: Media[] = [];

  speed: number = 0;
  viewport!: { height: number; width: number };
  screen!: { height: number; width: number };
  container!: { height: number; width: number };
  bounds!: DOMRect;
  scroll!: Scroll;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0.1, 0.1, 0.1, 1);

    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 5;

    this.scene = new Transform();

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    this.resize();
    this.listerners();
  }

  private setSizes() {
    this.speed = 2;
    this.screen = {
      height: window.innerHeight,
      width: window.innerWidth,
    };

    this.scroll = {
      ease: 0.01,
      current: 0,
      target: 0,
      last: 0,
    };

    this.bounds = this.canvas.getBoundingClientRect();
  }

  private updateViewport() {
    // Update the camera's aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix(); // Apply the updated aspect ratio

    // Recalculate the viewport dimensions
    const vFOV = this.camera.fov * (Math.PI / 180); // Vertical FOV in radians
    const height = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.container = {
      height: (height * this.bounds.height) / this.screen.height,
      width: (width * this.bounds.width) / this.screen.width,
    };
    // Update viewport dimensions
    this.viewport = { height, width };
  }

  public resize() {
    this.setSizes();
    this.updateViewport();
    this.meshs.forEach((x) => x.update(this.viewport));
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height,
    });
  }

  public animate() {
    this.scroll.target += this.speed;

    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease
    );
    this.meshs.forEach((x) => x.animate(this.scroll));
    this.scroll.last = performance.now();

    this.renderer.render({ scene: this.scene, camera: this.camera });
    window.requestAnimationFrame(this.animate);
  }

  public add(media: Media) {
    if (media) {
      this.meshs.push(media);
      this.meshs.forEach((x) => x.plane.setParent(this.scene));
    }
  }

  public listerners() {
    window.addEventListener("resize", this.resize);
  }

  public destroy() {
    window.removeEventListener("resize", this.resize);
  }
}

export default Scene;
