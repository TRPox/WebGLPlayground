/**
 * Created by marcus on 31/05/16.
 */
function ortho(e) {
    return [2 / (e.right - e.left), 0, 0, 0, 0, 2 / (e.top - e.bottom), 0, 0, 0, 0, -2 / (e.far - e.near), 0, -(e.right + e.left) / (e.right - e.left), -(e.top + e.bottom) / (e.top - e.bottom), -(e.far + e.near) / (e.far - e.near), 1]
}

function initGL(e) {
    window.requestAnimFrame = function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(e, t) {
                window.setTimeout(e, 1e3 / 60)
            }
    }();
    try {
        gl = e.getContext("webgl") || e.getContext("experimental-webgl")
    } catch (t) {
        gl = null
    }
    if (gl === null) {
        window.location = "http://aerodoodle.swan.ac.uk/nowebgl.html"
    }
    gl.viewport(0, 0, e.width, e.height)
}

function getSourceSynch(e) {
    var t = new XMLHttpRequest;
    t.open("GET", e, false);
    t.send(null);
    return t.status == 200 ? t.responseText : null
}

function getShader(e, t) {
    var n;
    if (t === "fs") {
        n = gl.createShader(gl.FRAGMENT_SHADER)
    } else if (t === "vs") {
        n = gl.createShader(gl.VERTEX_SHADER)
    } else {
        return null
    }
    if (!e.pop) {
        e = [e]
    }
    var r = [];
    for (var i = 0; i < e.length; i++) {
        var s = getSourceSynch(e[i]);
        r.push(s)
    }
    gl.shaderSource(n, r.join("\n"));
    gl.compileShader(n);
    return n
}

function initShaders() {
    for (var e in PROGS_DESC) {
        progs[e] = gl.createProgram();
        gl.attachShader(progs[e], getShader(PROGS_DESC[e].vs, "vs"));
        gl.attachShader(progs[e], getShader(PROGS_DESC[e].fs, "fs"));
        gl.linkProgram(progs[e]);
        for (var t = 0; t < PROGS_DESC[e].attribs.length; t++) {
            progs[e][PROGS_DESC[e].attribs[t]] = gl.getAttribLocation(progs[e], PROGS_DESC[e].attribs[t]);
            gl.enableVertexAttribArray(progs[e][PROGS_DESC[e].attribs[t]])
        }
        for (var t = 0; t < PROGS_DESC[e].uniforms.length; t++) {
            progs[e][PROGS_DESC[e].uniforms[t]] = gl.getUniformLocation(progs[e], PROGS_DESC[e].uniforms[t])
        }
    }
}

function createTexture(e, t, n) {
    var r = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, r);
    if (!n) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, e, t, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return r
}

function initTexturesFramebuffer() {
    for (var e in TEXTURES_DESC) {
        textures[e] = createTexture(Nx, Ny, false)
    }
    textures.display = createTexture(Nx, Ny, false);
    framebuffer = gl.createFramebuffer()
}

function createBuffer(e) {
    var t = gl[{
        v: "ARRAY_BUFFER",
        t: "ARRAY_BUFFER",
        i: "ELEMENT_ARRAY_BUFFER"
    }[e.type]];
    var n = {
        v: Float32Array,
        t: Float32Array,
        i: Uint16Array
    }[e.type];
    var r = {
        v: 3,
        t: 2,
        i: 1
    }[e.type];
    var i = gl.createBuffer();
    gl.bindBuffer(t, i);
    gl.bufferData(t, new n(e.data), gl.STATIC_DRAW);
    gl.bindBuffer(t, null);
    i.itemSize = r;
    i.numItems = Math.floor(e.data.length / r);
    return i
}

function initBuffers() {
    for (var e in BUFFERS_DESC) {
        buffers[e] = createBuffer(BUFFERS_DESC[e])
    }
}

function is_int(e) {
    if (e == "uPointX" || e == "uPointY" || e == "uPointX1" || e == "uPointY1" || e == "uPointX2" || e == "uPointY2" || e == "uPointX3" || e == "uPointY3" || e == "uPointX4" || e == "uPointY4" || e == "MVPMat" || e == "uRadius" || e == "uOmega" || e == "uVel") {
        return false
    } else {
        return true
    }
}

function doRenderOp(e, t, n, r) {
    var i = progs[n];
    gl.useProgram(i);
    for (var s in r) {
        if (s == "MVPMat") {
            gl.uniformMatrix4fv(i[s], false, r[s])
        } else {
            if (is_int(s)) {
                gl.uniform1i(i[s], r[s])
            } else {
                gl.uniform1f(i[s], r[s])
            }
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.quadVB);
    gl.vertexAttribPointer(i.aVertexPosition, buffers.quadVB.itemSize, gl.FLOAT, false, 0, 0);
    if (i.aTextureCoord != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.quadTB);
        gl.vertexAttribPointer(i.aTextureCoord, buffers.quadTB.itemSize, gl.FLOAT, false, 0, 0)
    }
    for (var o = 0; o < t.length; o++) {
        gl.activeTexture(gl.TEXTURE0 + o);
        gl.bindTexture(gl.TEXTURE_2D, textures[t[o]]);
        gl.uniform1i(i["uSampler" + o], o)
    }
    if (e != null) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[e], 0)
    } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (n == "init-accum") {
        gl.disableVertexAttribArray(1);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.quadIB);
        gl.drawElements(gl.TRIANGLES, buffers.quadIB.numItems, gl.UNSIGNED_SHORT, 0);
        gl.enableVertexAttribArray(1)
    } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.quadIB);
        gl.drawElements(gl.TRIANGLES, buffers.quadIB.numItems, gl.UNSIGNED_SHORT, 0)
    }
}

