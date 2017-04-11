(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.amd = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.concatRoot = concatRoot;

var _const = require("./const");

var _util = require("./util");

function concatRoot(a, b, mutate) {
	var tuple = _concat(a, b, mutate);
	var a2 = tuple[0],
	    b2 = tuple[1];
	var a2Len = a2.length;
	var b2Len = b2.length;

	if (a2Len === 0) return b2;
	if (b2Len === 0) return a2;

	// Check if both nodes can be crunched together.
	if (a2Len + b2Len <= _const.M) {
		var a2Height = a2.height;
		var a2Sizes = a2.sizes;
		var b2Height = b2.height;
		var b2Sizes = b2.sizes;
		a2 = a2.concat(b2);
		a2.height = a2Height;
		a2.sizes = a2Sizes;
		// Adjust sizes
		if (a2Height > 0) {
			var len = (0, _util.length)(a2);
			for (var i = 0, l = b2Sizes.length; i < l; i++) {
				b2Sizes[i] += len;
			}
			a2.sizes = a2Sizes.concat(b2Sizes);
		}
		return a2;
	}

	if (a2.height > 0) {
		var toRemove = calcToRemove(a, b);
		if (toRemove > _const.E) {
			let tuple = shuffle(a2, b2, toRemove);
			a2 = tuple[0];
			b2 = tuple[1];
		}
	}

	return (0, _util.siblise)(a2, b2);
}

/**
 * Returns an array of two nodes; right and left. One node _may_ be empty.
 * @param {Node} a
 * @param {Node} b
 * @return {Array<Node>}
 * @private
 */
function _concat(a, b, mutate) {
	var aHeight = a.height;
	var bHeight = b.height;

	if (aHeight === 0 && bHeight === 0) {
		return [a, b];
	}

	if (aHeight !== 1 || bHeight !== 1) {
		if (aHeight === bHeight) {
			a = (0, _util.nodeCopy)(a, mutate);
			b = (0, _util.nodeCopy)(b, mutate);
			let tuple = _concat((0, _util.last)(a), (0, _util.first)(b), mutate);
			let a0 = tuple[0];
			let b0 = tuple[1];
			insertRight(a, a0);
			insertLeft(b, b0);
		} else if (aHeight > bHeight) {
			a = (0, _util.nodeCopy)(a, mutate);
			let tuple = _concat((0, _util.last)(a), b, mutate);
			let a0 = tuple[0];
			let b0 = tuple[1];
			insertRight(a, a0);
			b = (0, _util.parentise)(b0, b0.height + 1);
		} else {
			b = (0, _util.nodeCopy)(b, mutate);
			var tuple = _concat(a, (0, _util.first)(b), mutate);
			var left = tuple[0].length === 0 ? 0 : 1;
			var right = left === 0 ? 1 : 0;
			insertLeft(b, tuple[left]);
			a = (0, _util.parentise)(tuple[right], tuple[right].height + 1);
		}
	}

	// Check if balancing is needed and return based on that.
	if (a.length === 0 || b.length === 0) {
		return [a, b];
	}

	var toRemove = calcToRemove(a, b);
	if (toRemove <= _const.E) {
		return [a, b];
	}
	return shuffle(a, b, toRemove);
}

// Helperfunctions for _concat. Replaces a child node at the side of the parent.
function insertRight(parent, node) {
	var index = parent.length - 1;
	parent[index] = node;
	parent.sizes[index] = (0, _util.length)(node) + (index > 0 ? parent.sizes[index - 1] : 0);
}

function insertLeft(parent, node) {
	var sizes = parent.sizes;

	if (node.length > 0) {
		parent[0] = node;
		sizes[0] = (0, _util.length)(node);

		var len = (0, _util.length)(parent[0]);
		for (let i = 1, l = sizes.length; l > i; i++) {
			sizes[i] = len = len += (0, _util.length)(parent[i]);
		}
	} else {
		parent.shift();
		for (let i = 1, l = sizes.length; l > i; i++) {
			sizes[i] = sizes[i] - sizes[0];
		}
		sizes.shift();
	}
}

/**
 * Returns an array of two balanced nodes.
 * @param {Node} a
 * @param {Node} b
 * @param {number} toRemove
 * @return {Array<Node>}
 */
function shuffle(a, b, toRemove) {
	var newA = allocate(a.height, Math.min(_const.M, a.length + b.length - toRemove));
	var newB = allocate(a.height, Math.max(0, newA.length - (a.length + b.length - toRemove)));

	// Skip the slots with size M. More precise: copy the slot references
	// to the new node
	var read = 0;
	let aLen = a.length;
	let either, fromA;
	let newALen = newA.length;
	while (fromA = read < aLen, either = fromA ? a[read] : b[read - aLen], either.length % _const.M === 0) {
		let fromNewA = read < newALen;
		if (fromNewA) {
			newA[read] = either;
		} else {
			newB[read - newALen] = either;
		}
		let size = fromNewA ? a.sizes[read] : b.sizes[read - newALen];
		if (!size) {
			size = newA.sizes[read - 1] + (0, _util.length)(either);
		}
		if (fromNewA) {
			newA.sizes[read] = size;
		} else {
			newB.sizes[read - newALen] = size;
		}
		read++;
	}

	// Pulling items from left to right, caching in a slot before writing
	// it into the new nodes.
	var write = read;
	var slot = allocate(a.height - 1, 0);
	var from = 0;

	// If the current slot is still containing data, then there will be at
	// least one more write, so we do not break this loop yet.
	while (read - write - (slot.length > 0 ? 1 : 0) < toRemove && read - a.length < b.length) {
		// Find out the max possible items for copying.
		var source = getEither(a, b, read);
		var to = Math.min(_const.M - slot.length, source.length);

		// Copy and adjust size table.
		var height = slot.height,
		    sizes = height === 0 ? null : slot.sizes.slice(0);
		slot = slot.concat(source.slice(from, to));
		slot.height = height;
		if (slot.height > 0) {
			slot.sizes = sizes;
			var len = sizes.length;
			for (var i = len; i < len + to - from; i++) {
				sizes[i] = (0, _util.length)(slot[i]);
				sizes[i] += i > 0 ? slot.sizes[i - 1] : 0;
			}
		}

		from += to;

		// Only proceed to next slots[i] if the current one was
		// fully copied.
		if (source.length <= to) {
			read++;
			from = 0;
		}

		// Only create a new slot if the current one is filled up.
		if (slot.length === _const.M) {
			saveSlot(newA, newB, write, slot);
			slot = allocate(a.height - 1, 0);
			write++;
		}
	}

	// Cleanup after the loop. Copy the last slot into the new nodes.
	if (slot.length > 0) {
		saveSlot(newA, newB, write, slot);
		write++;
	}

	// Shift the untouched slots to the left
	while (read < a.length + b.length) {
		saveSlot(newA, newB, write, getEither(a, b, read));
		read++;
		write++;
	}

	return [newA, newB];
}

// Creates a node or leaf with a given length at their arrays for performance.
// Is only used by shuffle.
function allocate(height, length) {
	var node = new Array(length);
	node.height = height;
	if (height > 0) {
		node.sizes = new Array(length);
	}
	return node;
}

/**
 * helper for setting picking a slot between to nodes
 * @param {Node} aList - a non-leaf node
 * @param {Node} bList - a non-leaf node
 * @param {number} index
 * @param {Node} slot
 */
function saveSlot(aList, bList, index, slot) {
	setEither(aList, bList, index, slot);

	var isInFirst = index === 0 || index === aList.sizes.length;
	var len = isInFirst ? 0 : getEither(aList.sizes, bList.sizes, index - 1);

	setEither(aList.sizes, bList.sizes, index, len + (0, _util.length)(slot));
}

// getEither, setEither and saveSlot are helpers for accessing elements over two arrays.
function getEither(a, b, i) {
	return i < a.length ? a[i] : b[i - a.length];
}

function setEither(a, b, i, value) {
	if (i < a.length) {
		a[i] = value;
	} else {
		b[i - a.length] = value;
	}
}

/**
 * Returns the extra search steps for E. Refer to the paper.
 *
 * @param {Node} a - a non leaf node
 * @param {Node} b - a non leaf node
 * @return {number}
 */
function calcToRemove(a, b) {
	var subLengths = 0;
	subLengths += a.height === 0 ? 0 : sumOfLengths(a);
	subLengths += b.height === 0 ? 0 : sumOfLengths(b);

	return a.length + b.length - (Math.floor((subLengths - 1) / _const.M) + 1);
}

function sumOfLengths(table) {
	var sum = 0;
	var len = table.length;
	for (var i = 0; len > i; i++) sum += table[i].length;
	return sum;
}
},{"./const":2,"./util":5}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const B = exports.B = 5;
const M = exports.M = 1 << B;
const E = exports.E = 2;
},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.sliceRoot = sliceRoot;

