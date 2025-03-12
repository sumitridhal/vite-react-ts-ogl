import { OGLRenderingContext, Program, Mesh, Texture, Geometry } from "ogl";

export default class TextureImage {
  private gl: OGLRenderingContext;
  mesh!: Mesh;
  private texture: Texture;

  constructor(gl: OGLRenderingContext) {
    this.gl = gl;
    this.texture = new Texture(this.gl);
  }

  // Asynchronously load the image and create the mesh
  public async load(imageUrl: string, g: Geometry): Promise<void> {
    await this.loadTexture(imageUrl);
    this.mesh = this.createMesh(g);
  }

  private async loadTexture(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        this.texture.image = image;
        resolve();
      };
      image.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
    });
  }

  private createMesh(geometry: Geometry): Mesh {
    // const geometry = new Plane(this.gl);

    const vertex = `
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

    const fragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec2 vUv;
      uniform sampler2D tMap;
      void main() {
        vec3 light = normalize(vec3(0.5, 1.0, -0.3));
        float shading = dot(vNormal, light) * 0.5 + 0.5;
        vec4 textureColor = texture2D(tMap, vUv);
        gl_FragColor = vec4(textureColor.rgb * shading, textureColor.a);
      }
    `;

    const program = new Program(this.gl, {
      vertex,
      fragment,
      uniforms: {
        tMap: { value: this.texture },
      },
      transparent: true,
      cullFace: null,
    });

    return new Mesh(this.gl, { geometry, program });
  }
}