function swapTextures(e, t) {
    var n = textures[e];
    textures[e] = textures[t];
    textures[t] = n
}

function initState() {
    doRenderOp("rho", [], "init-accum", {
        uRhoUxUy: 0
    });
    doRenderOp("ux", [], "init-accum", {
        uRhoUxUy: 1
    });
    doRenderOp("uy", [], "init-accum", {
        uRhoUxUy: 2
    });
    doRenderOp("f0", ["rho", "ux", "uy"], "init-f", {
        uI: 0
    });
    doRenderOp("f1", ["rho", "ux", "uy"], "init-f", {
        uI: 1
    });
    doRenderOp("f2", ["rho", "ux", "uy"], "init-f", {
        uI: 2
    });
    doRenderOp("f3", ["rho", "ux", "uy"], "init-f", {
        uI: 3
    });
    doRenderOp("f4", ["rho", "ux", "uy"], "init-f", {
        uI: 4
    });
    doRenderOp("f5", ["rho", "ux", "uy"], "init-f", {
        uI: 5
    });
    doRenderOp("f6", ["rho", "ux", "uy"], "init-f", {
        uI: 6
    });
    doRenderOp("f7", ["rho", "ux", "uy"], "init-f", {
        uI: 7
    });
    doRenderOp("f8", ["rho", "ux", "uy"], "init-f", {
        uI: 8
    });
    doRenderOp("obst", [], "init-obst", {});
    doRenderOp("obst_intended", [], "init-obst", {})
}

