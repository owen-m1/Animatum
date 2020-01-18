import babel from 'rollup-plugin-babel';
// import banner from './banner.js';


export default {
	output: [
		{
			// banner,
			name: 'Animatum',
			format: 'umd',
			file: './dist/animatum.js'
		},
		{
			format: 'esm',
			file: './dist/animatum.esm.js'
		}
	],
	plugins: [
		babel({
			extensions: ['.js', '.ts']
		})
    ],
    input: './src/animatum.ts'
};
