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
	getSlot,
 	rootToArray } from "./util";
import { concatRoot } from "./concat";
import { sliceRoot } from "./slice";

// TODO pvec interop. transients.

const EMPTY_LEAF = [];
EMPTY_LEAF.height = 0;

export function Tree(size,root,tail,editable){
	this.size = size;
	this.root = root;
	this.tail = tail;
	this.editable = editable;
}

const EMPTY = new Tree(0, null, EMPTY_LEAF, false);

const canEditNode = (edit, node) => edit === node.edit;

export function push(tree, val) {
	if (tree.tail.length < M) { // push to tail
		let newTail = createLeafFrom(tree.tail, tree.editable);
		newTail.push(val);
		if(!tree.editable) return new Tree(tree.size + 1,tree.root,newTail);
		tree.size++;
		tree.tail = newTail;
		return tree;
	}
	// else push to root if space
	// else create new root
	let newTail = [val];
	newTail.height = 0;
	let newRoot = tree.root ? sinkTailIfSpace(tree.tail, tree.root, tree.editable) || siblise(tree.root, parentise(tree.tail,tree.root.height)) : parentise(tree.tail,1);
	if(!tree.editable) return new Tree(tree.size + 1, newRoot, newTail);
	tree.size++;
	tree.root = newRoot;
	tree.tail = newTail;
	return tree;
}

