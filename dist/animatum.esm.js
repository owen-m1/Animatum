function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var defaults = {
  duration: 150,
  easing: '',
  ignore: function ignore() {
    return false;
  }
};

var Animatum =
/*#__PURE__*/
function () {
  function Animatum(containers, options) {
    _classCallCheck(this, Animatum);

    if (containers instanceof NodeList || containers instanceof Array) {
      this.containers = [].slice.call(containers);
    } else if (containers instanceof HTMLElement) {
      this.containers = [containers];
    } else {
      throw new Error('Animatum must be given an `HTMLElement` or `HTMLElement[]` as the first argument');
    }

    this.options = Object.assign({}, defaults, options);
    this.animationStates = [];
  }

  _createClass(Animatum, [{
    key: "captureState",
    value: function captureState(element, options) {
      options = Object.assign({}, this.options, options);
      var rect = getRect(element);

      if (!isWithinViewport(element, rect)) {
        return;
      }

      this.animationStates.push({
        element: element,
        rect: rect
      });
      var fromRect = getRect(element); // If animating: compensate for current animation

      if (element.thisAnimationDuration) {
        var childMatrix = matrix(element);

        if (childMatrix) {
          fromRect.top -= childMatrix.f;
          fromRect.left -= childMatrix.e;
        }
      }

      element.fromRect = fromRect;
    }
  }, {
    key: "captureAllStates",
    value: function captureAllStates(options) {
      options = Object.assign({}, this.options, options); // make sure does not modify obj passed by reference

      this.animationStates = [];
      if (!options.duration) return;
      var children = [];
      this.containers.forEach(function (container) {
        children.push.apply(children, _toConsumableArray([].slice.call(container.children)));
      });

      for (var i in children) {
        if (children[i].style.display === 'none' || typeof options.ignore === 'function' && options.ignore(children[i])) continue;
        this.captureState(children[i]);
      }
    }
  }, {
    key: "addState",
    value: function addState(state) {
      this.animationStates.push(state);
    }
  }, {
    key: "removeState",
    value: function removeState(element) {
      var index = -1;
      this.animationStates.forEach(function (state, i) {
        if (state.element === element) index = i;
      });

      if (~index) {
        this.animationStates.splice(index, 1);
      }
    }
  }, {
    key: "animateAll",
    value: function animateAll(callback, options) {
      var _this = this;

      options = Object.assign({}, this.options, options);

      if (!options.duration) {
        window.clearTimeout(this.animationCallbackId);
        if (typeof callback === 'function') callback();
        return;
      }

      var animating = false,
          animationTime = 0,
          fullDuration = options.duration;
      this.animationStates.forEach(function (animationState) {
        var time = 0,
            element = animationState.element,
            fromRect = element.fromRect,
            toRect = getRect(element),
            prevFromRect = element.prevFromRect,
            prevToRect = element.prevToRect,
            animatingRect = animationState.rect,
            targetMatrix = matrix(element);

        if (targetMatrix) {
          // Compensate for current animation
          toRect.top -= targetMatrix.f;
          toRect.left -= targetMatrix.e;
        }

        element.toRect = toRect; // If element is scrolled out of view: Do not animate

        if (!isWithinViewport(element, fromRect) || !isWithinViewport(element, animatingRect) || !isWithinViewport(element, toRect)) return;

        if (element.thisAnimationDuration) {
          // Could also check if animatingRect is between fromRect and toRect
          if (isRectEqual(prevFromRect, toRect) && !isRectEqual(fromRect, toRect) && // Make sure animatingRect is on line between toRect & fromRect
          (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left) === (fromRect.top - toRect.top) / (fromRect.left - toRect.left)) {
            // If returning to same place as started from animation and on same axis
            time = calculateRealTime(animatingRect, prevFromRect, prevToRect, fullDuration);
          }
        } // if fromRect != toRect: animate


        if (!isRectEqual(toRect, fromRect)) {
          element.prevFromRect = fromRect;
          element.prevToRect = toRect;

          if (!time) {
            time = fullDuration;
          }

          _this.animate(element, animatingRect, time, options.easing);
        }

        if (time) {
          animating = true;
          animationTime = Math.max(animationTime, time);
          window.clearTimeout(element.animationResetTimer);
          element.animationResetTimer = window.setTimeout(function () {
            animationState.element.animationTime = 0;
            animationState.element.prevFromRect = undefined;
            animationState.element.fromRect = undefined;
            animationState.element.prevToRect = undefined;
            animationState.element.thisAnimationDuration = undefined;
          }, time);
          element.thisAnimationDuration = time;
        }
      });
      window.clearTimeout(this.animationCallbackId);

      if (!animating) {
        if (typeof callback === 'function') callback();
      } else {
        this.animationCallbackId = window.setTimeout(function () {
          if (typeof callback === 'function') callback();
        }, animationTime);
      }

      this.animationStates = [];
    }
  }, {
    key: "animate",
    value: function animate(element, prev, duration, easing) {
      if (duration) {
        element.style.transition = '';
        element.style.transform = '';
        var currentRect = getRect(element),
            elMatrix = matrix(element.parentElement),
            scaleX = elMatrix && elMatrix.a,
            scaleY = elMatrix && elMatrix.d,
            translateX = (prev.left - currentRect.left) / (scaleX || 1),
            translateY = (prev.top - currentRect.top) / (scaleY || 1);
        element.animatingX = !!translateX;
        element.animatingY = !!translateY;
        element.style.transform = 'translate3d(' + translateX + 'px,' + translateY + 'px,0)';
        repaint(element); // repaint

        element.style.transition = 'transform ' + duration + 'ms' + (easing ? ' ' + easing : '');
        element.style.transform = 'translate3d(0,0,0)';
        typeof element.animated === 'number' && window.clearTimeout(element.animated);
        element.animated = window.setTimeout(function () {
          element.style.transition = '';
          element.style.transform = '';
          element.animated = false;
          element.animatingX = false;
          element.animatingY = false;
        }, duration);
      }
    }
  }]);

  return Animatum;
}();

function repaint(element) {
  return element.offsetWidth;
}

function calculateRealTime(animatingRect, fromRect, toRect, duration) {
  return Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2)) * duration;
}

function isRectEqual(rect1, rect2) {
  return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
}

function matrix(element) {
  //@ts-ignore
  var matrixFn = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix;
  return matrixFn && new matrixFn(element.style.transform);
}

function isWithinViewport(el, elRect) {
  var parent = el.parentElement;
  /* jshint boss:true */

  while (parent) {
    var parentRect = getRect(parent);

    if (parentRect.left > elRect.right || parentRect.right < elRect.left || parentRect.top > elRect.bottom || parentRect.bottom < elRect.top) {
      return false;
    }

    parent = parent.parentElement;
  }

  return true;
}

function getRect(element) {
  var rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height
  };
}

export default Animatum;
