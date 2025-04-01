import "./App.css";

import { useEffect, useRef, useState } from "react";

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
  const [scene, setScene] = useState<Scene | null>(null);
  const [medias, setMedia] = useState<Media[]>([]);

  let ignore = false;
  useEffect(() => {
    if (!canvasRef.current || ignore) return;
    const scene = new Scene(canvasRef.current);
    setScene(scene);
    (async () => {
      images.forEach(async (x, index) => {
        const image = new Media(index, scene.gl, scene.viewport);
        await image.load(x);
        setMedia((prev) => [...prev, image]);
        scene.add(image);
      });

      scene.animate();
    })();

    return () => {
      ignore = true;
      if (!ignore) scene.destroy();
    };
  }, []);

  const onChange = (mode: string) => {
    medias.forEach((x) => x.trasform(mode));
  };

  const onStart = () => {
    if (scene) medias.forEach((x) => x.animate(scene.scroll));
    requestAnimationFrame(() => {
      onStart();
    });
  };

  return (
    <>
      <header className="link">
        <nav>
          <button className="link__item" onClick={() => onChange("up")}>
            Up
          </button>
          <button className="link__item" onClick={() => onChange("down")}>
            Down
          </button>
          <button className="link__item" onClick={() => onChange("contain")}>
            Demo 2
          </button>
          <button className="link__item" onClick={() => onChange("fit")}>
            Demo 3
          </button>
          <button className="link__item" onClick={() => onChange("close")}>
            Close
          </button>
          <button className="link__item" onClick={() => onChange("open")}>
            Open
          </button>
          <button className="link__item" onClick={onStart}>
            Scroll
          </button>
        </nav>
      </header>
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
