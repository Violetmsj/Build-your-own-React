import { myCreatElement, myRender } from "./react";

const handleInput = (e) => {
  console.log("handleInput");

  renderer(e.target.value);
};
const renderer = (value) => {
  const container = document.querySelector("#root");
  const element = myCreatElement(
    "div",
    null,
    myCreatElement("input", { oninput: (e) => handleInput(e) }, null),
    myCreatElement("h1", null, value)
  );
  myRender(element, container);
};

renderer("hello");
