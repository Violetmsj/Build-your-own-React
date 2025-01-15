function creatDom(fiber) {
  // create dom nodes
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });
  return dom;
}

let nextUnitOfWork = null;
function myRender(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };

  function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      shouldYield = deadline.timeRemaining() < 1;
    }
    requestIdleCallback(workLoop);
  }

  requestIdleCallback(workLoop);

  function performUnitOfWork(fiber) {
    // add dom node
    if (!fiber.dom) {
      fiber.dom = creatDom(fiber);
    }
    // 如果当前节点存在父节点，将其挂载到父节点下
    if (fiber.parent) {
      fiber.parent.dom.append(fiber.dom);
    }
    // 为每一个chid创建一个新的 fiber
    const elements = fiber.props.children;
    let index = 0;
    // 记录上一个fiber
    let prevSibling = null;
    while (index < elements.length) {
      const element = elements[index];

      const newFiber = {
        // 记录元素标签类型
        type: element.type,
        // 记录元素属性
        props: element.props,
        // 与父节点创建链接
        parent: fiber,
        // 此时DOM还未生成 初始化null
        // 下一次进入performUnitOfWork时
        // 通过createDOM函数生成
        dom: null,
        // 与第一个子节点关联 初始化null
        child: null,
        // 与兄弟节点创建链接 初始化null
        sibling: null,
      };
      if (index === 0) {
        fiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
      index++;
    }
    // 选出下一个工作单元
    if (fiber.child) {
      // 如果有child直接返回child
      return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        //无child，则返回兄弟节点
        return nextFiber.sibling;
      }
      // 当此层的兄弟节点也处理完时
      // 返回其父节点 继续处理其父节点所在层的兄弟节点
      nextFiber = nextFiber.parent;
    }
  }
  // container.appendChild(dom);
}

export default myRender;