function stepState() {
    if (mode == SQUARE_MODE && inDraw) {
        if (obstPoint1[0] < obstPoint2[0]) {
            square1[0] = obstPoint1[0];
            square2[0] = obstPoint2[0]
        } else {
            square1[0] = obstPoint2[0];
            square2[0] = obstPoint1[0]
        }
        if (obstPoint1[1] > obstPoint2[1]) {
            square1[1] = obstPoint1[1];
            square2[1] = obstPoint2[1]
        } else {
            square1[1] = obstPoint2[1];
            square2[1] = obstPoint1[1]
        }
        doRenderOp("tmp", ["obst_intended"], "update-obst-square", {
            uPointX1: square1[0],
            uPointY1: square1[1],
            uPointX2: square2[0],
            uPointY2: square2[1],
            uClear: clear ? 1 : 0,
            uAdd: 0
        });
        swapTextures("tmp", "obst_intended");
        if (addSquare) {
            doRenderOp("tmp", ["obst"], "update-obst-square", {
                uPointX1: square1[0],
                uPointY1: square1[1],
                uPointX2: square2[0],
                uPointY2: square2[1],
                uClear: clear ? 1 : 0,
                uAdd: 1
            });
            swapTextures("tmp", "obst");
            addSquare = false
        }
    }
    if (mode == BRUSH_MODE && inDraw) {
        doRenderOp("tmp", ["obst_intended"], "update-obst-circle", {
            uPointX: obstPoint2[0],
            uPointY: obstPoint2[1],
            uRadius: circle_radius,
            uClear: clear ? 1 : 0,
            uAdd: 0
        });
        swapTextures("tmp", "obst_intended");
        if (addCircle) {
            doRenderOp("tmp", ["obst"], "update-obst-circle", {
                uPointX: obstPoint2[0],
                uPointY: obstPoint2[1],
                uRadius: circle_radius,
                uClear: clear ? 1 : 0,
                uAdd: 1
            });
            swapTextures("tmp", "obst")
        }
    }
    if (mode == CIRCLE_MODE && inDraw) {
        doRenderOp("tmp", ["obst_intended"], "update-obst-circle", {
            uPointX: obstPoint1[0],
            uPointY: obstPoint1[1],
            uRadius: circle_radius,
            uClear: clear ? 1 : 0,
            uAdd: 0
        });
        swapTextures("tmp", "obst_intended");
        if (addCircleR) {
            doRenderOp("tmp", ["obst"], "update-obst-circle", {
                uPointX: obstPoint1[0],
                uPointY: obstPoint1[1],
                uRadius: circle_radius,
                uClear: clear ? 1 : 0,
                uAdd: 1
            });
            swapTextures("tmp", "obst");
            addCircleR = false
        }
    }
    if (mode == LINE_MODE && inDraw) {
        var e = [obstPoint2[0] - obstPoint1[0], obstPoint2[1] - obstPoint1[1]];
        var t = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
        var n = Math.asin(e[0] / t);
        if (obstPoint2[1] < obstPoint1[1]) n = Math.PI - n;
        square_p1 = [-brush_radius / 2, 0];
        square_p2 = [-brush_radius / 2, t];
        square_p3 = [brush_radius / 2, t];
        square_p4 = [brush_radius / 2, 0];
        var r = Math.cos(n);
        var i = Math.sin(n);
        square_p1 = [square_p1[0] * r + square_p1[1] * i + obstPoint1[0], -square_p1[0] * i + square_p1[1] * r + obstPoint1[1]];
        square_p2 = [square_p2[0] * r + square_p2[1] * i + obstPoint1[0], -square_p2[0] * i + square_p2[1] * r + obstPoint1[1]];
        square_p3 = [square_p3[0] * r + square_p3[1] * i + obstPoint1[0], -square_p3[0] * i + square_p3[1] * r + obstPoint1[1]];
        square_p4 = [square_p4[0] * r + square_p4[1] * i + obstPoint1[0], -square_p4[0] * i + square_p4[1] * r + obstPoint1[1]];
        if (t > 0) {
            doRenderOp("tmp", ["obst_intended"], "update-obst-line", {
                uPointX1: square_p1[0],
                uPointY1: square_p1[1],
                uPointX2: square_p2[0],
                uPointY2: square_p2[1],
                uPointX3: square_p3[0],
                uPointY3: square_p3[1],
                uPointX4: square_p4[0],
                uPointY4: square_p4[1],
                uClear: clear ? 1 : 0,
                uAdd: 0
            });
            swapTextures("tmp", "obst_intended");
            if (addLine) {
                doRenderOp("tmp", ["obst"], "update-obst-line", {
                    uPointX1: square_p1[0],
                    uPointY1: square_p1[1],
                    uPointX2: square_p2[0],
                    uPointY2: square_p2[1],
                    uPointX3: square_p3[0],
                    uPointY3: square_p3[1],
                    uPointX4: square_p4[0],
                    uPointY4: square_p4[1],
                    uClear: clear ? 1 : 0,
                    uAdd: 1
                });
                swapTextures("tmp", "obst");
                addLine = false;
                obstPoint2 = obstPoint1
            }
        }
    }
    if (clearObst && inDraw) {
        doRenderOp("obst", [], "update-obst-clear", {});
        clearObst = false
    }
    if (window.innerWidth * .8 <= 1024 && window.innerWidth * .8 >= 800) {
        canvas.width = window.innerWidth * .8
    } else if (window.innerWidth * .8 > 1024) {
        canvas.width = 1024
    } else if (window.innerWidth * .8 < 800) {
        canvas.width = 800
    }
    canvas.height = canvas.width * (Ny / Nx);
    frameProgress += 1;
    updateZoom(fromV, toV);
    doRenderOp("rho", ["f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"], "f-to-accum", {
        uRhoUxUy: 0
    });
    doRenderOp("ux", ["f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"], "f-to-accum", {
        uRhoUxUy: 1
    });
    doRenderOp("uy", ["f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"], "f-to-accum", {
        uRhoUxUy: 2
    });
    if (count % stepsPerForceEval == 0) {
        doRenderOp("fx", ["f1", "f2", "f4", "f5", "f6", "f8", "obst"], "update-Fx", {});
        doRenderOp("fy", ["f2", "f3", "f4", "f6", "f7", "f8", "obst"], "update-Fy", {});
        computeForce()
    }
    doRenderOp("tmp", ["rho", "ux", "uy", "f0", "obst"], "update-f", {
        uI: 0,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f0");
    doRenderOp("tmp", ["rho", "ux", "uy", "f1", "obst"], "update-f", {
        uI: 1,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f1");
    doRenderOp("tmp", ["rho", "ux", "uy", "f2", "obst"], "update-f", {
        uI: 2,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f2");
    doRenderOp("tmp", ["rho", "ux", "uy", "f3", "obst"], "update-f", {
        uI: 3,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f3");
    doRenderOp("tmp", ["rho", "ux", "uy", "f4", "obst"], "update-f", {
        uI: 4,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f4");
    doRenderOp("tmp", ["rho", "ux", "uy", "f5", "obst"], "update-f", {
        uI: 5,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f5");
    doRenderOp("tmp", ["rho", "ux", "uy", "f6", "obst"], "update-f", {
        uI: 6,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f6");
    doRenderOp("tmp", ["rho", "ux", "uy", "f7", "obst"], "update-f", {
        uI: 7,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f7");
    doRenderOp("tmp", ["rho", "ux", "uy", "f8", "obst"], "update-f", {
        uI: 8,
        uOmega: omega,
        uVel: u
    });
    swapTextures("tmp", "f8");
    if (inDraw) {
        doRenderOp(null, ["ux", "uy", "obst", "obst_intended"], "show-umod", {
            drawIntended: drawIntended ? 1 : 0,
            MVPMat: MVPMat
        })
    } else {
        doRenderOp(null, ["ux", "uy", "obst", null], "show-umod", {
            drawIntended: drawIntended ? 1 : 0,
            MVPMat: MVPMat
        })
    }
    count = count + 1
}

function step() {
    stepState();
    frameNum++;
    var e = new Date;
    if (e - frameNumStarted > 1e3) {
        document.getElementById("fps").textContent = (1e3 / ((e - frameNumStarted) / frameNum)).toFixed(2);
        frameNum = 0;
        frameNumStarted = e
    }
    frameNum2++;
    if (e - frameNumStarted2 > 100) {
        pos = findPos(canvas);
        frameNum2 = 0;
        frameNumStarted2 = e
    }
    requestAnimFrame(step)
}

function findPos(e) {
    var t = 0,
        n = 0;
    if (e.offsetParent) {
        do {
            t += e.offsetLeft;
            n += e.offsetTop
        } while (e = e.offsetParent);
        return {
            x: t,
            y: n
        }
    }
    return undefined
}

function webGLStart() {
    canvas = document.getElementById("main-canvas");
    window.addEventListener("mousedown", mouseDownListenerCanvas, false);
    window.addEventListener("mousemove", mouseMoveListener, false);
    window.addEventListener("mouseup", mouseUpListener, false);
    canvas.addEventListener("mousemove", mouseMoveListener, false);
    canvas.addEventListener("mouseup", mouseUpListener, false);
    updateBrushSlider(.01);
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexturesFramebuffer();
    initState();
    step()
}

function updateBrushSlider(e) {
    if (lowQuality && e < .0025) e = .0025;
    brush_radius = e / dx;
    circle_radius = brush_radius
}

function updateTauSlider(e) {
    tau = e;
    omega = 1 / tau;
    nu_phys = 1 / 3 * (tau - .5) * dx * dx / dt
}

function updateUSlider(e) {
    u = e
}

function isInside(e, t, n) {
    if (n[0] < e[0] || n[0] > t[0] || n[1] > e[1] || n[1] < t[1]) return false;
    else return true
}

function BrushMouseDown(e) {
    drawIntended = true;
    addCircle = true
}

function BrushMouseMove(e) {
    drawIntended = true
}

function BrushMouseUp(e) {
    addCircle = false
}

function SquareMouseDown(e) {
    drawIntended = true
}

function SquareMouseMove(e) {}

function SquareMouseUp(e) {
    addSquare = true;
    drawIntended = false
}

function CircleMouseDown(e) {
    circle_radius = 1e-5;
    drawIntended = true
}

function CircleMouseMove(e) {
    var t = [obstPoint2[0] - obstPoint1[0], obstPoint2[1] - obstPoint1[1]];
    circle_radius = Math.sqrt(t[0] * t[0] + t[1] * t[1])
}

function CircleMouseUp(e) {
    addCircleR = true;
    drawIntended = false
}

function LineMouseDown(e) {
    drawIntended = true
}

function LineMouseMove(e) {}

function LineMouseUp(e) {
    addLine = true;
    drawIntended = false
}

function updateZoom(e, t) {
    if (frameProgress <= zoomFrameLen) {
        var n = frameProgress / zoomFrameLen;
        var r = {
            left: e.left + n * (t.left - e.left),
            right: e.right + n * (t.right - e.right),
            bottom: e.bottom + n * (t.bottom - e.bottom),
            top: e.top + n * (t.top - e.top),
            near: 1,
            far: -1
        };
        MVPMat = ortho(r)
    }
}

function zoomClick() {
    if (inDraw == true) {
        inDraw = false
    } else {
        inDraw = true
    }
    frameProgress = 0;
    var e = fromV;
    fromV = toV;
    toV = e
}

function computeForce() {
    var e = new Uint8Array(bWidth * bHeight * 4);
    var t = new Uint8Array(bWidth * bHeight * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures["fx"], 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
        gl.readPixels(bLeft, bBottom, bWidth, bHeight, gl.RGBA, gl.UNSIGNED_BYTE, e)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures["fy"], 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
        gl.readPixels(bLeft, bBottom, bWidth, bHeight, gl.RGBA, gl.UNSIGNED_BYTE, t)
    }
    var n = 0;
    var r = 0;
    var i = 0;
    var s = bWidth;
    var o = 0;
    for (var a = 0; a < bHeight; a++) {
        for (var f = 0; f < bWidth; f++) {
            var l = e[a * bWidth * 4 + 4 * f + 0];
            var c = e[a * bWidth * 4 + 4 * f + 1];
            var h = e[a * bWidth * 4 + 4 * f + 2];
            var p = color2Float(l, c, h);
            var l = t[a * bWidth * 4 + 4 * f + 0];
            var c = t[a * bWidth * 4 + 4 * f + 1];
            var h = t[a * bWidth * 4 + 4 * f + 2];
            var d = color2Float(l, c, h);
            if (p != 0 || d != 0) {
                if (a < s) s = a;
                if (a > o) o = a;
                n = n + p;
                r = r + d;
                i = i + 1
            }
        }
    }
    var v, m, g = (o - s) * dx * dx;
    var y = u * dx / dt;
    var b = density * dx * dx * dx * dx / dt * dt;
    n = n * b;
    r = r * b;
    if (i > 0) {
        v = 2 * n / (y * y * g * density);
        m = 2 * r / (y * y * g * density)
    } else {
        v = 0;
        m = 0
    }
    if (cl_array.length > 200) {
        var w = cl_array.shift();
        w = cd_array.shift()
    }
    cl_array.push(m);
    cd_array.push(v);
    var E = Array.min(cl_array);
    var S = Array.max(cl_array);
    var x = Array.min(cd_array);
    var T = Array.max(cd_array);
    min_coeff = E < x ? E : x;
    max_coeff = S > T ? S : T;
    var N = min_coeff > max_coeff ? min_coeff * .2 : max_coeff * .2;
    min_coeff -= N;
    max_coeff += N;
    document.getElementById("lift").textContent = m.toFixed(7);
    document.getElementById("drag").textContent = v.toFixed(7)
}

function color2Float(e, t, n) {
    return (e / 256 + t / (256 * 256) + n / (256 * 256 * 256)) * 2 - 1
}

function onRightClick() {
    clearObst = true;
    return false
}

function init_low() {
    lowQuality = true;
    Nx = 256;
    Ny = 32;
    dx = Lx / Nx;
    nu_phys = 1 / 3 * (tau - .5) * dx * dx / dt;
    brush_radius = .01 / dx;
    circle_radius = .01 / dx;
    bLeft = .09765625 * Nx;
    bRight = .34765625 * Nx;
    bBottom = .375 * Ny;
    bTop = .625 * Ny;
    bWidth = bRight - bLeft;
    bHeight = bTop - bBottom;
    horOffset = Nx / 2;
    verOffset = Ny / 2;
    buildVport = {
        left: (bLeft - horOffset) / horOffset,
        right: (bRight - horOffset) / horOffset,
        bottom: (bBottom - verOffset) / verOffset,
        top: (bTop - verOffset) / verOffset,
        near: 1,
        far: -1
    };
    fromV = vport;
    toV = buildVport;
    MVPMat = ortho(buildVport);
    PROGS_DESC = {
        "init-accum": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-low.fs", "shaders/init-accum.fs"],
            attribs: ["aVertexPosition"],
            uniforms: ["uRhoUxUy"]
        },
        "init-f": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/init-f.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uI"]
        },
        "init-obst": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-low.fs", "shaders/init-obst.fs"],
            attribs: ["aVertexPosition"],
            uniforms: []
        },
        "update-f": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/update-f.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uI", "uOmega", "uVel"]
        },
        "update-Fx": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/update-fx.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6"]
        },
        "update-Fy": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/update-fy.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6"]
        },
        "update-obst-clear": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-low.fs", "shaders/update-obst-clear.fs"],
            attribs: ["aVertexPosition"],
            uniforms: []
        },
        "update-obst-circle": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/update-obst-circle.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX", "uPointY", "uRadius", "uClear", "uAdd"]
        },
        "update-obst-square": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/update-obst-square.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX1", "uPointY1", "uPointX2", "uPointY2", "uClear", "uAdd"]
        },
        "update-obst-line": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/update-obst-line.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX1", "uPointY1", "uPointX2", "uPointY2", "uPointX3", "uPointY3", "uPointX4", "uPointY4", "uClear", "uAdd"]
        },
        "f-to-accum": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-low.fs", "shaders/f-to-accum.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6", "uSampler7", "uSampler8", "uRhoUxUy"]
        },
        "show-umod": {
            vs: ["shaders/quad_perspective.vs"],
            fs: ["shaders/utils-low.fs", "shaders/show-umod.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "drawIntended", "MVPMat"]
        }
    };
    TEXTURES_DESC = {
        rho: [Nx, Ny],
        ux: [Nx, Ny],
        uy: [Nx, Ny],
        f0: [Nx, Ny],
        f1: [Nx, Ny],
        f2: [Nx, Ny],
        f3: [Nx, Ny],
        f4: [Nx, Ny],
        f5: [Nx, Ny],
        f6: [Nx, Ny],
        f7: [Nx, Ny],
        f8: [Nx, Ny],
        tmp: [Nx, Ny],
        obst: [Nx, Ny],
        obst_intended: [Nx, Ny],
        fx: [Nx, Ny],
        fy: [Nx, Ny]
    }
}

function init_med() {
    Nx = 512;
    Ny = 64;
    dx = Lx / Nx;
    nu_phys = 1 / 3 * (tau - .5) * dx * dx / dt;
    brush_radius = .01 / dx;
    circle_radius = .01 / dx;
    bLeft = .09765625 * Nx;
    bRight = .34765625 * Nx;
    bBottom = .375 * Ny;
    bTop = .625 * Ny;
    bWidth = bRight - bLeft;
    bHeight = bTop - bBottom;
    horOffset = Nx / 2;
    verOffset = Ny / 2;
    buildVport = {
        left: (bLeft - horOffset) / horOffset,
        right: (bRight - horOffset) / horOffset,
        bottom: (bBottom - verOffset) / verOffset,
        top: (bTop - verOffset) / verOffset,
        near: 1,
        far: -1
    };
    fromV = vport;
    toV = buildVport;
    MVPMat = ortho(buildVport);
    PROGS_DESC = {
        "init-accum": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-med.fs", "shaders/init-accum.fs"],
            attribs: ["aVertexPosition"],
            uniforms: ["uRhoUxUy"]
        },
        "init-f": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/init-f.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uI"]
        },
        "init-obst": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-med.fs", "shaders/init-obst.fs"],
            attribs: ["aVertexPosition"],
            uniforms: []
        },
        "update-f": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/update-f.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uI", "uOmega", "uVel"]
        },
        "update-Fx": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/update-fx.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6"]
        },
        "update-Fy": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/update-fy.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6"]
        },
        "update-obst-clear": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-med.fs", "shaders/update-obst-clear.fs"],
            attribs: ["aVertexPosition"],
            uniforms: []
        },
        "update-obst-circle": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/update-obst-circle.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX", "uPointY", "uRadius", "uClear", "uAdd"]
        },
        "update-obst-square": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/update-obst-square.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX1", "uPointY1", "uPointX2", "uPointY2", "uClear", "uAdd"]
        },
        "update-obst-line": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/update-obst-line.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX1", "uPointY1", "uPointX2", "uPointY2", "uPointX3", "uPointY3", "uPointX4", "uPointY4", "uClear", "uAdd"]
        },
        "f-to-accum": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-med.fs", "shaders/f-to-accum.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6", "uSampler7", "uSampler8", "uRhoUxUy"]
        },
        "show-umod": {
            vs: ["shaders/quad_perspective.vs"],
            fs: ["shaders/utils-med.fs", "shaders/show-umod.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "drawIntended", "MVPMat"]
        }
    };
    TEXTURES_DESC = {
        rho: [Nx, Ny],
        ux: [Nx, Ny],
        uy: [Nx, Ny],
        f0: [Nx, Ny],
        f1: [Nx, Ny],
        f2: [Nx, Ny],
        f3: [Nx, Ny],
        f4: [Nx, Ny],
        f5: [Nx, Ny],
        f6: [Nx, Ny],
        f7: [Nx, Ny],
        f8: [Nx, Ny],
        tmp: [Nx, Ny],
        obst: [Nx, Ny],
        obst_intended: [Nx, Ny],
        fx: [Nx, Ny],
        fy: [Nx, Ny]
    }
}

