function myRender(element, container) {
  // TODO create dom nodes
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });
  //递归地为每个 child 做同样的事。
  element.props.children.forEach((child) => myRender(child, dom));
  container.appendChild(dom);
}

export default myRender;
