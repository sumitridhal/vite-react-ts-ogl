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
import { lerp } from "../../utils/math";
import { animate, AnimationParams } from "../../utils";

type Time = { time: number; progress: number; ease: number };
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
  private mode: "contain" | "flip" | "fit" | "close" = "contain";

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
        uImagePosition: { value: [100, 100] },
        uViewportSizes: { value: [100, 66.67] },
        uStrength: { value: 0 },
      },
      transparent: true,
      cullFace: null,
    });

    this.animate = this.animate.bind(this);
    this.start = this.start.bind(this);
    this.transform = this.transform.bind(this);
    this.update = this.update.bind(this);

    // this.listerners();
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
    if (col === 1) {
      centerY += 1.2;
    }

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

  public update() {}

  public start(viewport: Dims) {
    if (viewport) this.viewport = viewport;
    this.transform();
    this.position();
  }

  public trasform(mode: string) {
    this.mode = mode as typeof this.mode;
    const start = {
      y: this.plane.scale.y,
      x: this.plane.scale.x,
      position: this.plane.position.y,
    };

    const map: Record<string, AnimationParams> = {
      up: {
        duration: 3000,
        ease: [0.1, 0.7, 0.2, 1],
        update: (t) => {
          this.plane.position.y = lerp(
            this.plane.position.y,
            this.plane.position.y + 0.02,
            t.ease
          );
        },
      },
      down: {
        duration: 3000,
        ease: [0.1, 0.7, 0.2, 1],
        update: (t) => {
          this.plane.position.y = lerp(
            this.plane.position.y,
            this.plane.position.y - 0.02,
            t.ease
          );
        },
      },
      open: {
        duration: 1500,
        ease: [1, 0.2, 0.7, 0.1],
        update: (t: Time) => {
          const y = 2 / 0.65;
          this.plane.scale.y = lerp(0, y, t.ease);
          this.program.uniforms.uPlaneSizes.value[1] = lerp(0, y, t.ease);
          // this.plane.position.y = lerp(start.position, start.y / 2, t.ease);
        },
      },
      close: {
        duration: 1500,
        ease: [0.1, 0.7, 0.2, 1],
        update: (t: Time) => {
          this.plane.scale.y = lerp(start.y, 0, t.ease);
          this.program.uniforms.uPlaneSizes.value[1] = lerp(start.y, 0, t.ease);
          // this.plane.position.y = lerp(start.position, start.y / 2, t.ease);
        },
      },
      fit: {
        duration: 1500,
        ease: [0.75, 0.3, 0.2, 1],
        update: (t: Time) => {
          this.plane.scale.x = lerp(start.x, start.x * 2, t.ease);
        },
      },
      contain: {
        duration: 1500,
        ease: [0.75, 0.3, 0.2, 1],
        update: (t: Time) => {
          this.plane.scale.x = lerp(start.x, start.x * 2, t.ease);
          this.program.uniforms.uPlaneSizes.value = [
            this.plane.scale.x,
            this.plane.scale.y,
          ];
        },
      },
    };
    animate.to({
      ...map[this.mode],
    });
  }

  // public listerners() {
  //   window.addEventListener("click", this.close);
  // }
}
