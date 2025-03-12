import { OGLRenderingContext, Box, Program, Mesh } from "ogl";

export default class Cube {
  private gl: OGLRenderingContext;
  mesh: Mesh;

  constructor(gl: OGLRenderingContext) {
    this.gl = gl;
    this.mesh = this.create();
  }

  private create(): Mesh {
    const geometry = new Box(this.gl);

    const vertex = `
      attribute vec3 position;
      attribute vec3 normal;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragment = `
      precision highp float;
      varying vec3 vNormal;
      void main() {
        vec3 light = normalize(vec3(0.5, 1.0, -0.3));
        float shading = dot(vNormal, light) * 0.5 + 0.5;
        gl_FragColor = vec4(vec3(shading), 1.0);
      }
    `;

    const program = new Program(this.gl, {
      vertex,
      fragment,
      cullFace: null,
    });

    return new Mesh(this.gl, { geometry, program });
  }
}
