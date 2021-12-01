const imageFileInput = document.getElementById("imageFile"),
    imageCanvas = document.getElementById("imgCanvas"),
    inputContainer = document.getElementById("inputContainer"),
    imageDownload = document.getElementById("imageDownload");
imageFileInput.addEventListener("change", function () {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        const uploadedImage = reader.result;

        initImg(uploadedImage);
    });
    reader.readAsDataURL(this.files[0]);
});

let curImgData = [];
let analyzedData = [];
let imgW = 0;
let imgH = 0;
function initImg(encodedImg) {
    curImgData = [];
    analyzedData = [];
    let image = new Image();
    image.onload = function () {
        let cvs = document.createElement('canvas');
        cvs.width = image.width;
        cvs.height = image.height;

        let ctx = cvs.getContext('2d');
        ctx.drawImage(image, 0, 0);

        let imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        let imgWidth = imageData.width;
        let imgHeight = imageData.height;
        imgW = imgWidth;
        imgH = imgHeight;
        imgArea.start();
        for (let i = 0; i < imgHeight; i++) {
            let curRow = [];
            let cRow = [];
            for (let j = 0; j < imgWidth; j++) {
                let idx = (i * imgWidth + j) * 4;
                let clr = {
                    r: imageData.data[idx],
                    g: imageData.data[idx + 1],
                    b: imageData.data[idx + 2]
                }
                cRow.push({ oi: clr });
                let curPix = new pix(clr, j, i);
                curPix.update();
                curRow.push(curPix);
            }
            curImgData.push(curRow);
            analyzedData.push(cRow);
        }
        makeAvail();
    };
    image.src = encodedImg;
}


const imgArea = {
    canvas: imageCanvas,
    start: function () {
        this.canvas.width = imgW;
        this.canvas.height = imgH;
        this.context = this.canvas.getContext("2d");
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function cth(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbth(clr) {
    let { r, g, b } = clr;
    return "#" + cth(r) + cth(g) + cth(b);
}

function pix(clr, x, y) {
    this.x = x;
    this.y = y;
    this.color = clr;
    this.update = function () {
        ctx = imgArea.context;
        ctx.fillStyle = rgbth(this.color);
        ctx.fillRect(this.x, this.y, 1, 1);
    }
    this.cClr = function (newClr) {
        this.color = newClr;
        this.update();
    }
}
let choices = ["oi", "gs", "ld", "dc", "rh", "gh", "bh", "rb", "gb", "bb"];
let checks = [];
for (let i = 0; i <= 9; i++) {
    checks.push(document.getElementById(`op${i}`));
}
for (let i = 0; i < 10; i++) {
    checks[i].addEventListener("change", () => {
        changeAnalysis();
    })
}
function makeAvail() {
    choices.forEach(x => { x.length = 0; });
    gsFunc();
    ldFunc();
    dcFunc();
    rhFunc();
    ghFunc();
    bhFunc();
    rbFunc();
    gbFunc();
    bbFunc();

    inputContainer.style.visibility = "visible"
}

function changeAnalysis() {
    imgArea.clear();
    let visi = [];
    for (let i = 0; i < 10; i++) {
        checks[i].checked ? visi.push(i) : null;
    }
    console.log(visi);
    if (visi.length == 0) {
        return;
    }
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let curSlot = analyzedData[i][j];
            let curR = 0, curG = 0, curB = 0;
            visi.forEach(x => {
                if (curSlot[choices[x]] != null) {
                    let { r, g, b } = curSlot[choices[x]];
                    r > curR ? curR = r : null;
                    g > curG ? curG = g : null;
                    b > curB ? curB = b : null;
                }
            })
            let curPix = curImgData[i][j];
            curPix.color = { r: curR, g: curG, b: curB };
            curPix.update();
        }
    }

}

function gsFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { r, g, b } = analyzedData[i][j].oi;
            let gVal = (r + g + b) / 3;
            analyzedData[i][j]["gs"] = { r: gVal, g: gVal, b: gVal }
        }
    }
}
function ldFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { r } = analyzedData[i][j].gs;
            let gVal = r < 128 ? 0 : 255;
            analyzedData[i][j]["ld"] = { r: gVal, g: gVal, b: gVal }
        }
    }
}
function dcFunc() {
    let neon = { r: 50, g: 255, b: 20 };
    let black = { r: 0, g: 0, b: 0 };
    for (let i = 1; i < imgH - 1; i++) {
        for (let j = 1; j < imgW - 1; j++) {
            let m = analyzedData[i][j].oi;
            let rVal = m.r;
            let gVal = m.g;
            let bVal = m.b;
            let lt = analyzedData[i - 1][j - 1].oi;
            let t = analyzedData[i][j - 1].oi;
            let rt = analyzedData[i + 1][j - 1].oi;
            let ri = analyzedData[i + 1][j].oi;
            let rb = analyzedData[i + 1][j + 1].oi;
            let b = analyzedData[i][j + 1].oi;
            let lb = analyzedData[i - 1][j + 1].oi;
            let l = analyzedData[i - 1][j].oi;
            let cho = [lt, t, rt, ri, rb, b, lb, l];
            let max = 0;
            for (let k = 0; k < 8; k++) {
                let { r, g, b } = cho[k];
                let curVal = Math.pow(rVal - r, 2) + Math.pow(gVal - g, 2) + Math.pow(bVal - b, 2);
                curVal > max ? max = curVal : null;
            }
            let finVal = black;
            max > 2500 ? finVal = neon : null;
            analyzedData[i][j]["dc"] = finVal;

        }
    }
}
function rhFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { r } = analyzedData[i][j].oi;
            analyzedData[i][j]["rh"] = { r: r, g: 0, b: 0 }
        }
    }
}
function ghFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { g } = analyzedData[i][j].oi;
            analyzedData[i][j]["gh"] = { r: 0, g: g, b: 0 }
        }
    }
}
function bhFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { b } = analyzedData[i][j].oi;
            analyzedData[i][j]["bh"] = { r: 0, g: 0, b: b }
        }
    }
}
function rbFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { r, g, b } = analyzedData[i][j].oi;
            let newR = r - g - b;
            newR < 0 ? newR = 0 : newR = newR / 1.2 + 42.5;
            analyzedData[i][j]["rb"] = { r: newR, g: 0, b: 0 }
        }
    }
}
function gbFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { r, g, b } = analyzedData[i][j].oi;
            let newG = g - r - b;
            newG < 0 ? newG = 0 : newG = newG / 1.2 + 42.5;
            analyzedData[i][j]["gb"] = { r: 0, g: newG, b: 0 }
        }
    }
}
function bbFunc() {
    for (let i = 0; i < imgH; i++) {
        for (let j = 0; j < imgW; j++) {
            let { r, g, b } = analyzedData[i][j].oi;
            let newB = b - r - g;
            newB < 0 ? newB = 0 : newB = newB / 1.2 + 42.5;
            analyzedData[i][j]["bb"] = { r: 0, g: 0, b: newB }
        }
    }
}

imageDownload.addEventListener("click", () => {
    var tmpLink = document.createElement('a');
    tmpLink.download = 'fwisimg.png'; // set the name of the download file 
    tmpLink.href = imageCanvas.toDataURL();

    // temporarily add link to body and initiate the download  
    document.body.appendChild(tmpLink);
    tmpLink.click();
    document.body.removeChild(tmpLink);
})