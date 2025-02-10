const fileArea = document.getElementsByClassName("file-area")[0];
let fileAreaDragOver = false;

function dropHandler(ev) {
    ev.preventDefault();
    dragLeaveHandler(ev);
    console.log("batata (drop)")
}

function dragOverHandler(ev){
    ev.preventDefault();

    if(fileAreaDragOver){
        return;
    }


    fileAreaDragOver = true;
    fileArea.classList.add("biggie");
    //console.log("batata (dragOver)");
}

function dragLeaveHandler(ev){
    ev.preventDefault();
    fileAreaDragOver = false;
    //console.log("batata (dragLeave)");

    fileArea.classList.remove("biggie");
}