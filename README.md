<img src="https://user-images.githubusercontent.com/30704531/73602745-8800c300-4546-11ea-8ba8-fa5a15235ef0.png" width="355" />

A JavaScript library for animating elements between states

Based on animation code of [SortableJS](https://github.com/SortableJS/Sortable)


### Getting Staterd
Install:
```
$ npm install --save animatum
```

Import:
```js
import Animatum from 'animatum';
```

### Usage
```js
import Animatum from 'animatum';

let container = document.getElementById('container');
let animatum = new Animatum(container);

// Save the "before state"
animatum.captureAllStates();

// Reverse the order of the elements
container.append(...Array.from(container.childNodes).reverse());

// Animate from the "before state" to the new state
animatum.animateAll();
```


### API

`new Animatum(container: HTMLElement[]|HTMLElement, options: Object): Animatum`
To use Animatum you must first create an instance of Animatum on the container(s) whose children you want to animate. An optional [`options` object](#Options) object may also be passed to set the global options.

`animatum.captureAllStates(options: Object)`
**Used to capture the animation states** of *all* the children of the container(s).
This should be done immediatly before the DOM change that you want to animate takes place.
An optional [`options` object](#Options) object may be passed to overwrite the global options.

`animatum.animateAll(options: Object)`
**Used to animate from the captured animation states** of all the children in the container(s) to their new state.
This should be done after the DOM changes you want to animate have taken place.
An optional [`options` object](#Options) object may be passed to overwrite the global options.

`animatum.addState(state: AnimationState)`
Used to add a custom animation state to the captured animation states.
If there is an already a state captured for the element, this added state will overwrite it.
Refer to the [AnimationState](#AnimationState) definition.

`animatum.removeState(element: HTMLElement)`
Used to remove an animation state of the specified element from the captured animation states.


### Options

`duration {Number}`
The duration, in milliseconds, of the animation. Default: `150`


`easing {String}`
A string specifying the easing that should be applied to the animation.
See [easings.net](https://easings.net/) for examples. Default: `"ease"`


`ignore {Function|String}`
Function or CSS selector of element(s) that should be ignored during this action or all actions.
If set to a function, the first argument will be the element, and returning `true` will make the element be ignored.
Default: `function() { return false; }`


### AnimationState
An AnimationState is an object specification that Animatum uses to track the captured animation states of elements.
In order to add an animation state using the `addState` method, the object you pass in must contain the following properties.

`element {HTMLElement}`
The element that this state is for

`rect {DOMRect}`
The DOMRect (or object with DOMRect properties) of the element, that will serve as the captured position of the element.