function init_high() {
    Nx = 1024;
    Ny = 128;
    dx = Lx / Nx;
    nu_phys = 1 / 3 * (tau - .5) * dx * dx / dt;
    brush_radius = .01 / dx;
    circle_radius = .01 / dx;
    bLeft = .09765625 * Nx;
    bRight = .34765625 * Nx;
    bBottom = .375 * Ny;
    bTop = .625 * Ny;
    bWidth = bRight - bLeft;
    bHeight = bTop - bBottom;
    horOffset = Nx / 2;
    verOffset = Ny / 2;
    buildVport = {
        left: (bLeft - horOffset) / horOffset,
        right: (bRight - horOffset) / horOffset,
        bottom: (bBottom - verOffset) / verOffset,
        top: (bTop - verOffset) / verOffset,
        near: 1,
        far: -1
    };
    fromV = vport;
    toV = buildVport;
    MVPMat = ortho(buildVport);
    PROGS_DESC = {
        "init-accum": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-low.fs", "shaders/init-accum.fs"],
            attribs: ["aVertexPosition"],
            uniforms: ["uRhoUxUy"]
        },
        "init-f": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/init-f.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uI"]
        },
        "init-obst": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-high.fs", "shaders/init-obst.fs"],
            attribs: ["aVertexPosition"],
            uniforms: []
        },
        "update-f": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/update-f.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uI", "uOmega", "uVel"]
        },
        "update-Fx": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/update-fx.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6"]
        },
        "update-Fy": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/update-fy.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6"]
        },
        "update-obst-clear": {
            vs: ["shaders/quad-uniform-tex.vs"],
            fs: ["shaders/utils-high.fs", "shaders/update-obst-clear.fs"],
            attribs: ["aVertexPosition"],
            uniforms: []
        },
        "update-obst-circle": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/update-obst-circle.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX", "uPointY", "uRadius", "uClear", "uAdd"]
        },
        "update-obst-square": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/update-obst-square.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX1", "uPointY1", "uPointX2", "uPointY2", "uClear", "uAdd"]
        },
        "update-obst-line": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/update-obst-line.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uPointX1", "uPointY1", "uPointX2", "uPointY2", "uPointX3", "uPointY3", "uPointX4", "uPointY4", "uClear", "uAdd"]
        },
        "f-to-accum": {
            vs: ["shaders/quad.vs"],
            fs: ["shaders/utils-high.fs", "shaders/f-to-accum.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "uSampler4", "uSampler5", "uSampler6", "uSampler7", "uSampler8", "uRhoUxUy"]
        },
        "show-umod": {
            vs: ["shaders/quad_perspective.vs"],
            fs: ["shaders/utils-high.fs", "shaders/show-umod.fs"],
            attribs: ["aVertexPosition", "aTextureCoord"],
            uniforms: ["uSampler0", "uSampler1", "uSampler2", "uSampler3", "drawIntended", "MVPMat"]
        }
    };
    TEXTURES_DESC = {
        rho: [Nx, Ny],
        ux: [Nx, Ny],
        uy: [Nx, Ny],
        f0: [Nx, Ny],
        f1: [Nx, Ny],
        f2: [Nx, Ny],
        f3: [Nx, Ny],
        f4: [Nx, Ny],
        f5: [Nx, Ny],
        f6: [Nx, Ny],
        f7: [Nx, Ny],
        f8: [Nx, Ny],
        tmp: [Nx, Ny],
        obst: [Nx, Ny],
        obst_intended: [Nx, Ny],
        fx: [Nx, Ny],
        fy: [Nx, Ny]
    }
}

