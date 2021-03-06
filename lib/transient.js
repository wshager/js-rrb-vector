"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.empty = undefined;
exports.Tree = Tree;
exports.push = push;
exports.get = get;
exports.set = set;
exports.concat = concat;
exports.slice = slice;
exports.toArray = toArray;
exports.fromArray = fromArray;
exports.TreeIterator = TreeIterator;

var _const = require("./const");

var _util = require("./util");

var _concat = require("./concat");

var _slice = require("./slice");

// TODO pvec interop. transients.

const EMPTY_LEAF = [];
EMPTY_LEAF.height = 0;

function Tree(size, root, tail, editable) {
	this.size = size;
	this.root = root;
	this.tail = tail;
	this.editable = editable;
}

const EMPTY = new Tree(0, null, EMPTY_LEAF, false);

const canEditNode = (edit, node) => edit === node.edit;

function push(tree, val) {
	if (tree.tail.length < _const.M) {
		// push to tail
		let newTail = (0, _util.createLeafFrom)(tree.tail, tree.editable);
		newTail.push(val);
		if (!tree.editable) return new Tree(tree.size + 1, tree.root, newTail);
		tree.size++;
		tree.tail = newTail;
		return tree;
	}
	// else push to root if space
	// else create new root
	let newTail = [val];
	newTail.height = 0;
	let newRoot = tree.root ? (0, _util.sinkTailIfSpace)(tree.tail, tree.root, tree.editable) || (0, _util.siblise)(tree.root, (0, _util.parentise)(tree.tail, tree.root.height)) : (0, _util.parentise)(tree.tail, 1);
	if (!tree.editable) return new Tree(tree.size + 1, newRoot, newTail);
	tree.size++;
	tree.root = newRoot;
	tree.tail = newTail;
	return tree;
}

// Gets the value at index i recursively.
function get(tree, i) {
	if (i < 0 || i >= tree.size) {
		return undefined;
	}
	var offset = (0, _util.tailOffset)(tree);
	if (i >= offset) {
		return tree.tail[i - offset];
	}
	return (0, _util.getRoot)(i, tree.root);
}

