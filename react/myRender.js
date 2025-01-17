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
// 记录整颗Fiber树
let wipRoot = null;

// diffing中记录要删除的节点
let deletions = null;

function myRender(element, container) {
  // 初始化下一个工作单元（根节点）
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    sibling: null,
    child: null,
    parent: null,
    // alternate对旧 Fiber 的链接，这个旧 Fiber 是我们在在上一个 commit phase 向 DOM commit 的 Fiber。
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}
function reconcileChildren(wipFiber, elements) {
  //index单纯为了while循环
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    const sameType = oldFiber && element && element.type == oldFiber.type;
    let newFiber = null;
    if (sameType) {
      // 更新
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber); // 这里使用了一个数组来追踪我们想要删除的 node
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = creatDom(fiber);
  }

  // 为每一个chid创建一个新的 fiber
  const elements = fiber.props.children;
  // let index = 0;
  // 记录上一个fiber
  // let prevSibling = null;
  //下面的while是构建Fiber树，为了实现diff算法，需要重构。
  // while (index < elements.length) {
  //   const element = elements[index];

  //   const newFiber = {
  //     // 记录元素标签类型
  //     type: element.type,
  //     // 记录元素属性
  //     props: element.props,
  //     // 与父节点创建链接
  //     parent: fiber,
  //     // 此时DOM还未生成 初始化null
  //     // 下一次进入performUnitOfWork时
  //     // 通过createDOM函数生成
  //     dom: null,
  //     // 与第一个子节点关联 初始化null
  //     child: null,
  //     // 与兄弟节点创建链接 初始化null
  //     sibling: null,
  //   };
  //   if (index === 0) {
  //     fiber.child = newFiber;
  //   } else {
  //     prevSibling.sibling = newFiber;
  //   }
  //   prevSibling = newFiber;
  //   index++;
  // }

  //重构如下
  // 此函数接收两个参数：即将被处理的fiber(wipFiber)以及它的子元素(elements)
  reconcileChildren(fiber, elements);

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
// 最后一次 commit 到 DOM 的一棵 Fiber Tree 的引用进行保存
let currentRoot = null;
// commit阶段
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function updateDom(dom, prevProps, nextProps) {
  // 删除已经没有的props
  Object.keys(prevProps)
    .filter((key) => key !== "children")
    .filter((key) => !(key in nextProps))
    .forEach((name) => (dom[name] = ""));
  // 赋予新的或者改变的props
  Object.keys(nextProps)
    .filter((key) => key !== "children")
    .filter((key) => !(key in prevProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => (dom[name] = nextProps[name]));

  // 删除已经没有的或者发生变化的事件处理函数
  Object.keys(prevProps)
    .filter((key) => key.startsWith("on"))
    .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 添加新的事件处理函数
  Object.keys(nextProps)
    .filter((key) => key.startsWith("on"))
    .filter((key) => prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, prevProps[name]);
    });
}

export default myRender;
