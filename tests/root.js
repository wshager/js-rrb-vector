var rrb = require("../lib/index");
var util = require("../lib/util");
var slice = require("../lib/slice");
var push = require("../tests/push").pushItem;
const SIZE = 200;
const RUN = 99999;

//run();
//
var [c,x] = createArray(16);
var y = push("bla",x);
console.log(x,y);

function getRoot(i, list) {
	for (var x = list.height; x > 0; x--) {
		var slot = i >> x * 2;
		while (list.sizes[slot] <= i) {
            console.log(list[slot]);
			slot++;
		}
		if (slot > 0) {
			i -= list.sizes[slot - 1];
		}
		list = list[slot];
	}
	return list[i];
}

//test_slice_concat(23,[6,6,5,3]);

function run(){
    for(var i = 0; i < RUN; i++){
        setup();
    }
}

function setup(){
    var len = Math.ceil(Math.random() * SIZE);
    console.log("Setup "+len);
    if(test_slice_concat(len)) console.log("Slice/concat verified");
}
function createArray(size){
    var arr = [];
    for (let i = 0; i < size; i++) {
        //arr.push(getRandomInt());
        arr.push(i);
    }
    return [arr,rrb.fromArray(arr)];
}


function slice_concat(a,x,len,cut){
    var half = len/2;
    if(cut === undefined) cut = Math.floor(Math.random() * half);
    //var cut2 = Math.ceil(Math.random() * half);
    //console.log("cut",cut);
    //if(cut1 >= cut2) cut1 = cut2 - 1;
    var b1 = a.slice(0,cut);
    var b2 = a.slice(cut);
    var y1 = rrb.sliceRoot(x,0,cut);
    var y2 = rrb.sliceRoot(x,cut);
    var c = b1.concat(b2);
    var z = rrb.concatRoot(y1,y2);
    for(let i = 0; i < c.length; i++) {
        let item;
        try {
            item = util.getRoot(i,z);
        } catch(e){
        }
        if(c[i] !== item) {
            //console.log(getRoot(cut - 1, y1));
            console.log(z);
            throw new Error(`Slice/concat at index ${i}: ${item} !== ${c[i]}`);
        }
    }
    return [c,z];
}

function test_slice_concat(len,cuts) {
    var [c,z] = createArray(len);
    var cnt = 0, end = cuts ? cuts.length : RUN;
    // just repeat cnt times
    while(cnt<end) {
        //console.log("count",cnt);
        [c,z] = slice_concat(c,z,len,cuts ? cuts[cnt] : undefined);
        cnt++;
    }
    return true;
}
