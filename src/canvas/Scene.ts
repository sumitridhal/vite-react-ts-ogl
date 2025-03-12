import { Renderer, Camera, Transform, Mesh, OGLRenderingContext } from "ogl";

class Scene {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  public gl: OGLRenderingContext;
  private camera: Camera;
  private scene: Transform;
  private mesh!: Mesh;

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
    this.camera.position.z = 5;

    this.scene = new Transform();
    // this.mesh = this.createMesh();
    // this.mesh.setParent(this.scene);

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
  }

  private resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height,
    });
  }

  public animate() {
    requestAnimationFrame(this.animate);
    if (this.mesh) this.mesh.rotation.y += 0.01;
    this.renderer.render({ scene: this.scene, camera: this.camera });
  }

  public add(mesh: Mesh | undefined) {
    if (mesh) {
      this.mesh = mesh;
      this.mesh.setParent(this.scene);
    }
  }

  public start() {
    window.addEventListener("resize", this.resize, false);
    this.resize();
    // this.animate();
  }

  public destroy() {
    window.removeEventListener("resize", this.resize);
  }
}

export default Scene;
