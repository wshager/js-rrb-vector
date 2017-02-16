import { B,M } from "./const";
import { createRoot,
	nodeCopy,
	createLeafFrom,
	tailOffset,
	sinkTailIfSpace,
	getRoot,
	setRoot,
	parentise,
	siblise,
	last,
	first,
	isLeaf,
	length,
	getSlot } from "./util";
import { concatRoot } from "./concat";
import { sliceRoot } from "./slice";

// TODO pvec interop. transients.

const EMPTY_LEAF = [];
EMPTY_LEAF.height = 0;

function Tree(size,root,tail){
	this.size = size;
	this.root = root;
	this.tail = tail;
}

const EMPTY = new Tree(0,null,EMPTY_LEAF);

function push(tree, val) {
	if (tree.tail.length < M) { // push to tail
		let newTail = createLeafFrom(tree.tail);
		newTail.push(val);
		return new Tree(tree.size+1,tree.root,newTail);
	}
	// else push to root if space
	// else create new root
	let newTail = [val];
	newTail.height = 0;
	let newRoot = tree.root ? sinkTailIfSpace(tree.tail, tree.root) || siblise(tree.root, parentise(tree.tail,tree.root.height)) : parentise(tree.tail,1);
	return new Tree(tree.size+1, newRoot, newTail);
}

// Gets the value at index i recursively.
function get(tree, i) {
    if (i < 0 || i >= tree.size) {
		throw new Error('Index ' + i + ' is out of range');
	}
	var offset = tailOffset(tree);
	if(i >= offset){
		return tree.tail[i - offset];
	}
    return getRoot(i, tree.root);
  }

// Sets the value at the index i. Only the nodes leading to i will get
// copied and updated.
function set(tree, i, item) {
    var len = tree.size;
    if (i < 0 || len < i) {
        throw new Error("Index "+ i +" out of range!");
	}
    if(i === len) return push(item, tree);
	var offset = tailOffset(tree);
	if(i >= offset){
		var newTail = createLeafFrom(tree.tail);
		newTail[i - offset] = item;
		return new Tree(tree.size,tree.root,newTail);
	}
    var newRoot = setRoot(i, item, tree.root);
	return new Tree(tree.size,newRoot,tree.tail);
}

/**
 * join to lists together(concat)
 *
 * @param {Node} a
 * @param {Node} b
 * @return {Node}
 */
function concat(a, b) {
	var aLen = a.size;
	var bLen = b.size;
	var newLen = aLen + bLen;

	if (aLen === 0) return b;
	if (bLen === 0) return a;

	if(!a.root || !b.root){
		if(aLen + bLen <= M) {
			let newTail = a.tail.concat(b.tail);
			newTail.height = 0;
			return new Tree(newLen,null,newTail);
		}
		if(!a.root && !b.root){
			// newTail will overflow, but newRoot can't be over M
			let newRoot = a.tail.concat(b.tail.slice(0,M - aLen));
			newRoot.height = 0;
			let newTail = b.tail.slice(M - aLen);
			newTail.height = 0;
			return new Tree(newLen,newRoot,newTail);
		}
		// else either a has a root or b does
		if(!b.root) {
			// b has no root
			let aTailLen = a.tail.length;
			let bTailLen = b.tail.length;
			// size left over in last root node in a
			let rightCut = M - aTailLen;
			// create a new tail by concatting b until cut
			let newTail = a.tail.concat(b.tail.slice(0,rightCut));
			let newRoot = a.root;
			// if tail would overflow, sink it and make leftover newTail
			if(aTailLen + bTailLen > M) {
				newRoot = sinkTailIfSpace(newTail,a.root);
				newTail = b.tail.slice(rightCut);
			}
			newTail.height = 0;
			return new Tree(newLen,newRoot,newTail);
		}
		// else a has no root
		// make a.tail a.root and concat b.root
		let newRoot = concatRoot(parentise(a.tail,1),b.root);
		let newTail = createLeafFrom(b.tail);
		return new Tree(newLen,newRoot,newTail);
	} else {
		// both a and b have roots
		// just sink a.tail and make b.tail new tail...
		let aRoot = sinkTailIfSpace(a.tail, a.root)|| siblise(a.root, parentise(a.tail,a.root.height));
		let newRoot = concatRoot(aRoot,b.root);
		let newTail = createLeafFrom(b.tail);
		return new Tree(newLen,newRoot,newTail);
	}
}

/**
 * return a shallow copy of a portion of a list, with supplied "from" and "to"("to" not included)
 *
 * @param from
 * @param to
 * @param list
 */
function slice(tree,from,to){
	var max = tree.size;

	if(to === undefined) to = max;

	if (from >= max){
		return EMPTY;
	}

	if (to >= max - 1){
		to = max;
	}
	//invert negative numbers
	function confine(i) {
		return i < 0 ? (i + max) : i;
	}
	from = confine(from);
	to = confine(to);
	var offset = tailOffset(tree);
	if(from >= offset) {
		let newTail = tree.tail.slice(from - offset,to - offset);
		newTail.height = 0;
		return new Tree(to - from, null, newTail);
	}
	let newRoot = sliceRoot(tree.root,from,offset);
	let newTail = tree.tail.slice(0,to - offset);
	newTail.height = 0;
	return new Tree(to - from, newRoot, newTail);
}

// Converts an array into a list.
function toArray(tree) {
	var out = [];
	if(tree.root){
		rootToArray(tree.root,out);
	}
    return out.concat(tree.tail);
}

var rrb = {
	empty:EMPTY,
	toArray:toArray,
	concat:concat,
	push:push,
	slice:slice,
	get:get,
	set:set,
	//map:map,
	//foldl:foldl,
	//foldr:foldr,
	length:length
};

if(typeof module==="undefined") {
	window.rrb = rrb;
} else {
	module.exports = rrb;
}
