import "./App.css";

import { useEffect, useRef } from "react";

import { Scene } from "./canvas";
import { Media } from "./objects";

const images = [
  "images/1.webp",
  "images/2.webp",
  "images/3.webp",
  "images/4.webp",
  "images/5.webp",
  "images/6.webp",
  "images/7.webp",
  "images/8.webp",
  "images/9.webp",
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  let ignore = false;
  useEffect(() => {
    if (!canvasRef.current || ignore) return;
    const scene = new Scene(canvasRef.current);

    (async () => {
      images.forEach(async (x, index) => {
        const image = new Media(index, scene.gl, scene.viewport);
        await image.load(x);
        scene.add(image);
      });

      scene.animate();
    })();

    return () => {
      ignore = true;
      if (!ignore) scene.destroy();
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
