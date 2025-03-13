import {
  Geometry,
  Mesh,
  OGLRenderingContext,
  Plane,
  Program,
  Texture,
} from "ogl";
import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

type Dims = { height: number; width: number };
type Scroll = { ease: number; current: number; target: number; last: number };

export default class {
  private index: number = 0;
  private gl: OGLRenderingContext;
  private geometry!: Geometry;
  private texture: Texture;
  private program: Program;
  public plane!: Mesh;
  image!: HTMLImageElement;
  private viewport: Dims;
  private columns = 3;
  // private rows = 3;
  private direction = -1;
  private mode: "contain" | "cover" | "fit" = "contain";

  constructor(index: number, gl: OGLRenderingContext, viewport: Dims) {
    this.index = index;
    this.viewport = viewport;
    this.gl = gl;
    this.texture = new Texture(this.gl);
    this.program = new Program(this.gl, {
      vertex,
      fragment,
      uniforms: {
        tMap: { value: this.texture },
        uPlaneSizes: { value: [100, 100] },
        uImageSizes: { value: [100, 100] },
        uViewportSizes: { value: [100, 66.67] },
        uStrength: { value: 0 },
      },
      transparent: true,
      cullFace: null,
    });

    this.animate = this.animate.bind(this);
    this.start = this.start.bind(this);
    this.click = this.click.bind(this);
    this.update = this.update.bind(this);

    this.listerners();
  }

  // Asynchronously load the image and create the mesh
  public async load(src: string): Promise<void> {
    try {
      this.geometry = new Plane(this.gl, { heightSegments: 10 });
      await this.apply(src);
      this.plane = this.create(this.geometry);
      this.plane.scale.x *= 2;
      this.plane.scale.y *= 2;

      this.start(this.viewport);
    } catch (error) {
      console.error("Error loading texture:", error);
      throw error;
    }
  }

  private async apply(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.src = src;
      this.image.onload = () => {
        this.program.uniforms.uImageSizes.value = [
          this.image.naturalWidth,
          this.image.naturalHeight,
        ];

        this.texture.image = this.image;
        resolve();
      };
      this.image.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
    });
  }

  private create(geometry: Geometry): Mesh {
    return new Mesh(this.gl, { geometry, program: this.program });
  }

  private transform() {
    if (this.plane) {
      const [w, h] = this.program.uniforms.uImageSizes.value;
      const r = w / h;

      // Get the current dimensions of the plane
      const planeWidth = this.plane.scale.x;
      const planeHeight = this.plane.scale.y;

      // Calculate the new scale to maintain the image's aspect ratio
      if (r > 1) {
        // Landscape image: scale width, adjust height
        this.plane.scale.x = planeWidth;
        this.plane.scale.y = planeWidth / r;
      } else {
        // Portrait or square image: scale height, adjust width
        this.plane.scale.y = planeHeight;
        this.plane.scale.x = planeHeight * r;
      }

      // Update the plane's uniforms to reflect the new size
      this.plane.program.uniforms.uPlaneSizes.value = [
        this.plane.scale.x,
        this.plane.scale.y,
      ];
    }
  }

  private position() {
    if (!this.plane) return;

    // Calculate the width and height of each section
    const sectionWidth = this.viewport.width / this.columns;

    // Determine the row and column based on this.index
    const row = Math.floor(this.index / this.columns);
    const col = this.index % this.columns;

    // Calculate the center of the specified section
    const centerX =
      -this.viewport.width / 2 + col * sectionWidth + sectionWidth / 2;

    let centerY = 0;

    if (row === 0) {
      // First row (indices 0, 3, 6): Half above the screen
      centerY = this.viewport.height / 2;
    } else if (row === 1) {
      // Second row (indices 1, 4, 7): Center of the screen
      centerY = 0;
    } else if (row === 2) {
      // Third row (indices 2, 5, 8): Half below the screen
      centerY = -this.viewport.height / 2;
    }

    // Alternate middle columns
    // if (col === 1) {
    //   centerY += 1.2;
    // }

    // Adjust the plane's position to the center of the specified section
    this.plane.position.set(centerX, centerY, 0);
    // this.plane.position.y = this.viewport.height / 2;
  }

  public animate(scroll: Scroll) {
    if (!this.plane) return;
    // reset to top
    if (
      this.plane.position.y <=
      this.viewport.height * (0.5 * this.direction) - this.plane.scale.y / 2
    ) {
      this.plane.position.y =
        this.viewport.height * (0.5 * -this.direction) +
        this.plane.scale.y / 2 +
        0.05;
    }

    this.plane.position.y += scroll.ease * this.direction;

    this.plane.program.uniforms.uStrength.value =
      Math.sin(scroll.last * 0.001) * 0.25;
  }

  public update() {
    const duration = 500;
    const startX = this.plane.scale.x;
    const targetX = startX * 1.6;
    const startY = this.plane.scale.y;
    const targetY = startY * 0.6;

    let startTime: number;

    const easeOutQuad = (t: number) => t * (2 - t);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const progress = Math.min(elapsed / duration, 1); // Clamp progress between 0 and 1

      this.plane.scale.x = startX + (targetX - startX) * easeOutQuad(progress);
      this.plane.scale.y = startY + (targetY - startY) * easeOutQuad(progress);

      this.program.uniforms.uPlaneSizes.value = [
        startX + (targetX - startX) * easeOutQuad(progress),
        startY + (targetY - startY) * easeOutQuad(progress),
      ];

      if (progress < 1) {
        requestAnimationFrame(animate); // Continue animation until complete
      }
    };

    requestAnimationFrame(animate);
  }

  public start(viewport: Dims) {
    if (viewport) this.viewport = viewport;
    this.transform();
    this.position();
  }

  private click(_event: MouseEvent) {
    this.mode = this.mode === "contain" ? "cover" : "contain";

    this.update();
  }

  public listerners() {
    window.addEventListener("click", this.click);
  }
}
