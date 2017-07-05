import resolve from 'rollup-plugin-node-resolve';
import diamond from 'rollup-plugin-diamond';

export default {
    entry: 'tests/index.js',
    format: 'umd',
    plugins: [
        resolve({ jsnext: true, module: true }),
        diamond()
    ],
    // sourceMap: true,
    dest: 'tests/build/test.js'
};