var _util = require("./util");

function sliceRoot(list, from, to) {
	if (to === undefined) to = (0, _util.length)(list);
	return sliceLeft(from, sliceRight(to, list));
}

function sliceLeft(from, list) {
	if (from === 0) return list;

	// Handle leaf level.
	if ((0, _util.isLeaf)(list)) {
		var node = list.slice(from, list.length + 1);
		node.height = 0;
		return node;
	}

	// Slice the left recursively.
	var left = (0, _util.getSlot)(from, list);
	var sliced = sliceLeft(from - (left > 0 ? list.sizes[left - 1] : 0), list[left]);

	// Maybe the a node is not even needed, as sliced contains the whole slice.
	if (left === list.length - 1) {
		// elevate!
		return sliced.height < list.height ? (0, _util.parentise)(sliced, list.height) : sliced;
	}

	// Create new node.
	var tbl = list.slice(left, list.length + 1);
	tbl[0] = sliced;
	var sizes = new Array(list.length - left);
	var len = 0;
	for (var i = 0; i < tbl.length; i++) {
		len += (0, _util.length)(tbl[i]);
		sizes[i] = len;
	}
	tbl.height = list.height;
	tbl.sizes = sizes;
	return tbl;
}

function sliceRight(to, list) {
	if (to === (0, _util.length)(list)) return list;

	// Handle leaf level.
	if ((0, _util.isLeaf)(list)) {
		let node = list.slice(0, to);
		node.height = 0;
		return node;
	}

	// Slice the right recursively.
	var right = (0, _util.getSlot)(to, list);
	var sliced = sliceRight(to - (right > 0 ? list.sizes[right - 1] : 0), list[right]);

	// Maybe the a node is not even needed, as sliced contains the whole slice.
	if (right === 0) return sliced;

	// Create new node.
	var sizes = list.sizes.slice(0, right);
	var tbl = list.slice(0, right);
	if (sliced.length > 0) {
		tbl[right] = sliced;
		sizes[right] = (0, _util.length)(sliced) + (right > 0 ? sizes[right - 1] : 0);
	}
	tbl.height = list.height;
	tbl.sizes = sizes;
	return tbl;
}
},{"./util":5}],4:[function(require,module,exports){
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
		throw new Error('Index ' + i + ' is out of range');
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
		throw new Error("Index " + i + " out of range!");
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
				newRoot.sizes = a.root.sizes.slice(0);
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
function toArray(tree) {
	var out = [];
	if (tree.root) {
		(0, _util.rootToArray)(tree.root, out);
	}
	return out.concat(tree.tail);
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

Tree.prototype.toJS = function (idx) {
	return toArray(this);
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
},{"./concat":1,"./const":2,"./slice":3,"./util":5}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.createRoot = createRoot;
exports.nodeCopy = nodeCopy;
exports.createLeafFrom = createLeafFrom;
exports.tailOffset = tailOffset;
exports.sinkTailIfSpace = sinkTailIfSpace;
exports.getRoot = getRoot;
exports.setRoot = setRoot;
exports.parentise = parentise;
exports.siblise = siblise;
exports.last = last;
exports.first = first;
exports.isLeaf = isLeaf;
exports.length = length;
exports.getSlot = getSlot;
exports.rootToArray = rootToArray;

var _const = require("./const");

// Helper functions
function createRoot(tail) {
	let list = [tail];
	list.height = 1;
	list.sizes = [tail.length];
	return list;
}

function nodeCopy(list, mutate) {
	var height = list.height;
	if (height === 0) return createLeafFrom(list);
	if (mutate) return list;
	var sizes = list.sizes.slice(0);
	list = list.slice(0);
	list.height = height;
	list.sizes = sizes;
	return list;
}

function createLeafFrom(list) {
	list = list.slice(0);
	list.height = 0;
	return list;
}

function tailOffset(tree) {
	return tree.root ? length(tree.root) : 0;
}

function sinkTailIfSpace(tail, list, mutate) {
	// Handle resursion stop at leaf level.
	var newA,
	    tailLen = tail.length;
	if (list.height == 1) {
		if (list.length < _const.M) {
			newA = nodeCopy(list, mutate);
			newA.push(tail);
			newA.sizes.push(last(newA.sizes) + tail.length);
			return newA;
		} else {
			return null;
		}
	}

	// Recursively push
	var pushed = sinkTailIfSpace(tail, last(list), mutate);

	// There was space in the bottom right tree, so the slot will
	// be updated.
	if (pushed !== null) {
		newA = nodeCopy(list);
		newA[newA.length - 1] = pushed;
		newA.sizes[newA.sizes.length - 1] += tailLen;
		return newA;
	}

	// When there was no space left, check if there is space left
	// for a new slot with a tree which contains only the item
	// at the bottom.
	if (list.length < _const.M) {
		var newSlot = parentise(tail, list.height - 1);
		newA = nodeCopy(list, mutate);
		newA.push(newSlot);
		newA.sizes.push(last(newA.sizes) + length(newSlot));
		return newA;
	} else {
		return null;
	}
}

// Calculates in which slot the item probably is, then
// find the exact slot in the sizes. Returns the index.
function getRoot(i, list) {
	for (var x = list.height; x > 0; x--) {
		var slot = i >> x * _const.B;
		while (list.sizes[slot] <= i) {
			slot++;
		}
		if (slot > 0) {
			i -= list.sizes[slot - 1];
		}
		list = list[slot];
	}
	return list[i];
}

function setRoot(i, item, list, mutate) {
	var len = length(list);
	list = nodeCopy(list, mutate);
	if (isLeaf(list)) {
		list[i] = item;
	} else {
		var slot = getSlot(i, list);
		if (slot > 0) {
			i -= list.sizes[slot - 1];
		}
		list[slot] = setRoot(i, item, list[slot], mutate);
	}
	return list;
}

// Recursively creates a tree that contains the given tree.
function parentise(tree, height) {
	if (height == tree.height) {
		return tree;
	} else {
		var list = [parentise(tree, height - 1)];
		list.height = height;
		list.sizes = [length(tree)];
		return list;
	}
}

// Emphasizes blood brotherhood beneath two trees.
function siblise(a, b) {
	var list = [a, b];
	list.height = a.height + 1;
	list.sizes = [length(a), length(a) + length(b)];
	return list;
}

function last(list) {
	return list[list.length - 1];
}

function first(a) {
	return a[0];
}

// determine if this is a leaf vs container node
function isLeaf(node) {
	return node.height === 0;
}

// get the # of elements in a rrb list
function length(list) {
	return isLeaf(list) ? list.length : last(list.sizes);
}

function getSlot(i, list) {
	var slot = i >> _const.B * list.height;
	while (list.sizes[slot] <= i) {
		slot++;
	}
	return slot;
}

function rootToArray(a, out = []) {
	for (var i = 0; i < a.length; i++) {
		if (a.height === 0) {
			out.push(a[i]);
		} else {
			rootToArray(a[i], out);
		}
	}
	return out;
}
},{"./const":2}]},{},[4])(4)
});