// Sets the value at the index i. Only the nodes leading to i will get
// copied and updated.
function set(tree, i, item) {
	var len = tree.size;
	if (i < 0 || len < i) {
		return undefined;
	}
	if (i === len) return push(tree, item);
	var offset = (0, _util.tailOffset)(tree);
	if (i >= offset) {
		var newTail = (0, _util.createLeafFrom)(tree.tail, tree.editable);
		newTail[i - offset] = item;
		if (!tree.editable) return new Tree(tree.size, tree.root, newTail);
		tree.tail = newTail;
		return tree;
	}
	var newRoot = (0, _util.setRoot)(i, item, tree.root, tree.editable);
	if (!tree.editable) return new Tree(tree.size, newRoot, tree.tail);
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
function concat(a, b) {
	var aLen = a.size;
	var bLen = b.size;
	var newLen = aLen + bLen;

	if (aLen === 0) return b;
	if (bLen === 0) return a;

	if (!a.root || !b.root) {
		if (aLen + bLen <= _const.M) {
			let newTail = a.tail.concat(b.tail);
			newTail.height = 0;
			if (!a.editable) return new Tree(newLen, null, newTail);
			a.size = newLen;
			a.root = null;
			a.tail = newTail;
			return a;
		}
		if (!a.root && !b.root) {
			// newTail will overflow, but newRoot can't be over M
			let newRoot = a.tail.concat(b.tail.slice(0, _const.M - aLen));
			newRoot.height = 0;
			let newTail = b.tail.slice(_const.M - aLen);
			newTail.height = 0;
			if (!a.editable) return new Tree(newLen, newRoot, newTail);
			a.size = newLen;
			a.root = newRoot;
			a.tail = newTail;
			return a;
		}
		// else either a has a root or b does
		if (!b.root) {
			// b has no root
			let aTailLen = a.tail.length;
			let bTailLen = b.tail.length;
			// size left over in last root node in a
			let rightCut = _const.M - aTailLen;
			// create a new tail by concatting b until cut
			let newTail = a.tail.concat(b.tail.slice(0, rightCut));
			newTail.height = 0;
			let newRoot;
			// if tail would overflow, sink it and make leftover newTail
			if (aTailLen + bTailLen > _const.M) {
				newRoot = (0, _util.sinkTailIfSpace)(newTail, a.root, a.editable);
				newTail = b.tail.slice(rightCut);
				newTail.height = 0;
			} else {
				newRoot = a.root.slice(0);
				if(a.root.height) newRoot.sizes = a.root.sizes.slice(0);
				newRoot.height = a.root.height;
			}
			if (!a.editable) return new Tree(newLen, newRoot, newTail);
			a.size = newLen;
			a.root = newRoot;
			a.tail = newTail;
			return a;
		}
		// else a has no root
		// make a.tail a.root and concat b.root
		let newRoot = (0, _concat.concatRoot)((0, _util.parentise)(a.tail, 1), b.root, a.editable);
		let newTail = (0, _util.createLeafFrom)(b.tail, a.editable);
		if (!a.editable) return new Tree(newLen, newRoot, newTail);
		a.size = newLen;
		a.root = newRoot;
		a.tail = newTail;
		return a;
	} else {
		// both a and b have roots
		// if have a.tail, just sink a.tail and make b.tail new tail...
		let aRoot = a.tail.length === 0 ? a.root : (0, _util.sinkTailIfSpace)(a.tail, a.root, a.editable) || (0, _util.siblise)(a.root, (0, _util.parentise)(a.tail, a.root.height));
		let newRoot = (0, _concat.concatRoot)(aRoot, b.root, a.editable);
		let newTail = (0, _util.createLeafFrom)(b.tail, a.editable);
		if (!a.editable) return new Tree(newLen, newRoot, newTail);
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
function slice(tree, from, to) {
	var max = tree.size;

	if (to === undefined) to = max;

	if (from >= max) {
		return EMPTY;
	}

	if (to > max) {
		to = max;
	}
	//invert negative numbers
	function confine(i) {
		return i < 0 ? i + max : i;
	}
	from = confine(from);
	to = confine(to);
	var offset = (0, _util.tailOffset)(tree);var newRoot, newTail;
	if (from >= offset) {
		newRoot = null;
		newTail = tree.tail.slice(from - offset, to - offset);
	} else if (to <= offset) {
		newRoot = (0, _slice.sliceRoot)(tree.root, from, to);
		newTail = [];
	} else {
		newRoot = (0, _slice.sliceRoot)(tree.root, from, offset);
		newTail = tree.tail.slice(0, to - offset);
	}
	newTail.height = 0;
	return new Tree(to - from, newRoot, newTail);
}

// Converts an array into a list.
function toArray(tree, f) {
	var out = [];
	if (tree.root) {
		_util.rootToArray(tree.root, f, out);
	}
	var tail = tree.tail;
	for(var i = 0, l = tail.length; i<l; i++) {
		out.push(f(tail[i]));
	}
	return out;
}

function fromArray(jsArray) {
	var len = jsArray.length;
	if (len === 0) return EMPTY;
	function _fromArray(jsArray, h, from, to) {
		var step = Math.pow(_const.M, h);
		var len = Math.ceil((to - from) / step);
		var table = new Array(len);
		var lengths = new Array(len);
		for (let i = 0; i < len; i++) {
			//todo: trampoline?
			if (h < 1) {
				break;
			}
			table[i] = _fromArray(jsArray, h - 1, from + i * step, Math.min(from + (i + 1) * step, to));
			lengths[i] = (0, _util.length)(table[i]) + (i > 0 ? lengths[i - 1] : 0);
		}
		table.height = h;
		if (h < 1) {
			for (let i = from; i < to; i++) table[i - from] = jsArray[i];
		} else {
			table.sizes = lengths;
		}
		return table;
	}
	var h = Math.floor(Math.log(len) / Math.log(_const.M));
	var root, tail;
	if (h === 0) {
		tail = (0, _util.createLeafFrom)(jsArray);
		root = null;
	} else {
		tail = [];
		tail.height = 0;
		root = _fromArray(jsArray, h, 0, len);
	}
	return new Tree(len, root, tail, false);
}

exports.empty = EMPTY;


Tree.prototype.push = function (val) {
	return push(this, val);
};

Tree.prototype.pop = function () {
	return slice(this, 0, this.size - 1);
};

Tree.prototype.get = function (i) {
	return get(this, i);
};

Tree.prototype.set = function (i, val) {
	return set(this, i, val);
};

Tree.prototype.concat = function (other) {
	return concat(this, other);
};

Tree.prototype.slice = function (from, to) {
	return slice(this, from, to);
};

Tree.prototype.beginMutation = function () {
	return new Tree(this.size, this.root, this.tail, true);
};

Tree.prototype.endMutation = function () {
	this.editable = false;
	return this;
};

Tree.prototype.count = function () {
	return this.size;
};

Tree.prototype.first = function () {
	return this.get(0);
};

Tree.prototype.next = function (idx) {
	return this.get(idx + 1);
};

Tree.prototype.toJS = function (flat) {
	return toArray(this, flat ? x => x : x => x && x.toJS ? x.toJS() : x);
};

function TreeIterator(tree) {
	this.tree = tree;
	this.i = 0;
}

const DONE = {
	done: true
};

TreeIterator.prototype.next = function () {
	if (this.i == this.tree.size) return DONE;
	var v = this.tree.get(this.i);
	this.i++;
	return { value: v };
};

TreeIterator.prototype[Symbol.iterator] = function () {
	return this;
};

Tree.prototype[Symbol.iterator] = function () {
	return new TreeIterator(this);
};
