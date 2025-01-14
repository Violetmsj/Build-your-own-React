import { createElement, myRender } from "./react";

const element = createElement(
  "h1",
  { id: "title" },
  "hello world",
  createElement("a", { href: "https://xxx.com" }, "yyy")
);

const container = document.getElementById("root");

// const node = document.createElement(element.type);
// node["title"] = element.props.title;

// const text = document.createTextNode("");
// text["nodeValue"] = element.props.children;

// node.appendChild(text);
// container.appendChild(node);
myRender(element, container);
