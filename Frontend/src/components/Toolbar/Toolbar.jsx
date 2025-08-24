// import React, { useState } from "react";

// function Toolbar() {
//   const [strokeColor, setStrokeColor] = useState("#000000");
//   const [backgroundColor, setBackgroundColor] = useState("#ffffff");
//   const [strokeWidth, setStrokeWidth] = useState(2);
//   const [strokeStyle, setStrokeStyle] = useState("solid");
//   const [sloppiness, setSloppiness] = useState("none");
//   const [edges, setEdges] = useState("sharp");
//   const [opacity, setOpacity] = useState(100);

//   // These arrays define available options
//   const strokeColors = ["#000", "#f00", "#0f0", "#00f", "#ff0", "#ffa500", "#000"];
//   const backgroundColors = ["#fff", "#fbb", "#bffcbd", "#ddeeff", "#fff4b2", "#ffebc2", "transparent"];
//   const strokeWidths = [1, 2, 4];
//   const strokeStyles = ["solid", "dashed", "dotted"];
//   const sloppinessOptions = ["none", "sloppy", "high"];
//   const edgesOptions = ["sharp", "rounded"];

//   return (
//     <div className="toolbar">
//       <section>
//         <div>Stroke</div>
//         {strokeColors.map(color => (
//           <button
//             key={color}
//             style={{ background: color, border: color === strokeColor ? "2px solid blue" : "1px solid #ccc" }}
//             onClick={() => setStrokeColor(color)}
//           ></button>
//         ))}
//       </section>

//       <section>
//         <div>Background</div>
//         {backgroundColors.map(color => (
//           <button
//             key={color}
//             style={{ background: color, border: color === backgroundColor ? "2px solid blue" : "1px solid #ccc" }}
//             onClick={() => setBackgroundColor(color)}
//           ></button>
//         ))}
//       </section>

//       <section>
//         <div>Stroke Width</div>
//         {strokeWidths.map(width => (
//           <button
//             key={width}
//             style={{ fontWeight: strokeWidth === width ? "bold" : "normal" }}
//             onClick={() => setStrokeWidth(width)}
//           >
//             {width}
//           </button>
//         ))}
//       </section>

//       <section>
//         <div>Stroke Style</div>
//         {strokeStyles.map(style => (
//           <button
//             key={style}
//             style={{ fontWeight: strokeStyle === style ? "bold" : "normal" }}
//             onClick={() => setStrokeStyle(style)}
//           >
//             {style}
//           </button>
//         ))}
//       </section>

//       <section>
//         <div>Sloppiness</div>
//         {sloppinessOptions.map(option => (
//           <button
//             key={option}
//             style={{ fontWeight: sloppiness === option ? "bold" : "normal" }}
//             onClick={() => setSloppiness(option)}
//           >
//             {option}
//           </button>
//         ))}
//       </section>

//       <section>
//         <div>Edges</div>
//         {edgesOptions.map(option => (
//           <button
//             key={option}
//             style={{ fontWeight: edges === option ? "bold" : "normal" }}
//             onClick={() => setEdges(option)}
//           >
//             {option}
//           </button>
//         ))}
//       </section>

//       <section>
//         <div>Opacity</div>
//         <input
//           type="range"
//           min={0}
//           max={100}
//           value={opacity}
//           onChange={e => setOpacity(Number(e.target.value))}
//         />
//       </section>

//       <section>
//         <div>Layers</div>
//         <button>↓</button>
//         <button>↑</button>
//         <button>⇧</button>
//         <button>⇩</button>
//       </section>
//     </div>
//   );
// }

// export default Toolbar;
import React from 'react'
import './Toolbar.css'

function Toolbar() {
  return (
    <div>Toolbar</div>
  )
}

export default Toolbar;