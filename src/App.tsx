import "./App.css";

import { useEffect, useRef } from "react";
import { Scene } from "./canvas";
import { TextureCube } from "./objects";

// const imageSources = [
//   "images/1.webp",
//   "images/2.webp",
//   "images/3.webp",
//   "images/4.webp",
// ];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  let ignore = false;
  useEffect(() => {
    if (!canvasRef.current || ignore) return;
    const scene = new Scene(canvasRef.current);

    (async () => {
      scene.start();
      // const cube = new Cube(scene.gl);
      // scene.add(cube.mesh);
      const mesh = new TextureCube(scene.gl);
      await mesh.init("images/1.webp");
      scene.add(mesh.mesh);
      scene.animate();
    })();

    return () => {
      ignore = true;
      scene.destroy();
    };
  }, []);
  return (
    <>
      <div className="center-title">
        <h1>Image Grid Display</h1>
      </div>
      <div className="grid-container">
        <canvas className="canvas" ref={canvasRef} />
      </div>
    </>
  );
}

export default App;
