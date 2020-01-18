export interface Options {
	easing?: string,
	duration?: number,
	ignore?: string | ((element: Element) => boolean)
}

export interface Rect {
	top: number
	bottom: number
	left: number
	right: number
	width: number
	height: number
};

export class AnimatingElement extends HTMLElement {
	animationTime?: number
	prevFromRect?: Rect
	fromRect?: Rect
	prevToRect?: Rect
	toRect?: Rect
	thisAnimationDuration?: number
	animatingX?: boolean
	animatingY?: boolean
	animated?: number | boolean
	animationResetTimer?: number
}

export interface AnimationState {
	rect: Rect,
	element: AnimatingElement
}
