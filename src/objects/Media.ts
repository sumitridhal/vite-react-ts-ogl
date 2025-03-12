import {
  Geometry,
  Mesh,
  OGLRenderingContext,
  Plane,
  Program,
  Texture,
} from "ogl";

// Shader sources (could also be imported from separate files)
const vertexShaderSource = `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShaderSource = `
    precision highp float;

    uniform vec2 uImageSizes;
    uniform vec2 uPlaneSizes;
    uniform sampler2D tMap;

    varying vec2 vUv;
    void main() {
        vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
        );

        vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );

        gl_FragColor.rgb = texture2D(tMap, uv).rgb;
        gl_FragColor.a = 1.0;
    }
`;

type Dims = { height: number; width: number };

export default class {
  private index: number = 0;
  private gl: OGLRenderingContext;
  private geometry!: Geometry;
  private texture: Texture;
  private program: Program;
  public plane!: Mesh;
  image!: HTMLImageElement;
  private viewport: Dims;

  constructor(index: number, gl: OGLRenderingContext, viewport: Dims) {
    this.index = index;
    this.viewport = viewport;
    this.gl = gl;
    this.texture = new Texture(this.gl);
    this.program = new Program(this.gl, {
      vertex: vertexShaderSource,
      fragment: fragmentShaderSource,
      uniforms: {
        tMap: { value: this.texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uViewportSizes: { value: [100, 66.67] },
        uStrength: { value: 0 },
      },
      transparent: true,
      cullFace: null,
    });

    this.animate = this.animate.bind(this);
    this.update = this.update.bind(this);
  }

  // Asynchronously load the image and create the mesh
  public async load(src: string): Promise<void> {
    try {
      this.geometry = new Plane(this.gl, { heightSegments: 10 });
      await this.apply(src);
      this.plane = this.create(this.geometry);
      this.update(this.viewport);
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

    // Divide the visible area into 3 rows and 3 columns
    const sectionWidth = this.viewport.width / 3;
    const sectionHeight = this.viewport.height / 3;

    // Determine the row and column based on this.index
    const row = Math.floor(this.index / 3);
    const col = this.index % 3;

    // Calculate the center of the specified section
    const centerX =
      -this.viewport.width / 2 + col * sectionWidth + sectionWidth / 2;
    const centerY =
      this.viewport.height / 2 - row * sectionHeight - sectionHeight / 2;

    // Adjust the plane's position to the center of the specified section
    this.plane.position.set(centerX, centerY, 0);
  }

  public animate() {
    // this.plane.position.y += 0.01;
  }

  public update(viewport: Dims) {
    if (viewport) this.viewport = viewport;
    this.transform();
    this.position();
  }
}
