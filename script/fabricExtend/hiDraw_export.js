hiDraw.prototype.export = (function () {
    var Export = function(json, extension, exportOption){
        var defaultExportOption = {
            numType: 'float'
        };
        if(typeof json == 'string'){
            json = JSON.parse(json)
        }
        if(exportOption){
            defaultExportOption['numType'] = exportOption.numType
        }
        // console.log(this.defaultOptions.image)
        if(json){
            var hiObj = {}
		        hiObj["fabricObj"] = json;
                var labelmeObj = {}
                labelmeObj['version'] = "4.5.6";
                labelmeObj['flags'] = {}
                labelmeObj['imagePath'] = "image.png";
                labelmeObj['imageData'] = this.defaultOptions.image?this.defaultOptions.image.imagAry:'';
                labelmeObj['imageHeight'] = this.defaultOptions.image?this.defaultOptions.image.realHeight:'';
                labelmeObj['imageWidth'] = this.defaultOptions.image?this.defaultOptions.image.realWidth:'';
                labelmeObj['shapes'] = [];

                for (var i = 0; i < hiObj["fabricObj"]["objects"].length; i++) {
                    var item = hiObj["fabricObj"]["objects"][i];
                    if (item["type"] == "hiCircle") {
                        var labelmeItem = {}
                        labelmeItem["shape_type"] = "circle";
                        labelmeItem["label"] = item["label"];
                        labelmeItem["className"] = item["className"];
                        labelmeItem = extensionProp(labelmeItem, item, extension);
                        labelmeItem["group_id"] = null;
                        labelmeItem["flags"] = {};
                        labelmeItem["points"] = []
                        labelmeItem["note"] = item["note"];
                        var centerPoint = [], borderPoint = [];
                        if(item["originX"] == "left"){
                            centerPoint[0] = item.left + item.radius;
                            borderPoint[0] = item.left + item.radius;
                        } else if(item["originX"] == "center"){
                            centerPoint[0] = item.left;
                            borderPoint[0] = item.left;
                        } else {
                            centerPoint[0] = item.left - item.radius;
                            borderPoint[0] = item.left - item.radius;
                        }
                        if(item["originY"] == "top"){
                            centerPoint[1] = item.top + item.radius;
                            borderPoint[1] = item.top + item.radius * 2;
                        } else if(item["originY"] == "center"){
                            centerPoint[1] = item.top;
                            borderPoint[1] = item.top + item.radius;
                        } else {
                            centerPoint[1] = item.top - item.radius;
                            borderPoint[1] = item.top - item.radius * 2;
                        }
                        // var leftTop = [
                        //     item.left + item.radius,
                        //     item.top + item.radius
                        // ]
                        // // var rightBottom = [
                        // //     item.left + item.width,
                        // //     item.top + item.height
                        // // ]
                        // var rightBottom = [
                        //     item.left + item.radius * 2,
                        //     item.top + item.radius * 2
                        // ]
                        if (defaultExportOption['numType'] == 'int') {
                            centerPoint[0] = parseInt(centerPoint[0])
                            centerPoint[1] = parseInt(centerPoint[1])
                            borderPoint[0] = parseInt(borderPoint[0])
                            borderPoint[1] = parseInt(borderPoint[1])
                        }
                        labelmeItem["points"] = [centerPoint, borderPoint]
                        labelmeObj['shapes'].push(labelmeItem)
                    } else if (item["type"] == "hiRect") {
                        var labelmeItem = {}
                        labelmeItem["shape_type"] = "rectangle";
                        labelmeItem["label"] = item["label"];
                        labelmeItem["className"] = item["className"];
                        labelmeItem = extensionProp(labelmeItem, item, extension);
                        labelmeItem["group_id"] = null;
                        labelmeItem["flags"] = {};
                        labelmeItem["points"] = []
                        labelmeItem["note"] = item["note"];
                        var leftTop = [], rightBottom = [];
                        if(item["originX"] == "left"){
                            leftTop[0] = item.left;
                            rightBottom[0] = item.left + item.width;
                        } else if(item["originX"] == "center"){
                            leftTop[0] = item.left - item.width / 2;
                            rightBottom[0] = item.left + item.width / 2;
                        } else {
                            leftTop[0] = item.left - item.width;
                            rightBottom[0] = item.left;
                        }
                        if(item["originY"] == "top"){
                            leftTop[1] = item.top;
                            rightBottom[1] = item.top + item.height;
                        } else if(item["originY"] == "center"){
                            leftTop[1] = item.top - item.height / 2;
                            rightBottom[1] = item.top + item.height / 2;
                        } else {
                            leftTop[1] = item.top - item.height;
                            rightBottom[1] = item.top;
                        }
                        if (defaultExportOption['numType'] == 'int') {
                            leftTop[0] = parseInt(leftTop[0])
                            leftTop[1] = parseInt(leftTop[1])
                            rightBottom[0] = parseInt(rightBottom[0])
                            rightBottom[1] = parseInt(rightBottom[1])
                        }
                        labelmeItem["points"] = [leftTop, rightBottom]
                        labelmeObj['shapes'].push(labelmeItem)
                    } else if (item["type"] == "hiLine") {
                        var labelmeItem = {}
                        labelmeItem["shape_type"] = "line";
                        labelmeItem["label"] = item["label"];
                        labelmeItem["className"] = item["className"];
                        labelmeItem = extensionProp(labelmeItem, item, extension);
                        labelmeItem["group_id"] = null;
                        labelmeItem["flags"] = {};
                        labelmeItem["points"] = []
                        labelmeItem["note"] = item["note"];
                        var firstPoint = [
                            item.left + item.x1,
                            item.top + item.y1
                        ]
                        var secondPoint = [
                            item.left + item.x2,
                            item.top + item.y2
                        ]
                        if (defaultExportOption['numType'] == 'int') {
                            firstPoint[0] = parseInt(firstPoint[0])
                            firstPoint[1] = parseInt(firstPoint[1])
                            secondPoint[0] = parseInt(secondPoint[0])
                            secondPoint[1] = parseInt(secondPoint[1])
                        }
                        labelmeItem["points"] = [firstPoint, secondPoint]
                        labelmeObj['shapes'].push(labelmeItem)
                    } else if (item["type"] == "hiPolyline") {
                        var labelmeItem = {}
                        labelmeItem["shape_type"] = "linestrip";
                        labelmeItem["label"] = item["label"];
                        labelmeItem["className"] = item["className"];
                        labelmeItem = extensionProp(labelmeItem, item, extension);
                        labelmeItem["group_id"] = null;
                        labelmeItem["flags"] = {};
                        labelmeItem["points"] = []
                        labelmeItem["note"] = item["note"];
                        var points = []
                        var maxX, maxY, minX, minY, shiftX, shiftY;
                        for (var j = 0;j < item["points"].length; j++) {
                            if (j == 0) {
                                minX = item["points"][j].x;
                                minY = item["points"][j].y;
                                maxX = item["points"][j].x;
                                maxY = item["points"][j].y;
                            } else {
                                minX = Math.min(minX, item["points"][j].x)
                                minY = Math.min(minY, item["points"][j].y)
                                maxX = Math.max(maxX, item["points"][j].x)
                                maxY = Math.max(maxY, item["points"][j].y)
                            }
                        }
                        shiftX = minX - item.left;
                        shiftY = minY - item.top;
                        for (var j = 0;j < item["points"].length; j++) {
                            points.push([
                                item["points"][j].x - shiftX,
                                item["points"][j].y - shiftY
                            ]);
                        }
                        if (defaultExportOption['numType'] == 'int') {
                            for (var j = 0;j < points.length; j++) {
                                for (var i = 0;i < points[j].length; i++) {
                                    points[j][i] = parseInt(points[j][i])
                                }
                            }
                        }
                        labelmeItem["points"] = points;
                        labelmeObj['shapes'].push(labelmeItem)
                    } else if (item["type"] == "hiPolygon") {
                        var labelmeItem = {}
                        labelmeItem["shape_type"] = "polygon";
                        labelmeItem["label"] = item["label"];
                        labelmeItem["className"] = item["className"];
                        labelmeItem = extensionProp(labelmeItem, item, extension);
                        labelmeItem["group_id"] = null;
                        labelmeItem["flags"] = {};
                        labelmeItem["points"] = []
                        labelmeItem["note"] = item["note"];
                        var points = []
                        var maxX, maxY, minX, minY, shiftX, shiftY;
                        for (var j = 0;j < item["points"].length; j++) {
                            if (j == 0) {
                                minX = item["points"][j].x;
                                minY = item["points"][j].y;
                                maxX = item["points"][j].x;
                                maxY = item["points"][j].y;
                            } else {
                                minX = Math.min(minX, item["points"][j].x)
                                minY = Math.min(minY, item["points"][j].y)
                                maxX = Math.max(maxX, item["points"][j].x)
                                maxY = Math.max(maxY, item["points"][j].y)
                            }
                        }
                        shiftX = minX - item.left;
                        shiftY = minY - item.top;
                        for (var j = 0;j < item["points"].length; j++) {
                            points.push([
                                item["points"][j].x - shiftX,
                                item["points"][j].y - shiftY
                            ]);
                        }
                        if (defaultExportOption['numType'] == 'int') {
                            // console.log('points', points)
                            for (var j = 0;j < points.length; j++) {
                                for (var k = 0;k < points[j].length; k++) {
                                    // console.log('parseInt(points[j][i])', parseInt(points[j][i]))
                                    points[j][k] = parseInt(points[j][k])
                                }
                            }
                        }
                        labelmeItem["points"] = points;
                        labelmeObj['shapes'].push(labelmeItem)
                    } else {}
                }

                return labelmeObj;
        }
    };

    function extensionProp(labelmeObj, fabricObj, extension) {
        if(!Array.isArray(extension)){
            return labelmeObj;
        }
        for (var i = 0; i < extension.length; i++) {
            labelmeObj[extension[i]] = fabricObj[extension[i]];
        }
        return labelmeObj;
    }

    return Export;
}());