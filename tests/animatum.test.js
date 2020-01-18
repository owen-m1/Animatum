import Animatum from '../dist/animatum.esm.js';

let html = `
<div id="container">
	<div>Item 1</div>
	<div>Item 2</div>
	<div>Item 3</div>
	<div>Item 4</div>
	<div>Item 5</div>
</div>

<div id="container2">
	<div>Item 1</div>
	<div>Item 2</div>
	<div>Item 3</div>
	<div>Item 4</div>
	<div>Item 5</div>
</div>
`


describe('Create Animatum instance', () => {
	document.body.innerHTML = html;
	let container = document.getElementById('container');
	let container2 = document.getElementById('container2');

	it('should throw an error if not passed an `HTMLElement` or `HTMLElement[]`', () => {
		expect(() => new Animatum()).toThrowError('Animatum must be given an `HTMLElement` or `HTMLElement[]` as the first argument');
	});

	it('should accept an HTMLElement container', () => {
		let animatum = new Animatum(container);
		expect(animatum).toBeInstanceOf(Animatum);
		expect(animatum.containers).toEqual([container]);
	});

	it('should accept an HTMLElement[] of containers', () => {
		let animatum = new Animatum([container, container2]);
		expect(animatum).toBeInstanceOf(Animatum);
		expect(animatum.containers).toEqual([container, container2]);
	});
})


describe('Animation states', () => {
	document.body.innerHTML = html;
	let container = document.getElementById('container');
	let container2 = document.getElementById('container2');

	const rect = {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		width: 0,
		height: 0
	}

	let animatum = new Animatum(container);

	it('should capture the position of the element', () => {
		animatum.captureState(container.children[0]);

		expect(animatum.animationStates[0]).toEqual({
			element: container.children[0],
			rect
		});
	});

	it('should capture the position of all the elements', () => {
		animatum.captureAllStates();

		expect(animatum.animationStates).toEqual([].slice.call());
	});

});
