precision highp float;
varying vec3 vNormal;
void main() {
    vec3 light = normalize(vec3(0.5, 1.0, -0.3));
    float shading = dot(vNormal, light) * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(shading), 1.0);
}