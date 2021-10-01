hiDraw.prototype.import = (function () {
	function pointsArrayToObjs(array){
        var newPoints = []
        for(var i = 0 ; i < array.length; i++) {
            newPoints.push({x:array[i][0], y:array[i][1]})
        }
        return newPoints;
    }
    function pointsObjsToArray(objsArray){
        var newPoints = []
        for(var i = 0 ; i < objsArray.length; i++) {
            newPoints.push([ objsArray[i].x, objsArray[i].y])
        }
        return newPoints;
    }

	var Import = function (json, importOptions) {
		if (!json) {
			this.canvasView.loadFromJSON({}, this.canvasView.renderAll.bind(this.canvasView));
			return false;
		}
		var that = this

		var defaultImportOptions = {
			polygon: {
				simplifyNum: 1
			}
		}
		defaultImportOptions = that.mergeDeep(defaultImportOptions, importOptions)
		if (typeof json == 'string') {
			json = JSON.parse(json)
		}
		var baseStr64 = json.imageData;
		// imgElem.setAttribute('src', "data:image/png;base64," + baseStr64);

		var hiObj = {}
		hiObj["fabricObj"] = {}
		hiObj["fabricObj"]["version"] = "4.1.0"
		hiObj["fabricObj"]["objects"] = []
		hiObj["labelmeObj"] = json

		this.defaultOptions.image = {}
		this.defaultOptions.image.imagAry = baseStr64;
		this.defaultOptions.image.realWidth = json["imageWidth"];
		this.defaultOptions.image.realHeight = json["imageHeight"];

		var fillAlpha = this.defaultOptions.fillAlpha || 0
		var colorToRgbA = this.colorToRgbA

		// console.log(hiObj["labelmeObj"]);
		// console.log(hiObj["labelmeObj"]["shapes"]);
		for (var i = 0; hiObj["labelmeObj"] && Array.isArray(hiObj["labelmeObj"]["shapes"]) && i < hiObj["labelmeObj"]["shapes"].length; i++) {
			var item = hiObj["labelmeObj"]["shapes"][i];
			var label = item['label'];
			var className = item['className'];
			var strokeColor = item['stroke'] ? item['stroke'] : "rgba(3,212,193,1)";
			var note = item['note']
			// console.log('----', item["shape_type"])
			if (item["shape_type"] == "circle") {
				var newFabricObj = {}
				if (item["points"].length != 2) {
					continue; // 點數不合
				} else {
					var x1 = item["points"][0][0];
					var y1 = item["points"][0][1];
					var x2 = item["points"][1][0];
					var y2 = item["points"][1][1];
					var radius = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
					var left = x1;
					var top = y1;
					var width = 2 * radius;
					var height = 2 * radius;

					hiObj["fabricObj"]["objects"].push(
						{
							"type": "hiCircle",
							"version": "4.1.0",
							"originX": "center",
							"originY": "center",
							"left": left,
							"top": top,
							"width": width,
							"height": height,
							"fill": colorToRgbA(strokeColor, fillAlpha),
							"stroke": strokeColor,
							"strokeDashArray": null,
							"strokeLineCap": "butt",
							"strokeDashOffset": 0,
							"strokeLineJoin": "miter",
							"strokeMiterLimit": 4,
							"scaleX": 1,
							"scaleY": 1,
							"angle": 0,
							"flipX": false,
							"flipY": false,
							"opacity": 1,
							"shadow": null,
							"visible": true,
							"backgroundColor": "",
							"fillRule": "nonzero",
							"paintFirst": "fill",
							"globalCompositeOperation": "source-over",
							"skewX": 0,
							"skewY": 0,
							"radius": radius,
							"startAngle": 0,
							"endAngle": 6.283185307179586,
							"label": label,
							"className": className,
							"note": note
						}
					)
				}
			} else if (item["shape_type"] == "rectangle") {
				// console.log('AAA', hiObj["labelmeObj"]["shapes"].length)
				var newFabricObj = {}
				if (item["points"].length != 2) {
					continue; // 點數不合
				} else {
					var x1 = item["points"][0][0];
					var y1 = item["points"][0][1];
					var x2 = item["points"][1][0];
					var y2 = item["points"][1][1];
					var left = (x1 + x2) / 2;
					var top = (y1 + y2) / 2;
					var width = Math.abs(x1 - x2);
					var height = Math.abs(y1 - y2);

					hiObj["fabricObj"]["objects"].push({
						"type": "hiRect",
						"version": "4.1.0",
						"originX": "center",
						"originY": "center",
						"left": left,
						"top": top,
						"width": width,
						"height": height,
						"fill": colorToRgbA(strokeColor, fillAlpha),
						"stroke": strokeColor,
						"strokeDashArray": null,
						"strokeLineCap": "butt",
						"strokeDashOffset": 0,
						"strokeLineJoin": "miter",
						"strokeMiterLimit": 4,
						"scaleX": 1,
						"scaleY": 1,
						"angle": 0,
						"flipX": false,
						"flipY": false,
						"opacity": 1,
						"shadow": null,
						"visible": true,
						"backgroundColor": "",
						"fillRule": "nonzero",
						"paintFirst": "fill",
						"globalCompositeOperation": "source-over",
						"skewX": 0,
						"skewY": 0,
						"rx": 0,
						"ry": 0,
						"label": label,
						"className": className,
						"note": note
					})
				}
			} else if (item["shape_type"] == "polygon") {
				var points = []
				var maxX, maxY, minX, minY;
				for (var j = 0; j < item["points"].length; j++) {
					if (j == 0) {
						minX = item["points"][j][0];
						minY = item["points"][j][1];
						maxX = item["points"][j][0];
						maxY = item["points"][j][1];
					} else {
						minX = Math.min(minX, item["points"][j][0])
						minY = Math.min(minY, item["points"][j][1])
						maxX = Math.max(maxX, item["points"][j][0])
						maxY = Math.max(maxY, item["points"][j][1])
					}
					var left = minX;
					var top = minY;
					var width = Math.abs(maxX - minX);
					var height = Math.abs(maxY - minY);
					points.push({
						x: item["points"][j][0],
						y: item["points"][j][1]
					})
				}
				// 減點函數呼叫
				// if (simplify && typeof(simplify) === 'function') {
				// 	console.log(defaultImportOptions.polygon.simplifyNum)
				// 	points = simplify(points, defaultImportOptions.polygon.simplifyNum, false);
				// }
				hiObj["fabricObj"]["objects"].push({
					"type": "hiPolygon",
					"version": "4.1.0",
					"originX": "left",
					"originY": "top",
					"left": left,
					"top": top,
					"width": width,
					"height": height,
					"fill": colorToRgbA(strokeColor, fillAlpha),
					"stroke": strokeColor,
					"strokeDashArray": null,
					"strokeLineCap": "butt",
					"strokeDashOffset": 0,
					"strokeLineJoin": "miter",
					"strokeMiterLimit": 4,
					"scaleX": 1,
					"scaleY": 1,
					"angle": 0,
					"flipX": false,
					"flipY": false,
					"opacity": 1,
					"shadow": null,
					"visible": true,
					"backgroundColor": "",
					"fillRule": "nonzero",
					"paintFirst": "fill",
					"globalCompositeOperation": "source-over",
					"skewX": 0,
					"skewY": 0,
					"points": points,
					"label": label,
					"className": className,
					"note": note
				})
			} else if (item["shape_type"] == "linestrip") {
				var points = []
				var maxX, maxY, minX, minY;
				for (var j = 0; j < item["points"].length; j++) {
					if (j == 0) {
						minX = item["points"][j][0];
						minY = item["points"][j][1];
						maxX = item["points"][j][0];
						maxY = item["points"][j][1];
					} else {
						minX = Math.min(minX, item["points"][j][0])
						minY = Math.min(minY, item["points"][j][1])
						maxX = Math.max(maxX, item["points"][j][0])
						maxY = Math.max(maxY, item["points"][j][1])
					}
					var left = minX;
					var top = minY;
					var width = Math.abs(maxX - minX);
					var height = Math.abs(maxY - minY);
					points.push({
						x: item["points"][j][0],
						y: item["points"][j][1]
					})
				}
				// console.log(left, top, width, height, points)
				hiObj["fabricObj"]["objects"].push({
					"type": "hiPolyline",
					"version": "4.1.0",
					"originX": "left",
					"originY": "top",
					"left": left,
					"top": top,
					"width": width,
					"height": height,
					"fill": colorToRgbA(strokeColor, fillAlpha),
					"stroke": strokeColor,
					"strokeDashArray": null,
					"strokeLineCap": "butt",
					"strokeDashOffset": 0,
					"strokeLineJoin": "miter",
					"strokeMiterLimit": 4,
					"scaleX": 1,
					"scaleY": 1,
					"angle": 0,
					"flipX": false,
					"flipY": false,
					"opacity": 1,
					"shadow": null,
					"visible": true,
					"backgroundColor": "",
					"fillRule": "nonzero",
					"paintFirst": "fill",
					"globalCompositeOperation": "source-over",
					"skewX": 0,
					"skewY": 0,
					"points": points,
					"label": label,
					"className": className,
					"note": note
				})
			} else if (item["shape_type"] == "line") {
				if (item["points"].length != 2) {
					continue; // 點數不合
				}
				var x1 = item["points"][0][0];
				var y1 = item["points"][0][1];
				var x2 = item["points"][1][0];
				var y2 = item["points"][1][1];
				var left = (x1 + x2) / 2;
				var top = (y1 + y2) / 2;
				var width = Math.abs(x1 - x2);
				var height = Math.abs(y1 - y2);
				var newX1 = x1 - left;
				var newY1 = y1 - top;
				var newX2 = x2 - left;
				var newY2 = y2 - top;
				hiObj["fabricObj"]["objects"].push({
					"type": "hiLine",
					"version": "4.1.0",
					"originX": "center",
					"originY": "center",
					"left": left,
					"top": top,
					"width": width,
					"height": height,
					"fill": "rgba(255,0,0,1)",
					"stroke": strokeColor,
					"strokeDashArray": null,
					"strokeLineCap": "butt",
					"strokeDashOffset": 0,
					"strokeLineJoin": "miter",
					"strokeMiterLimit": 4,
					"scaleX": 1,
					"scaleY": 1,
					"angle": 0,
					"flipX": false,
					"flipY": false,
					"opacity": 1,
					"shadow": null,
					"visible": true,
					"backgroundColor": "",
					"fillRule": "nonzero",
					"paintFirst": "fill",
					"globalCompositeOperation": "source-over",
					"skewX": 0,
					"skewY": 0,
					"x1": newX1,
					"x2": newX2,
					"y1": newY1,
					"y2": newY2,
					"label": label,
					"className": className,
					"note": note
				})
			} else {

			}
		} // end for loop
		if (this.defaultOptions.event) {
			if (typeof(this.defaultOptions.event["import_callback"]) === 'function') {
				this.defaultOptions.event["import_callback"]();
			}
		}

		this.canvasView.loadFromJSON(hiObj["fabricObj"], this.canvasView.renderAll.bind(this.canvasView), function (o, object) {
			// `o` = json object
			// `object` = fabric.Object instance
			if (object.type == 'polygon') {
				// object.on('selected', function (opt) {
				// 	var polygon = this;
				// 	var evt = opt.e;
				// 	if (evt && evt.shiftKey === true) {
				// 		polygon.editShape = true;
				// 		polygon.hasControls = false;
				// 		polygon.hasBorders = false;
				// 		polygon.selectable = false;
				// 		controlOverride.polygonAddPoints(polygon)
				// 	}
				// })
				object.perPixelTargetFind = true;
			} else if (object.type == 'circle') {
				object.perPixelTargetFind = true;
			} else if (object.type == 'polyline') {
				// object.on('selected', function (opt) {
				// 	var polyline = this;
				// 	var evt = opt.e;
				// 	if (evt && evt.shiftKey === true) {
				// 		polyline.editShape = true;
				// 		polyline.hasControls = false;
				// 		polyline.hasBorders = false;
				// 		polyline.selectable = false;
				// 		controlOverride.polylineAddPoints(polyline)
				// 	}
				// })
			}
			that.canvasView.discardActiveObject()
		})

		return hiObj["fabricObj"];
	};
	return Import;
}(this));