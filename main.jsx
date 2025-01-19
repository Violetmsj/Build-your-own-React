import { myCreateElement, myRender } from "./react";
import { useState } from "./react/myRender";
// const handleInput = (e) => {
//   console.log("handleInput");

//   renderer(e.target.value);
// };
// const renderer = (value) => {
//   const container = document.querySelector("#root");
//   const element = myCreatElement(
//     "div",
//     null,
//     myCreatElement("input", { oninput: (e) => handleInput(e) }, null),
//     myCreatElement("h1", null, value)
//   );
//   myRender(element, container);
// };

// renderer("hello");
/** @jsx myCreateElement */
const App = (props) => {
  // return myCreateElement("h1", null, "Hi", props.name);
  return <h1>Hi {props.name}</h1>;
};
/** @jsx myCreateElement */
const Counter = () => {
  const [num, setNum] = useState(1);
  return <h1 onclick={() => setNum((prev) => prev + 1)}>{num}</h1>;
};
const container = document.querySelector("#root");
// const element = myCreateElement(App, { name: "Mongo" });
const element = <Counter />;
myRender(element, container);