function logAndValidate(e, t) {
    logGLCalls(e, t);
    validateNoneOfTheArgsAreUndefined(e, t)
}

function logGLCalls(e, t) {
    console.log("gl." + e + "(" + WebGLDebugUtils.glFunctionArgsToString(e, t) + ")")
}

function throwOnGLError(e, t, n) {
    throw WebGLDebugUtils.glEnumToString(e) + " was caused by call to: " + t
}

function validateNoneOfTheArgsAreUndefined(e, t) {
    for (var n = 0; n < t.length; ++n) {
        if (t[n] === undefined) {
            console.error("undefined passed to gl." + e + "(" + WebGLDebugUtils.glFunctionArgsToString(e, t) + ")")
        }
    }
}
var canvas;
var Nx;
var Ny;
var Lx = 1;
var Ly = .125;
var dx;
var nu_phys;
var tau = .51;
var omega = 1 / tau;
var u = .15;
var dt = .01;
var density = 1;
var stepsPerForceEval = 10;
var vport = {
    left: -1,
    right: 1,
    bottom: -1,
    top: 1,
    near: 1,
    far: -1
};
var bLeft;
var bRight;
var bBottom;
var bTop;
var bWidth;
var bHeight;
var horOffset;
var verOffset;
var lowQuality = false;
var canvasTriggeredMouse = false;
var buildVport;
var inDraw = true;
var fromV;
var toV;
var frameProgress = 200;
var MVPMat;
var mouseDown = false;
var obstPoint1 = [-1, -1];
var obstPoint2 = [-1, -1];
var square1 = [-1, -1];
var square2 = [-1, -1];
var square_p1 = [-1, -1];
var square_p2 = [-1, -1];
var square_p3 = [-1, -1];
var square_p4 = [-1, -1];
var clear = false;
var addSquare = false;
var drawIntended = true;
var addCircle = false;
var addLine = false;
var brush_radius;
var circle_radius;
var square_a1 = [-1, -1];
var square_a2 = [-1, -1];
var square_b1 = [-1, -1];
var square_b2 = [-1, -1];
var MAKE_SEL_MODE = 1;
var ACTIVE_SEL_MODE = 2;
var sel_mode = MAKE_SEL_MODE;
var BRUSH_MODE = 0;
var SQUARE_MODE = 1;
var CIRCLE_MODE = 2;
var LINE_MODE = 3;
var SELECT_MODE = 4;
var mode = BRUSH_MODE;
var clearObst = false;
var PROGS_DESC;
var TEXTURES_DESC;
var BUFFERS_DESC = {
    quadVB: {
        type: "v",
        data: [-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1]
    },
    quadTB: {
        type: "t",
        data: [0, 0, 1, 0, 1, 1, 0, 1]
    },
    quadIB: {
        type: "i",
        data: [0, 1, 2, 0, 2, 3]
    }
};
var gl;
var progs = {};
var textures = {};
var framebuffer;
var buffers = {};
var count = 0;
var frameNum = 0;
var frameNumStarted = new Date;
var pos;
var frameNum2 = 0;
var frameNumStarted2 = new Date;
mouseDownListenerCanvas = function(e) {
    mouseDown = true;
    pos = findPos(canvas);
    var t = Nx / canvas.width;
    var n = Ny / canvas.height;
    var r = (e.pageX - pos.x) * t;
    var i = (e.pageY - pos.y) * n;
    if (r > 0 && r < Nx && i > 0 && i < Ny) {
        canvasTriggeredMouse = true;
        if (inDraw) {
            var s = (buildVport.right - buildVport.left) / (vport.right - vport.left);
            var o = (buildVport.top - buildVport.bottom) / (vport.top - vport.bottom);
            r = r * s + bLeft;
            i = (Ny - i) * o + bBottom
        } else {
            i = Ny - i
        }
        obstPoint1 = [r, i];
        if (mode == BRUSH_MODE) BrushMouseDown(pos);
        if (mode == SQUARE_MODE) SquareMouseDown(pos);
        if (mode == CIRCLE_MODE) CircleMouseDown(pos);
        if (mode == LINE_MODE) LineMouseDown(pos);
        e = e || window.event;
        clear = e.ctrlKey;
        if (e.preventDefault) {
            e.preventDefault()
        } else if (e.returnValue) {
            e.returnValue = false
        }
        return false
    } else {
        e.returnValue = true;
        canvasTriggeredMouse = false;
        return true
    }
};
mouseUpListener = function(e) {
    if (canvasTriggeredMouse) {
        mouseDown = false;
        if (mode == BRUSH_MODE) BrushMouseUp(pos);
        if (mode == SQUARE_MODE) SquareMouseUp(pos);
        if (mode == CIRCLE_MODE) CircleMouseUp(pos);
        if (mode == LINE_MODE) LineMouseUp(pos)
    }
};
mouseMoveListener = function(e) {
    pos = findPos(canvas);
    var t = Nx / canvas.width;
    var n = Ny / canvas.height;
    var r = (e.pageX - pos.x) * t;
    var i = (e.pageY - pos.y) * n;
    if (inDraw) {
        var s = (buildVport.right - buildVport.left) / (vport.right - vport.left);
        var o = (buildVport.top - buildVport.bottom) / (vport.top - vport.bottom);
        r = r * s + bLeft;
        i = (Ny - i) * o + bBottom
    } else {
        i = Ny - i
    }
    obstPoint2 = [r, i];
    if (mode == BRUSH_MODE) BrushMouseMove(pos);
    if (canvasTriggeredMouse) {
        if (mode == SQUARE_MODE) SquareMouseMove(pos);
        if (mode == CIRCLE_MODE) CircleMouseMove(pos);
        if (mode == LINE_MODE) LineMouseMove(pos)
    }
};
var zoomFrameLen = 30;
var min_coeff = -1;
var max_coeff = 1;
var cl_array = [];
var cd_array = [];
var cl_data = [];
var cd_data = [];
Array.max = function(e) {
    return Math.max.apply(Math, e)
};
Array.min = function(e) {
    return Math.min.apply(Math, e)
};
$(function() {
    function n() {
        cl_data = [];
        for (var r = 0; r < cl_array.length; ++r) {
            cl_data.push([r, cl_array[r]])
        }
        cd_data = [];
        for (var r = 0; r < cd_array.length; ++r) {
            cd_data.push([r, cd_array[r]])
        }
        t.setData([{
            label: "Cl",
            data: cl_data
        }, {
            label: "Cd",
            data: cd_data
        }]);
        t.setupGrid();
        t.draw();
        setTimeout(n, e)
    }
    var e = 60;
    $(this).val("" + e);
    var t = $.plot("#coeffPlot", [{
        label: "Cl",
        data: cl_data
    }, {
        label: "Cd",
        data: cd_data
    }], {
        series: {
            shadowSize: 5
        },
        yaxis: {
            axisLabel: "Coefficient Value",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 20,
            axisLabelFontFamily: "visitor2",
            axisLabelPadding: 30
        },
        xaxis: {
            axisLabel: "Time",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 20,
            axisLabelFontFamily: "visitor2",
            font: {
                color: "#ffffff"
            }
        },
        legend: {
            noColumns: 2,
            backgroundOpacity: .5
        }
    });
    n()
});
$(function() {
    $("#slider-id").liquidSlider({
        dynamicTabsAlign: "right",
        autoSlide: false,
        autoHeight: true,
        hideSideArrows: true,
        mobileNavigation: false,
        callbackFunction: function() {
            e = $.data($("#slider-id")[0], "liquidSlider");
            if ((e.currentTab == 1 || e.currentTab == 2) && inDraw) {
                zoomClick()
            } else if (e.currentTab == 0 && !inDraw) {
                zoomClick()
            }
        }
    });
    var e = $.data($("#slider-id")[0], "liquidSlider");
    console.log(e)
});
$(document).ready(function() {
    var e = 20 * u;
    var t = Math.round(Math.min(e - 1.5, -e + 4.5) * 255 * .1 + 217 * .9);
    var n = Math.round(Math.min(e - .5, -e + 3.5) * 255 * .1 + 217 * .9);
    var r = Math.round(Math.min(e + .5, -e + 2.5) * 255 * .1 + 217 * .9);
    $("body").css("background-color", "rgb(" + t + "," + n + "," + r + ")");
    $("#slider_u").change(function() {
        var e = 20 * u;
        var t = Math.round(Math.min(e - 1.5, -e + 4.5) * 255 * .1 + 217 * .9);
        var n = Math.round(Math.min(e - .5, -e + 3.5) * 255 * .1 + 217 * .9);
        var r = Math.round(Math.min(e + .5, -e + 2.5) * 255 * .1 + 217 * .9);
        $("body").css("background-color", "rgb(" + t + "," + n + "," + r + ")")
    })
});
$(window).scroll(function() {
    $("#top_bar").css("left", parseInt(-1 * $(window).scrollLeft()) + "px")
});