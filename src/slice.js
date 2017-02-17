import { nodeCopy, parentise, siblise, isLeaf, getSlot, length } from "./util";

export function sliceRoot(list, from, to) {
	if(to === undefined) to = length(list);
	return sliceLeft(from, sliceRight(to, list));
}

function sliceLeft(from, list) {
	if (from === 0) return list;

	// Handle leaf level.
	if (isLeaf(list)) {
		var node = list.slice(from, list.length + 1);
		node.height = 0;
		return node;
	}

	// Slice the left recursively.
	var left = getSlot(from, list);
	var sliced = sliceLeft(from - (left > 0 ? list.sizes[left - 1] : 0), list[left]);

	// Maybe the a node is not even needed, as sliced contains the whole slice.
	if (left === list.length - 1) {
		// elevate!
		return sliced.height < list.height ? parentise(sliced,list.height) : sliced;
	}

	// Create new node.
	var tbl = list.slice(left, list.length + 1);
	tbl[0] = sliced;
	var sizes = new Array(list.length - left);
	var len = 0;
	for (var i = 0; i < tbl.length; i++) {
		len += length(tbl[i]);
		sizes[i] = len;
	}
	tbl.height = list.height;
	tbl.sizes = sizes;
	return tbl;
}

function sliceRight(to, list) {
	if (to === length(list)) return list;

	// Handle leaf level.
	if (isLeaf(list)) {
		let node = list.slice(0,to);
		node.height = 0;
		return node;
	}

	// Slice the right recursively.
	var right = getSlot(to, list);
	var sliced = sliceRight(to - (right > 0 ? list.sizes[right - 1] : 0), list[right]);

	// Maybe the a node is not even needed, as sliced contains the whole slice.
	if (right === 0) return sliced;

	// Create new node.
	var sizes = list.sizes.slice(0, right);
	var tbl = list.slice(0, right);
	if (sliced.length > 0) {
		tbl[right] = sliced;
		sizes[right] = length(sliced) + (right > 0 ? sizes[right - 1] : 0);
	}
	tbl.height = list.height;
	tbl.sizes = sizes;
	return tbl;
}
