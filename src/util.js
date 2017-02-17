import { B,M } from "./const";

// Helper functions
export function createRoot(tail){
	let list = [tail];
	list.height = 1;
	list.sizes = [tail.length];
	return list;
}

export function nodeCopy(list){
	var height = list.height;
	if(height===0) return createLeafFrom(list);
	var sizes = list.sizes.slice(0);
	list = list.slice(0);
	list.height = height;
	list.sizes = sizes;
	return list;
}

export function createLeafFrom(list){
	list = list.slice(0);
	list.height = 0;
	return list;
}

export function tailOffset(tree){
	return tree.root ? length(tree.root) : 0;
}

export function sinkTailIfSpace(tail,list){
	// Handle resursion stop at leaf level.
    var newA, tailLen = tail.length;
	if (list.height == 1) {
      if (list.length < M) {
        newA = nodeCopy(list);
        newA.push(tail);
		newA.sizes.push(last(newA.sizes)+tail.length);
        return newA;
      } else {
        return null;
      }
    }

    // Recursively push
    var pushed = sinkTailIfSpace(tail, last(list));

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
    if (list.length < M) {
		var newSlot = parentise(tail, list.height - 1);
		newA = nodeCopy(list);
		newA.push(newSlot);
		newA.sizes.push(last(newA.sizes) + length(newSlot));
		return newA;
    } else {
		return null;
    }
}

// Calculates in which slot the item probably is, then
// find the exact slot in the sizes. Returns the index.
export function getRoot(i, list) {
  for (var x = list.height; x > 0; x--) {
      var slot = i >> (x * B);
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

export function setRoot(i, item, list){
	var len = length(list);
	list = nodeCopy(list);
	if (isLeaf(list)) {
		list[i] = item;
	} else {
		var slot = getSlot(i, list);
		if (slot > 0) {
			i -= list.sizes[slot - 1];
		}
		list[slot] = setRoot(i, item, list[slot]);
	}
	return list;
}

// Recursively creates a tree that contains the given tree.
export function parentise(tree, height) {
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
export function siblise(a, b) {
	var list = [a, b];
	list.height = a.height + 1;
	list.sizes = [length(a), length(a) + length(b)];
	return list;
}

export function last(list) {
	return list[list.length - 1];
}

export function first(a)  {
	return a[0];
}

// determine if this is a leaf vs container node
export function isLeaf(node) {
	return node.height === 0;
}

// get the # of elements in a rrb list
export function length(list) {
	return isLeaf(list) ? list.length : last(list.sizes);
}

export function getSlot(i, list) {
	var slot = i >> (B * list.height);
	while (list.sizes[slot] <= i) {
		slot++;
	}
	return slot;
}

export function rootToArray(a,out = []){
	for (var i = 0; i < a.length; i++) {
		if(a.height === 0){
			out.push(a[i]);
		} else {
			rootToArray(a[i],out);
		}
	}
	return out;
}