// Gets the value at index i recursively.
export function get(tree, i) {
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
export function set(tree, i, item) {
    var len = tree.size;
    if (i < 0 || len < i) {
        throw new Error("Index "+ i +" out of range!");
	}
    if(i === len) return push(tree, item);
	var offset = tailOffset(tree);
	if(i >= offset){
		var newTail = createLeafFrom(tree.tail, tree.editable);
		newTail[i - offset] = item;
		if(!tree.editable) return new Tree(tree.size,tree.root,newTail);
		tree.tail = newTail;
		return tree;
	}
    var newRoot = setRoot(i, item, tree.root, tree.editable);
	if(!tree.editable) return new Tree(tree.size,newRoot,tree.tail);
	tree.root = newRoot;
	return tree;
}

/**
 * join to lists together(concat)
 *
 * @param {Node} a
 * @param {Node} b
 * @return {Node}
 */
export function concat(a, b) {
	var aLen = a.size;
	var bLen = b.size;
	var newLen = aLen + bLen;

	if (aLen === 0) return b;
	if (bLen === 0) return a;

	if(!a.root || !b.root){
		if(aLen + bLen <= M) {
			let newTail = a.tail.concat(b.tail);
			newTail.height = 0;
			if(!a.editable) return new Tree(newLen,null,newTail);
			a.size = newLen;
			a.root = null;
			a.tail = newTail;
			return a;
		}
		if(!a.root && !b.root){
			// newTail will overflow, but newRoot can't be over M
			let newRoot = a.tail.concat(b.tail.slice(0,M - aLen));
			newRoot.height = 0;
			let newTail = b.tail.slice(M - aLen);
			newTail.height = 0;
			if(!a.editable) return new Tree(newLen,newRoot,newTail);
			a.size = newLen;
			a.root = newRoot;
			a.tail = newTail;
			return a;
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
			newTail.height = 0;
			let newRoot;
			// if tail would overflow, sink it and make leftover newTail
			if(aTailLen + bTailLen > M) {
				newRoot = sinkTailIfSpace(newTail,a.root, a.editable);
				newTail = b.tail.slice(rightCut);
				newTail.height = 0;
			} else {
				newRoot = a.root.slice(0);
				newRoot.sizes = a.root.sizes.slice(0);
				newRoot.height = a.root.height;
			}
			if(!a.editable) return new Tree(newLen, newRoot, newTail);
			a.size = newLen;
			a.root = newRoot;
			a.tail = newTail;
			return a;
		}
		// else a has no root
		// make a.tail a.root and concat b.root
		let newRoot = concatRoot(parentise(a.tail,1),b.root, a.editable);
		let newTail = createLeafFrom(b.tail, a.editable);
		if(!a.editable) return new Tree(newLen,newRoot,newTail);
		a.size = newLen;
		a.root = newRoot;
		a.tail = newTail;
		return a;
	} else {
		// both a and b have roots
		// if have a.tail, just sink a.tail and make b.tail new tail...
		let aRoot = a.tail.length === 0 ? a.root : sinkTailIfSpace(a.tail, a.root, a.editable) || siblise(a.root, parentise(a.tail,a.root.height));
		let newRoot = concatRoot(aRoot,b.root, a.editable);
		let newTail = createLeafFrom(b.tail, a.editable);
		if(!a.editable) return new Tree(newLen,newRoot,newTail);
		a.size = newLen;
		a.root = newRoot;
		a.tail = newTail;
		return a;
	}
}

/**
 * return a shallow copy of a portion of a list, with supplied "from" and "to"("to" not included)
 *
 * @param from
 * @param to
 * @param list
 */
export function slice(tree,from,to){
	var max = tree.size;

	if(to === undefined) to = max;

	if (from >= max){
		return EMPTY;
	}

	if (to > max){
		to = max;
	}
	//invert negative numbers
	function confine(i) {
		return i < 0 ? (i + max) : i;
	}
	from = confine(from);
	to = confine(to);
	var offset = tailOffset(tree);	var newRoot, newTail;
	if (from >= offset) {
		newRoot = null;
		newTail = tree.tail.slice(from - offset, to - offset);
	} else if(to <= offset) {
		newRoot = sliceRoot(tree.root, from, to);
		newTail = [];
	} else {
		newRoot = sliceRoot(tree.root, from, offset);
		newTail = tree.tail.slice(0, to - offset);
	}
	newTail.height = 0;
	return new Tree(to - from, newRoot, newTail);
}

// Converts an array into a list.
export function toArray(tree) {
	var out = [];
	if(tree.root){
		rootToArray(tree.root,out);
	}
    return out.concat(tree.tail);
}
export function fromArray(jsArray) {
	var len = jsArray.length;
	if (len === 0) return EMPTY;
	function _fromArray(jsArray, h, from, to) {
		var step = Math.pow(M, h);
		var len = Math.ceil((to - from) / step);
		var table = new Array(len);
		var lengths = new Array(len);
		for (let i = 0; i < len; i++) {
			//todo: trampoline?
			if(h < 1) {
				break;
			}
			table[i] =  _fromArray(jsArray, h - 1, from + i * step, Math.min(from + (i + 1) * step, to));
			lengths[i] = length(table[i]) + (i > 0 ? lengths[i - 1] : 0);
		}
		table.height = h;
		if(h < 1){
			for(let i = from; i < to; i++) table[i - from] = jsArray[i];
		} else {
			table.sizes = lengths;
		}
		return table;
	}
	var h = Math.floor(Math.log(len) / Math.log(M));
	var root,tail;
	if (h === 0) {
		tail = createLeafFrom(jsArray);
		root = null;
	} else {
		tail = [];
		tail.height = 0;
		root = _fromArray(jsArray, h, 0, len);
	}
	return new Tree(len, root, tail, false);
}

export { EMPTY as empty };

Tree.prototype.push = function(val){
	return push(this,val);
};

Tree.prototype.pop = function(){
	return slice(this,0,this.size - 1);
};

Tree.prototype.get = function(i){
	return get(this,i);
};

Tree.prototype.set = function(i,val){
	return set(this,i,val);
};

Tree.prototype.concat = function(other){
	return concat(this,other);
};

Tree.prototype.slice = function(from,to){
	return slice(this,from,to);
};

Tree.prototype.beginMutation = function(){
	return new Tree(this.size,this.root,this.tail,true);
};

Tree.prototype.endMutation = function(){
	this.editable = false;
	return this;
};

Tree.prototype.count = function(){
	return this.size;
};

Tree.prototype.first = function(){
	return this.get(0);
};

Tree.prototype.next = function(idx){
	return this.get(idx+1);
};

Tree.prototype.toJS = function(idx){
	return toArray(this);
};

export function TreeIterator(tree) {
    this.tree = tree;
	this.i = 0;
}

const DONE = {
    done: true
};

TreeIterator.prototype.next = function () {
	if(this.i==this.tree.size) return DONE;
    var v = this.tree.get(this.i);
	this.i++;
    return {value:v};
};

TreeIterator.prototype[Symbol.iterator] = function () {
    return this;
};

Tree.prototype[Symbol.iterator] = function () {
    return new TreeIterator(this);
};
