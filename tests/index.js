var rrb = require("../lib/index");
const SIZE = 99999;
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
        if(test_concat(len)) {
            console.log("Concat verified");
            if(test_slice(len)){
                console.log("Slice verified");
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
    var from = Math.floor(len/2);
    var c = a.slice(from);
    var z = rrb.slice(x,from);
    for(let i = 0; i < c.length; i++) {
        if(c[i] !== rrb.get(z,i)) {
            throw new Error(`Slice at index ${i}: ${rrb.get(z,i)} !== ${c[i]}`);
        }
    }
    return true;
}

function getRandomInt() {
    return Math.floor(Math.random() * (1000)) + 0;
}
