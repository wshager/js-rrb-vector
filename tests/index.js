var rrb = require("../lib/index");
const SIZE = 999;
const RUN = 999;

run();
//test_slice(25);

//console.log(createArray(8))

function createArray(size){
    var arr = [];
    var x = rrb.empty;
    for (let i = 0; i < size; i++) {
        //arr.push(getRandomInt());
        arr.push(i);
        x = rrb.push(x,arr[i]);
    }
    return [arr,x];
}

function run(){
    for(var i = 0; i < RUN; i++){
        setup();
    }
}

function setup(){
    var len = Math.floor(Math.random() * SIZE);
    console.log("Setup "+len);
    if(test_push(len)){
        console.log("Push verified");
        if(test_set(len)){
            console.log("Set verified");
            if(test_concat(len)) {
                console.log("Concat verified");
                if(test_slice(len)){
                    console.log("Slice verified");
                    if(test_slice_concat(len)) {
                        console.log("Slice+concat verified");
                    }
                }
            }
        }
    }
}

function test_push(len) {
    var [c,z] = createArray(len);
    for(let i = 0; i < c.length; i++) {
        if(c[i] !== rrb.get(z,i)) {
            throw new Error(`Push at index ${i}: ${rrb.get(z,i)} !== ${c[i]}`);
        }
    }
    return true;
}

function test_set(len){
    var [c,z] = createArray(len);
    var rand = Math.floor(Math.random() * len);
    c[rand] = "test";
    z = rrb.set(z,rand,"test");
    for(let i = 0; i < c.length; i++) {
        if(c[i] !== rrb.get(z,i)) {
            throw new Error(`Push at index ${i}: ${rrb.get(z,i)} !== ${c[i]}`);
        }
    }
    return true;
}

function test_concat(len) {
    var [a,x] = createArray(len);
    var [b,y] = createArray(len);
    var c = a.concat(b);
    var z = rrb.concat(x,y);
    for(let i = 0; i < c.length; i++) {
        if(c[i] !== rrb.get(z,i)) {
            throw new Error(`Concat at index ${i}: ${rrb.get(z,i)} !== ${c[i]}`);
        }
    }
    return true;
}

function test_slice(len) {
    var [a,x] = createArray(len);
    var half = len/2;
    var cut = Math.floor(Math.random() * half);
    var c = a.slice(0,cut);
    var z = rrb.slice(x,0,cut);
    for(let i = 0; i < c.length; i++) {
        if(c[i] !== rrb.get(z,i)) {
            throw new Error(`Slice at index ${i}: ${rrb.get(z,i)} !== ${c[i]}`);
        }
    }
    c = a.slice(cut);
    z = rrb.slice(x,cut);
    for(let i = 0; i < c.length; i++) {
        if(c[i] !== rrb.get(z,i)) {
            throw new Error(`Slice at index ${i}: ${rrb.get(z,i)} !== ${c[i]}`);
        }
    }
    return true;
}

function slice_concat(a,x,len){
    var half = len/2;
    var cut = Math.floor(Math.random() * half);
    //console.log("cut",cut);
    //var cut2 = Math.ceil(Math.random() * half);
    //if(cut1 >= cut2) cut1 = cut2 - 1;
    var b1 = a.slice(0,cut);
    var b2 = a.slice(cut);
    var y1 = rrb.slice(x,0,cut);
    var y2 = rrb.slice(x,cut);
    var c = b1.concat(b2);
    var z = rrb.concat(y1,y2);
    for(let i = 0; i < c.length; i++) {
        if(c[i] !== rrb.get(z,i)) {
            throw new Error(`Slice/concat at index ${i}: ${rrb.get(z,i)} !== ${c[i]}`);
        }
    }
    return [c,z];
}

function test_slice_concat(len) {
    var [a,x] = createArray(len);
    var [c,z] = slice_concat(a,x,len);
    // just repeat cnt times
    var cnt = len;
    while(cnt>0) [c,z] = slice_concat(c,z,len,cnt--);
    return true;
}

function getRandomInt() {
    return Math.floor(Math.random() * (1000)) + 0;
}
