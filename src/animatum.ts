import { Options, AnimationState, Rect, AnimatingElement } from './types';

const defaults = {
	duration: 150,
	easing: '',
	ignore() {
		return false;
	}
};


export default class Animatum {
	options: Options
	containers: HTMLElement[]
	animationStates: AnimationState[]
	animationCallbackId?: number
	constructor(containers: HTMLElement|HTMLElement[], options: Options) {
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

	captureState(element: AnimatingElement, options?: Options) {
		options = Object.assign({}, this.options, options);
		let rect = getRect(element);
		if (!isWithinViewport(element, rect)) {
			return;
		}
		this.animationStates.push({
			element: element,
			rect: rect
		});
		let fromRect = getRect(element);

		// If animating: compensate for current animation
		if (element.thisAnimationDuration) {
			let childMatrix = matrix(element);
			if (childMatrix) {
				fromRect.top -= childMatrix.f;
				fromRect.left -= childMatrix.e;
			}
		}

		element.fromRect = fromRect;
	}

	captureAllStates(options?: Options) {
		options = Object.assign({}, this.options, options); // make sure does not modify obj passed by reference

		this.animationStates = [];
		if (!options.duration) return;
		let children: AnimatingElement[] = [];
		this.containers.forEach((container) => {
			children.push(...(<AnimatingElement[]>[].slice.call(container.children)));
		});

		for (let i in children) {
			if (children[i].style.display === 'none' || (typeof options.ignore === 'function' && options.ignore(children[i]))) continue;
			this.captureState(children[i]);
		}
	}

	addState(state: AnimationState) {
		this.animationStates.push(state);
	}

	removeState(element: Element) {
		let index = -1;
		this.animationStates.forEach((state, i) => {
			if (state.element === element) index = i;
		});

		if (~index) {
			this.animationStates.splice(index, 1);
		}
	}

	animateAll(callback: (() => void), options?: Options) {
		options = Object.assign({}, this.options, options);
		if (!options.duration) {
			window.clearTimeout(this.animationCallbackId);
			if (typeof(callback) === 'function') callback();
			return;
		}

		let animating = false,
			animationTime = 0,
			fullDuration = <number>options.duration;

		this.animationStates.forEach((animationState) => {
			let time = 0,
				element = animationState.element,
				fromRect = <Rect>element.fromRect,
				toRect = getRect(element),
				prevFromRect = <Rect>element.prevFromRect,
				prevToRect = <Rect>element.prevToRect,
				animatingRect = animationState.rect,
				targetMatrix = matrix(element);


			if (targetMatrix) {
				// Compensate for current animation
				toRect.top -= targetMatrix.f;
				toRect.left -= targetMatrix.e;
			}

			element.toRect = toRect;

			// If element is scrolled out of view: Do not animate
			if (
				!isWithinViewport(element, fromRect) ||
				!isWithinViewport(element, animatingRect) ||
				!isWithinViewport(element, toRect)
			) return;


			if (element.thisAnimationDuration) {
				// Could also check if animatingRect is between fromRect and toRect
				if (
					isRectEqual(prevFromRect, toRect) &&
					!isRectEqual(fromRect, toRect) &&
					// Make sure animatingRect is on line between toRect & fromRect
					(animatingRect.top - toRect.top) /
					(animatingRect.left - toRect.left) ===
					(fromRect.top - toRect.top) /
					(fromRect.left - toRect.left)
				) {
					// If returning to same place as started from animation and on same axis
					time = calculateRealTime(animatingRect, prevFromRect, prevToRect, fullDuration);
				}
			}

			// if fromRect != toRect: animate
			if (!isRectEqual(toRect, fromRect)) {
				element.prevFromRect = fromRect;
				element.prevToRect = toRect;
				if (!time) {
					time = fullDuration;
				}
				this.animate(
					element,
					animatingRect,
					time,
					options.easing
				);
			}

			if (time) {
				animating = true;
				animationTime = Math.max(animationTime, time);
				window.clearTimeout(element.animationResetTimer);
				element.animationResetTimer = window.setTimeout(() => {
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
			if (typeof(callback) === 'function') callback();
		} else {
			this.animationCallbackId = window.setTimeout(function() {
				if (typeof(callback) === 'function') callback();
			}, animationTime);
		}
		this.animationStates = [];
	}

	animate(element: AnimatingElement, prev: Rect, duration: number, easing?: string) {
		if (duration) {
			element.style.transition = '';
			element.style.transform = '';
			let currentRect = getRect(element),
				elMatrix = matrix(<HTMLElement>element.parentElement),
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
			(typeof element.animated === 'number') && window.clearTimeout(element.animated);
			element.animated = window.setTimeout(function () {
				element.style.transition = '';
				element.style.transform = '';
				element.animated = false;

				element.animatingX = false;
				element.animatingY = false;
			}, duration);
		}
	}
}

function repaint(element: HTMLElement) {
	return element.offsetWidth;
}


function calculateRealTime(animatingRect: Rect, fromRect: Rect, toRect: Rect, duration: number) {
	return (
		Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) /
		Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2))
	) * duration;
}

function isRectEqual(rect1: Rect, rect2: Rect) {
	return Math.round(rect1.top) === Math.round(rect2.top) &&
		Math.round(rect1.left) === Math.round(rect2.left) &&
		Math.round(rect1.height) === Math.round(rect2.height) &&
		Math.round(rect1.width) === Math.round(rect2.width);
}

function matrix(element: HTMLElement) {
	//@ts-ignore
	const matrixFn = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix;
	return matrixFn && (new matrixFn(element.style.transform));
}


function isWithinViewport(el: HTMLElement, elRect: Rect): boolean {
	let parent = el.parentElement;

	/* jshint boss:true */
	while (parent) {
		let parentRect = getRect(parent);

		if (
			parentRect.left > elRect.right ||
			parentRect.right < elRect.left ||
			parentRect.top > elRect.bottom ||
			parentRect.bottom < elRect.top
		) {
			return false;
		}

		parent = parent.parentElement;
	}

	return true;
}


function getRect(element: Element): Rect {
	let rect = element.getBoundingClientRect();
	return {
		top: rect.top,
		bottom: rect.bottom,
		left: rect.left,
		right: rect.right,
		width: rect.width,
		height: rect.height
	}
}
