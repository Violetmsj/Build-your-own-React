import { myCreatElement, myRender } from "./react";

const element = myCreatElement(
  "h1",
  { id: "title" },
  "hello world",
  myCreatElement("a", { href: "https://xxx.com" }, "yyy")
);

const container = document.getElementById("root");

myRender(element, container);
