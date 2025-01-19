function createDom(fiber) {
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
let nextUnitOfWork = null;
// 记录整颗Fiber树
let wipRoot = null;

// diffing中记录要删除的节点
let deletions = null;
// 最后一次 commit 到 DOM 的一棵 Fiber Tree 的引用进行保存
let currentRoot = null;
function reconcileChildren(wipFiber, elements) {
  //index单纯为了while循环
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  while (index < elements.length || oldFiber) {
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
    // 如果存在旧Fiber节点，则将oldFiber更新为其兄弟节点（oldFiber.sibling），以便在下一次循环中处理下一个旧Fiber节点。
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
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
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 处理非函数式组件
  function updateHostComponent(fiber) {
    if (!fiber.dom) {
      fiber.dom = createDom(fiber);
    }
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);
  }
  // 处理函数式组件
  function updateFunctionComponent(fiber) {
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
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
  //递归向上寻找，直至遇到第一个祖先节点的dom
  let parentDOMFiber = fiber.parent;
  while (!parentDOMFiber.dom) {
    parentDOMFiber = parentDOMFiber.parent;
  }
  const parentDOM = parentDOMFiber.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
    parentDOM.append(fiber.dom);
  } else if (fiber.effectTag === "DELETION" && fiber.dom) {
    // parentDOM.removeChild(fiber.dom);
    commitDeletion(fiber, parentDOM);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function commitDeletion(fiber, parentDOM) {
  if (fiber.dom) {
    parentDOM.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, parentDOM);
  }
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
