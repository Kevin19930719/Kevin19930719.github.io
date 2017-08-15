var gl;
var prog;
var screen_w = 0;
var screen_h = 0;
var bgTex = null;

window.onload = function() {
	var canvas = document.getElementById("screen_1");
	screen_w = canvas.width;
	screen_h = canvas.height;
	gl = canvas.getContext("webgl");
	if (!gl) {
		alert("你的浏览器不支持WebGL。");
		return;
	}
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	var vssrc =
		"attribute vec3 position;\n" +
		"varying mediump vec2 uv;\n" +
		"void main() {\n" +
		"	uv.x = (position.x + 1.0) / 2.0;\n" +
		"	uv.y = 1.0 - (position.y + 1.0) / 2.0;\n" +
		"	gl_Position = vec4(position, 1.0);\n" +
		"}";
	var fssrc =
		"varying mediump vec2 uv;\n" +
		"uniform sampler2D maintex;\n" +
		"void main() {\n" +
		"	gl_FragColor = texture2D(maintex, uv);\n" +
		"}";
	
	var vertShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertShader, vssrc);
	gl.compileShader(vertShader);
	if(!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {  
		console.log(gl.getShaderInfoLog(vertShader));  
		return null;
	}
	
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragShader, fssrc);
	gl.compileShader(fragShader);
	if(!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {  
		console.log(gl.getShaderInfoLog(fragShader));  
		return null;  
	} 
	
	prog = gl.createProgram();
	gl.attachShader(prog, vertShader);
	gl.attachShader(prog, fragShader);
	gl.linkProgram(prog);
	
	var geo = new Float32Array([
		1.0, 1.0, 0.0,
		1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0,
		-1.0, 1.0, 0.0,
		1.0, 1.0, 0.0,
	]);
	abo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, abo);
	gl.bufferData(gl.ARRAY_BUFFER, geo, gl.STATIC_DRAW);
	
	var locPostition = gl.getAttribLocation(prog, "position");
	gl.enableVertexAttribArray(locPostition);
	gl.vertexAttribPointer(locPostition, 3, gl.FLOAT, false, 0, 0);
}

function nextPow2(i) {
	if (i == 0)
		return i;
	--i;
	i |= i >> 1;
	i |= i >> 2;
	i |= i >> 4;
	i |= i >> 8;
	i |= i >> 16;
	++i;
	return i;
}

function genGameTex(arr, w, h) {
	var wTex = nextPow2(screen_w);
	var hTex = nextPow2(screen_h);
	var data = [];
	for (var i = 0; i < hTex; ++i)
		for (var j = 0; j < wTex; ++j)
			if (arr[Math.ceil(i / hTex * h) * w + Math.ceil(j / wTex * w)])
				data.push(255, 255, 255);
			else
				data.push(0, 0, 0);
	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, wTex, hTex, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(data));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return tex;
}

function draw2Screen(tex) {
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.activeTexture(gl.TEXTURE0);
	gl.useProgram(prog);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function loadTex(url, onloaded) {
	var img = new Image();
	img.onload = function() {
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
		onloaded(tex);
	};
	img.src = url;
}

function setBackgroud(imgurl) {
	loadTex(imgurl, function(tex){
		bgTex = tex;
	});
}

var isAdd = false;
function draw(arr, w, h) {
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	if (bgTex != null) {
		draw2Screen(bgTex);
		
		if (!isAdd) {
			isAdd = true;
			gl.enable(gl.BLEND);
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.ONE, gl.ONE);
		}
	}
	
	draw2Screen(genGameTex(arr, w, h));
}
