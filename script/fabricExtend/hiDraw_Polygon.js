(function(global) {

  // 'use strict';

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.HiPolygon) {
    fabric.warn('fabric.HiPolygon is already defined');
    return;
  }

fabric.HiPolygon = fabric.util.createClass(fabric.Polygon, {

  type: 'hiPolygon',

  initialize: function (element, options) {
    options || (options = {});
    this.callSuper('initialize', element, options);
  },

  toObject: function (propertiesToInclude) {
    return this.callSuper('toObject', ['radius', 'startAngle', 'endAngle'].concat(propertiesToInclude));
  },

  _render: function (ctx) {
    this.callSuper('_render', ctx);

    // do not render if width/height are zeros or object is not visible
    if (this.width === 0 || this.height === 0 || !this.visible) return;
    this.controls = this.controlsGenerator(this)
    var polygon = this;
    this.on('selected', function (opt) {
      var evt = opt.e;
      if (evt && evt.shiftKey === true) {
        polygon.editShape = true;
        polygon.hasControls = false;
        polygon.hasBorders = false;
        polygon.selectable = false;
        polygon.polygonAddPoints(polygon)
      }
    })
    this.perPixelTargetFind = true;
  }
});

fabric.HiPolygon.fromObject = function (object, callback) {
  callback && callback(new fabric.HiPolygon(object.points, object));
};

fabric.HiPolygon.async = true;

// fabric.HiPolygon.prototype.controls = {}

fabric.HiPolygon.prototype.controlsGenerator = function (polygon) {

  var polygonPositionHandler = function (dim, finalMatrix, fabricObject) {
    var x = (fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x),
      y = (fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y);
    return fabric.util.transformPoint({
        x: x,
        y: y
      },
      fabric.util.multiplyTransformMatrices(
        fabricObject.canvas.viewportTransform,
        fabricObject.calcTransformMatrix()
      )
    );
  }

  var actionHandler = function (eventData, transform, x, y) {
    var polygon = transform.target,
      currentControl = polygon.controls[polygon.__corner],
      mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
      polygonBaseSize = polygon._getNonTransformedDimensions(),
      size = polygon._getTransformedDimensions(0, 0),
      finalPointPosition = {
        x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
        y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
      };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    return true;
  }

  var anchorWrapper = function (anchorIndex, fn) {
    return function (eventData, transform, x, y) {
      var fabricObject = transform.target,
        absolutePoint = fabric.util.transformPoint({
          x: (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x),
          y: (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y),
        }, fabricObject.calcTransformMatrix()),
        actionPerformed = fn(eventData, transform, x, y),
        newDim = fabricObject._setPositionDimensions({}),
        polygonBaseSize = fabricObject._getNonTransformedDimensions(),
        newX = (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) / polygonBaseSize.x,
        newY = (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) / polygonBaseSize.y;
      fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
      return actionPerformed;
    }
  }

  var lastControl = polygon.points.length - 1;

  return polygon.points.reduce(function (acc, point, index) {
    acc['p' + index] = new fabric.Control({
      positionHandler: polygonPositionHandler,
      actionHandler: anchorWrapper(index > 0 ? index - 1 : lastControl, actionHandler),
      actionName: 'modifyPolygon',
      pointIndex: index
    });
    return acc;
  }, {});
}

fabric.HiPolygon.prototype.polygonAddPoints = function (polygon) {
  // custom control

  polygon.editShape = true;
  polygon.hasControls = false;
  polygon.hasBorders = false;
  polygon.selectable = false;
  polygon.canvas.discardActiveObject();
  drawEdge(polygon.canvas, polygon)
  drawPoints(polygon.canvas, polygon)
  polygon.canvas.forEachObject(function (obj) {
    if (obj['tempDrawShape']) {
      polygon.canvas.bringToFront(obj);
    }
  })

  function newPoints(canvas, polygon) {
    if (!polygon) {
      return;
    }
    var matrix = polygon.calcTransformMatrix();
    var transformedPoints = polygon.get("points")
      .map(function (p) {
        var a = new fabric.Point(
          p.x - polygon.pathOffset.x,
          p.y - polygon.pathOffset.y);
        return a
      })
      .map(function (p) {
        var b = fabric.util.transformPoint(p, matrix);
        return b
      });
    return transformedPoints;
  }

  function drawPoints(canvas, polygon) {
    if (!polygon) {
      return;
    }
    var tempPoints = polygon.tempPoints || [];
    tempPoints.forEach(function (circle, index) {
      canvas.remove(circle);
    })
    tempPoints = [];
    var points = polygon.points;
    var zoom = canvas.getZoom() || 1;
    points = newPoints(canvas, polygon)
    points.forEach(function (point, index) {
      var circle = new fabric.Circle({
        tempDrawShape: true,
        radius: 5 / zoom,
        fill: 'green',
        left: point.x,
        top: point.y,
        originX: 'center',
        originY: 'center',
        selectable: true,
        hasBorders: false,
        hasControls: false,
        strokeUniform: true,
        strokeWidth: 1 / zoom,
        name: 'P' + index,
        tempPoints: true
      });
      canvas.add(circle);
      circle.controls = fabric.Object.prototype.controls;
      canvas.bringToFront(circle);
      circle.on('mousedown', function (opt) {
        var p = opt.target;
        p.startOriginalPoint = {
          x: p.getCenterPoint().x,
          y: p.getCenterPoint().y
        }
        if (opt.e.shiftKey) {
          // delete point
          deletePoint(canvas, polygon, p)
        }
      })
      circle.on('moving', function (opt) {
        var p = opt.target;
        absolutePoint = circle.startOriginalPoint
        //------------
        var mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(circle.getCenterPoint().x, circle.getCenterPoint().y), 'center', 'center')
        var polygonBaseSize = polygon._getNonTransformedDimensions();
        var size = polygon._getTransformedDimensions(0, 0);
        var idx = parseInt(circle.name.replace('P', ''))
        polygon.points[idx] = {
          x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
          y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
        }
      })
      circle.on('moved', function (opt) {
        drawEdge(canvas, polygon)
        drawPoints(canvas, polygon)
        // var min = minXY(canvas, polygon);
        // newDim = polygon._setPositionDimensions({
        //     left: min.x,
        //     top: min.y,
        //     width: min.width,
        //     height: min.height
        // })
        // polygon.set('left', min.x)
        // polygon.set('top', min.y)
        // polygon.set('width', min.width)
        // polygon.set('height', min.height)
      })
      tempPoints.push(circle)
    });
    polygon.tempPoints = tempPoints;
  }

  function deletePoint(canvas, polygon, point) {
    var idx = parseInt(point.name.replace('P', ''))
    polygon.points.splice(idx, 1);
    canvas.renderAll()
    drawEdge(canvas, polygon)
    drawPoints(canvas, polygon)
  }

  function drawEdge(canvas, polygon) {
    if (!polygon) {
      return;
    }
    var tempLines = polygon.tempLines || [];
    tempLines.forEach(function (line, index) {
      canvas.remove(line);
    })
    tempLines = [];
    var points = polygon.points;
    points = newPoints(canvas, polygon)
    points.forEach(function (point, index) {
      var lineX1 = point.x,
        lineY1 = point.y,
        lineX2, lineY2, pointsLength = points.length;
      if (index == 0) {
        lineX2 = points[pointsLength - 1].x;
        lineY2 = points[pointsLength - 1].y;
      } else {
        lineX2 = points[index - 1].x;
        lineY2 = points[index - 1].y;
      }
      var line = new fabric.Line([lineX1, lineY1, lineX2, lineY2], {
        tempDrawShape: true,
        strokeWidth: 2,
        fill: '#999999',
        stroke: '#999999',
        originX: 'center',
        originY: 'center',
        selectable: false,
        hasBorders: false,
        hasControls: false,
        strokeUniform: true,
        lockMovementX: true,
        lockMovementY: true,
        name: 'L' + index,
        ll: '/' + lineX1 + '/' + lineY1 + '/' + lineX2 + '/' + lineY2,
        tempLines: true
      });
      canvas.add(line);
      line.controls = fabric.Object.prototype.controls;
      canvas.bringToFront(line);
      // line.sendToBack();
      line.on('mousedown', function (opt) {
        var idx = parseInt(opt.target.name.replace('L', ''))
        mouseCoords = {
          x: canvas.getPointer(opt.e).x,
          y: canvas.getPointer(opt.e).y
        }
        var x1 = opt.target.x1,
          x2 = opt.target.x2,
          y1 = opt.target.y1,
          y2 = opt.target.y2;
        var a = (y1 - y2)
        var b = (x2 - x1)
        var c = (x1 - x2) * y2 - (y1 - y2) * x2;
        var x0 = mouseCoords.x,
          y0 = mouseCoords.y;
        var dist = Math.abs(a * x0 + b * y0 + c) / Math.sqrt(a * a + b * b);
        var mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(mouseCoords.x, mouseCoords.y), 'center', 'center')
        var polygonBaseSize = polygon._getNonTransformedDimensions();
        var size = polygon._getTransformedDimensions(0, 0);
        var newPoint = {
          x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
          y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
        }
        if (dist <= 3) {
          polygon.points.splice(idx, 0, newPoint);
          canvas.renderAll()
          drawEdge(canvas, polygon)
          drawPoints(canvas, polygon)
        }
      })
      tempLines.push(line)
    });
    polygon.tempLines = tempLines;
  }
}

hiDraw.prototype.Polygon = (function () {
  function Polygon(canvasItem, options, otherProps) {
    this.canvasItem = canvasItem;
    this.canvas = canvasItem.canvasView;
    this.options = options;
    this.otherProps = otherProps;
    this.className = 'Circle';
    this.isDrawing = false;
    this.bindEvents();

    this.min = 99;
    this.max = 999999;
    this.polygonMode = true;
    this.pointArray = new Array();
    this.lineArray = new Array();
    this.tempPolygonArray = new Array();
    this.activeLine;
    this.activeShape = false;
  }

  Polygon.prototype.bindEvents = function () {
    var inst = this;
    inst.canvas.on('mouse:down', function (o) {
      inst.onMouseDown(o);
    });
    inst.canvas.on('mouse:move', function (o) {
      inst.onMouseMove(o);
    });
    inst.canvas.on('mouse:up', function (o) {
      inst.onMouseUp(o);
    });
    inst.canvas.on('object:moving', function (o) {
      inst.disable();
    })
    document.onkeydown = function (event) {
      var key;
      if (window.event) {
        key = window.event.keyCode;
      } else {
        key = event.keyCode;
      }
      if (inst && key == 27) {
        if (inst.pointArray) {
          inst.pointArray.forEach(function (item) {
            inst.canvas.remove(item)
          })
        }
        if (inst.lineArray) {
          inst.lineArray.forEach(function (item) {
            inst.canvas.remove(item)
          })
        }
        if (inst.activeShape) {
          inst.canvas.remove(inst.activeShape)
        }
        if (inst.activeLine) {
          inst.canvas.remove(inst.activeLine)
        }
        inst.disable();
      }
    }
  }

  Polygon.prototype.unbindEvents = function () {
    var inst = this;
    inst.canvas.off('mouse:down');
    inst.canvas.off('mouse:move');
    inst.canvas.off('mouse:up');
    inst.canvas.off('object:added');
    inst.canvas.off('object:modified');
    inst.canvas.off('object:removed');
    inst.canvas.off('object:moving');
    inst.canvas.off('after:render');
    inst.canvas.off('mouse:wheel');
    inst.canvas.off('selection:created');
    inst.canvas.off('selection:updated');
    inst.canvas.off('selection:cleared');
  }


  Polygon.prototype.onMouseUp = function (o) {
    var inst = this;
    // inst.disable();
  };

  Polygon.prototype.onMouseMove = function (options) {
    var inst = this;
    if (!inst.isEnable()) {
      return;
    }

    // var pointer = inst.canvas.getPointer(o.e);
    // var activeObj = inst.canvas.getActiveObject();

    // activeObj.stroke = 'red',
    //     activeObj.strokeWidth = 5;
    // activeObj.fill = 'red';

    // if (origX > pointer.x) {
    //     activeObj.set({
    //         left: Math.abs(pointer.x)
    //     });
    // }

    // if (origY > pointer.y) {
    //     activeObj.set({
    //         top: Math.abs(pointer.y)
    //     });
    // }

    // activeObj.set({
    //     rx: Math.abs(origX - pointer.x) / 2
    // });
    // activeObj.set({
    //     ry: Math.abs(origY - pointer.y) / 2
    // });
    // activeObj.setCoords();
    // inst.canvas.renderAll();
    if (inst.activeLine && inst.activeLine.class == "line") {
      var pointer = inst.canvas.getPointer(options.e);
      inst.activeLine.set({
        x2: pointer.x,
        y2: pointer.y
      });

      var points = inst.activeShape.get("points");
      points[inst.pointArray.length] = {
        x: pointer.x,
        y: pointer.y
      }
      inst.activeShape.set({
        points: points
      });
      inst.canvas.renderAll();
    }
    inst.canvas.renderAll();
  };

  Polygon.prototype.onMouseDown = function (o) {
    var inst = this;
    inst.enable();

    // var pointer = inst.canvas.getPointer(o.e);
    // origX = pointer.x;
    // origY = pointer.y;

    // var ellipse = new fabric.Ellipse({
    //     top: origY,
    //     left: origX,
    //     rx: 0,
    //     ry: 0,
    //     selectable: false,
    //     hasBorders: true,
    //     hasControls: true,
    //     strokeUniform: true
    // });

    // ellipse.on('selected', function () {
    //     console.log('selected a Circle');
    //     inst.enable();
    // });
    // ellipse.on('mousedown', function () {
    //     console.log('mousedown a Circle');
    // });

    // inst.canvas.add(ellipse).setActiveObject(ellipse);
    if (o.target && o.target.id &&
      inst.pointArray &&
      inst.pointArray[0] &&
      o.target.id == inst.pointArray[0].id) {
      inst.generatePolygon(inst.pointArray);
    }
    if (inst.polygonMode) {
      inst.addPoint(o);
    }
  };

  Polygon.prototype.isEnable = function () {
    return this.isDrawing;
  }

  Polygon.prototype.enable = function () {
    this.isDrawing = true;
  }

  Polygon.prototype.disable = function () {
    this.isDrawing = false;
    this.unbindEvents();
    if (this.options && this.options.endDraw) {
      this.options.endDraw();
    }
  }

  Polygon.prototype.addPoint = function (options) {
    var inst = this;
    var pointer = inst.canvas.getPointer(options.e);
    // var random = Math.floor(Math.random() * (inst.max - inst.min + 1)) + inst.min;
    var id = hiDraw.prototype.uniqueIdGenerater();
    var zoom = inst.canvas.getZoom() || 1;
    var circle = new fabric.Circle({
      tempDrawShape: true,
      radius: 5 / zoom,
      fill: '#ffffff',
      stroke: 'rgba(0,0,0,0)',
      strokeWidth: 1 / zoom,
      left: (pointer.x),
      top: (pointer.y),
      // left: (options.e.layerX / inst.canvas.getZoom()),
      // top: (options.e.layerY / inst.canvas.getZoom()),
      selectable: false,
      hasBorders: false,
      hasControls: false,
      originX: 'center',
      originY: 'center',
      id: id,
      strokeUniform: true,
      objectCaching: false
    });
    if (inst.pointArray.length == 0) {
      circle.set({
        fill: 'red'
      })
    }
    // var points = [
    //     (options.e.layerX / inst.canvas.getZoom()), 
    //     (options.e.layerY / inst.canvas.getZoom()), 
    //     (options.e.layerX / inst.canvas.getZoom()), 
    //     (options.e.layerY / inst.canvas.getZoom())
    // ];
    var points = [
      (pointer.x),
      (pointer.y),
      (pointer.x),
      (pointer.y)
    ];
    var line = new fabric.Line(points, {
      tempDrawShape: true,
      strokeWidth: 2 / zoom,
      fill: '#999999',
      stroke: '#999999',
      class: 'line',
      originX: 'center',
      originY: 'center',
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      strokeUniform: true,
      objectCaching: false
    });


    if (inst.activeShape) {
      var pos = inst.canvas.getPointer(options.e);
      var points = inst.activeShape.get("points");
      points.push({
        x: pos.x,
        y: pos.y
      });
      var polygon = new fabric.HiPolygon(points, {
        tempDrawShape: true,
        stroke: '#333333',
        strokeWidth: 1 / zoom,
        fill: 'rgba(204,204,204,0.3)',
        opacity: 0.3,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
        strokeUniform: true,
        objectCaching: false
      });
      inst.canvas.remove(inst.activeShape);
      inst.canvas.add(polygon);
      // inst.tempPolygonArray.push(polygon);
      inst.activeShape = polygon;
      inst.canvas.renderAll();
    } else {
      // var polyPoint = [{
      //     x: (options.e.layerX / inst.canvas.getZoom()),
      //     y: (options.e.layerY / inst.canvas.getZoom())
      // }];
      var polyPoint = [{
        x: (pointer.x),
        y: (pointer.y)
      }];
      var polygon = new fabric.HiPolygon(polyPoint, {
        tempDrawShape: true,
        stroke: '#333333',
        strokeWidth: 1 / zoom,
        fill: 'rgba(204,204,204,0.3)',
        opacity: 0.3,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
        strokeUniform: true,
        objectCaching: false
      });
      inst.activeShape = polygon;
      inst.canvas.add(polygon);
      // inst.tempPolygonArray.push(polygon);
    }
    inst.activeLine = line;

    inst.pointArray.push(circle);
    inst.lineArray.push(line);

    inst.canvas.add(line);
    inst.canvas.add(circle);

    if (inst.pointArray.length > 0) {
      inst.canvas.bringToFront(inst.pointArray[0]);
    }
  }

  Polygon.prototype.generatePolygon = function (pointArray) {
    var inst = this;

    var points = new Array();
    pointArray.forEach(function (point) {
      points.push({
        x: point.left,
        y: point.top
      });
      inst.canvas.remove(point);
    })

    inst.lineArray.forEach(function (line) {
      inst.canvas.remove(line);
    })
    inst.canvas.remove(inst.activeShape).remove(inst.activeLine);
    var polygon = new fabric.HiPolygon(points, {
      // stroke: '#333333',
      // strokeWidth: 1,
      // fill: 'rgba(0,0,0,0)',
      opacity: 1,
      hasBorders: true,
      hasControls: true,
      strokeUniform: true,
      objectCaching: false,
      perPixelTargetFind: true
    });
    polygon.on('selected', function (opt) {
      inst.enable();
      var evt = opt.e;
      var polygon = inst.canvas.getActiveObject();
      // if (evt && evt.ctrlKey === true) {
      //     var polygonCenter = polygon.getCenterPoint();
      //     var lastControl = polygon.points.length - 1;
      //     polygon.cornerStyle = 'circle';
      //     polygon.cornerColor = 'rgba(0,0,255,0.5)';
      //     polygon.controls = polygon.points.reduce(function (acc, point, index) {
      //         acc['p' + index] = new fabric.Control({
      //             positionHandler: polygonPositionHandler,
      //             actionHandler: anchorWrapper(index > 0 ? index - 1 : lastControl, actionHandler),
      //             actionName: 'modifyPolygon',
      //             pointIndex: index
      //         });
      //         return acc;
      //     }, {});
      // } else if (evt && evt.shiftKey === true) {
      //     polygon.editShape = true;
      //     polygon.hasControls = false;
      //     polygon.hasBorders = false;
      //     polygon.selectable = false;
      //     drawEdge(inst.canvas, polygon)
      //     drawPoints(inst.canvas, polygon)
      // } else {
      //     polygon.cornerColor = 'rgb(178,204,255)';
      //     polygon.cornerStyle = 'rect';
      //     polygon.controls = fabric.Object.prototype.controls;
      // }

      if (evt && evt.shiftKey === true) {
        polygon.editShape = true;
        polygon.hasControls = false;
        polygon.hasBorders = false;
        polygon.selectable = false;
        polygon.polygonAddPoints(polygon)
        // controlOverride.polygonAddPoints(polygon)
        // drawEdge(inst.canvas, polygon)
        // drawPoints(inst.canvas, polygon)
      }

      // inst.bindEvents();
      if (inst.options && inst.options.onSelected) {
        inst.options.onSelected(polygon);
      }
    });
    polygon.on('moved', function (opt) {
      if (polygon.editShape) {
        drawEdge(inst.canvas, polygon)
        drawPoints(inst.canvas, polygon)
      } else {
        console.log('not edit shape')
      }
    })
    polygon.on("modified", function () {
      if (polygon.editShape) {
        drawEdge(inst.canvas, polygon)
        drawPoints(inst.canvas, polygon)
      }
    })
    for (var prop in inst.otherProps) {
      polygon[prop] = inst.otherProps[prop];
    }
    inst.canvas.add(polygon).setActiveObject(polygon);
    polygon.canvasItem = inst.canvasItem;



    inst.activeLine = null;
    inst.activeShape = null;
    inst.polygonMode = false;
    inst.disable();
  }

  // define a function that can locate the controls.
  // this function will be used both for drawing and for interaction.
  function polygonPositionHandler(dim, finalMatrix, fabricObject) {
    var x = (fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x),
      y = (fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y);
    return fabric.util.transformPoint({
        x: x,
        y: y
      },
      fabric.util.multiplyTransformMatrices(
        fabricObject.canvas.viewportTransform,
        fabricObject.calcTransformMatrix()
      )
    );
  }

  // define a function that will define what the control does
  // this function will be called on every mouse move after a control has been
  // clicked and is being dragged.
  // The function receive as argument the mouse event, the current trasnform object
  // and the current position in canvas coordinate
  // transform.target is a reference to the current object being transformed,
  function actionHandler(eventData, transform, x, y) {
    var polygon = transform.target,
      currentControl = polygon.controls[polygon.__corner],
      mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
      polygonBaseSize = polygon._getNonTransformedDimensions(),
      size = polygon._getTransformedDimensions(0, 0),
      finalPointPosition = {
        x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
        y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
      };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    return true;
  }

  // define a function that can keep the polygon in the same position when we change its
  // width/height/top/left.
  function anchorWrapper(anchorIndex, fn) {
    return function (eventData, transform, x, y) {
      var fabricObject = transform.target,
        absolutePoint = fabric.util.transformPoint({
          x: (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x),
          y: (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y),
        }, fabricObject.calcTransformMatrix()),
        actionPerformed = fn(eventData, transform, x, y),
        newDim = fabricObject._setPositionDimensions({}),
        polygonBaseSize = fabricObject._getNonTransformedDimensions(),
        newX = (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) / polygonBaseSize.x,
        newY = (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) / polygonBaseSize.y;
      // console.log('absolutePoint', absolutePoint)
      fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
      return actionPerformed;
    }
  }

  //-----------------------
  // custom control

  function newPoints(canvas, polygon) {
    if (!polygon) {
      return;
    }
    var matrix = polygon.calcTransformMatrix();
    var transformedPoints = polygon.get("points")
      .map(function (p) {
        var a = new fabric.Point(
          p.x - polygon.pathOffset.x,
          p.y - polygon.pathOffset.y);
        return a
      })
      .map(function (p) {
        var b = fabric.util.transformPoint(p, matrix);
        return b
      });
    return transformedPoints;
  }

  // function minXY(canvas, polygon) {
  //     if(!polygon){
  //         return;
  //     }
  //     var tempPoints = polygon.tempPoints;
  //     var points = newPoints(canvas, polygon);
  //     points = tempPoints;
  //     var minX, minY, maxX, maxY;
  //     points.forEach(function (point, index) {
  //         if (index == 0) {
  //             // minX = point.x;
  //             // minY = point.y;
  //             minX = point.getCenterPoint().x;
  //             minY = point.getCenterPoint().y;
  //             maxX = point.getCenterPoint().x;
  //             maxY = point.getCenterPoint().y;
  //         } else {
  //             // minX = Math.min(minX, point.x)
  //             // minY = Math.min(minY, point.y)
  //             minX = Math.min(minX, point.getCenterPoint().x)
  //             minY = Math.min(minY, point.getCenterPoint().y)
  //             maxX = Math.max(maxX, point.getCenterPoint().x)
  //             maxY = Math.max(maxY, point.getCenterPoint().y)
  //         }
  //     });
  //     return {
  //         x: minX,
  //         y: minY,
  //         width: (maxX - minX),
  //         height: (maxY - minY)
  //     }
  // }

  function drawPoints(canvas, polygon) {
    if (!polygon) {
      return;
    }
    var tempPoints = polygon.tempPoints || [];
    tempPoints.forEach(function (circle, index) {
      canvas.remove(circle);
    })
    tempPoints = [];
    var points = polygon.points;
    var zoom = canvas.getZoom() || 1;
    points = newPoints(canvas, polygon)
    points.forEach(function (point, index) {
      var circle = new fabric.Circle({
        tempDrawShape: true,
        radius: 5 / zoom,
        strokeWidth: 1 / zoom,
        fill: 'green',
        left: point.x,
        top: point.y,
        originX: 'center',
        originY: 'center',
        selectable: true,
        hasBorders: false,
        hasControls: false,
        name: index,
        tempPoints: true
      });
      canvas.add(circle);
      circle.bringToFront();
      circle.on('mousedown', function (opt) {
        var p = opt.target;
        p.startOriginalPoint = {
          x: p.getCenterPoint().x,
          y: p.getCenterPoint().y
        }
      })
      circle.on('moving', function (opt) {
        var p = opt.target;
        absolutePoint = circle.startOriginalPoint
        //------------
        var mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(circle.getCenterPoint().x, circle.getCenterPoint().y), 'center', 'center')
        var polygonBaseSize = polygon._getNonTransformedDimensions();
        var size = polygon._getTransformedDimensions(0, 0);
        polygon.points[circle.name] = {
          x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
          y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
        }
      })
      circle.on('moved', function (opt) {
        drawEdge(canvas, polygon)
        drawPoints(canvas, polygon)
        // var min = minXY(canvas, polygon);
        // newDim = polygon._setPositionDimensions({
        //     left: min.x - 0.5,
        //     top: min.y - 0.5,
        //     width: min.width,
        //     height: min.height
        // })
        // polygon.set('left', min.x - 0.5)
        // polygon.set('top', min.y - 0.5)
        // polygon.set('width', min.width + 0.5)
        // polygon.set('height', min.height + 0.5)
      })
      tempPoints.push(circle)
    });
    polygon.tempPoints = tempPoints;
  }

  function drawEdge(canvas, polygon) {
    if (!polygon) {
      return;
    }
    var tempLines = polygon.tempLines || [];
    tempLines.forEach(function (line, index) {
      canvas.remove(line);
    })
    tempLines = [];
    var points = polygon.points;
    points = newPoints(canvas, polygon)
    points.forEach(function (point, index) {
      var lineX1 = point.x,
        lineY1 = point.y,
        lineX2, lineY2, pointsLength = points.length;
      if (index == 0) {
        lineX2 = points[pointsLength - 1].x;
        lineY2 = points[pointsLength - 1].y;
      } else {
        lineX2 = points[index - 1].x;
        lineY2 = points[index - 1].y;
      }
      var line = new fabric.Line([lineX1, lineY1, lineX2, lineY2], {
        tempDrawShape: true,
        strokeWidth: 2,
        fill: '#999999',
        stroke: '#999999',
        originX: 'center',
        originY: 'center',
        selectable: false,
        hasBorders: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        name: 'L' + index,
        ll: '/' + lineX1 + '/' + lineY1 + '/' + lineX2 + '/' + lineY2,
        tempLines: true
      });
      canvas.add(line);
      line.bringToFront();
      // line.sendToBack();
      line.on('mousedown', function (opt) {
        var idx = parseInt(opt.target.name.replace('L', ''))
        mouseCoords = {
          x: canvas.getPointer(opt.e).x,
          y: canvas.getPointer(opt.e).y
        }
        var x1 = opt.target.x1,
          x2 = opt.target.x2,
          y1 = opt.target.y1,
          y2 = opt.target.y2;
        var a = (y1 - y2)
        var b = (x2 - x1)
        var c = (x1 - x2) * y2 - (y1 - y2) * x2;
        var x0 = mouseCoords.x,
          y0 = mouseCoords.y;
        var dist = Math.abs(a * x0 + b * y0 + c) / Math.sqrt(a * a + b * b);
        var mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(mouseCoords.x, mouseCoords.y), 'center', 'center')
        var polygonBaseSize = polygon._getNonTransformedDimensions();
        var size = polygon._getTransformedDimensions(0, 0);
        var newPoint = {
          x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
          y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
        }
        if (dist <= 2) {
          polygon.points.splice(idx, 0, newPoint);
          canvas.renderAll()
          drawEdge(canvas, polygon)
          drawPoints(canvas, polygon)
        }
      })
      tempLines.push(line)
    });
    polygon.tempLines = tempLines;
  }

  function removeControl(canvas, polygon) {
    tempPoints.forEach(function (circle, index) {
      canvas.remove(circle);
    })
    tempLines.forEach(function (line, index) {
      canvas.remove(line);
    })
    polygon.controls = fabric.Object.prototype.controls;
    polygon.hasControls = true;
    canvas.setActiveObject(polygon);
  }
  //-----------------------


  return Polygon;
})()

// var polygon = canvas.getActiveObject();

// var polygonCenter = polygon.getCenterPoint();

// var translatedPoints = polygon.get('points').map(function(p) {
//   return { 
//     x: polygonCenter.x + p.x, 
//     y: polygonCenter.y + p.y
//   };
// });

// ---

// translatedPoints.forEach(function(p) {
//     canvas.getContext().strokeRect(p.x-5, p.y-5, 10, 10);
//   });

hiDraw.prototype.getPolygonArea = function (vertices) {
  // polygon.get("points");
  var total = 0;

  for (var i = 0, l = vertices.length; i < l; i++) {
    var addX = vertices[i].x;
    var addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
    var subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
    var subY = vertices[i].y;

    total += (addX * addY * 0.5);
    total -= (subX * subY * 0.5);
  }

  return Math.abs(total);
}

hiDraw.prototype.renderPolygonLayer = function (canvasView) {
  var that = this;
  var ary = []
  canvasView.forEachObject(function (obj) {
    if (obj.get('type') === 'hiPolygon') {
      ary.push(obj)
    }
  })
  ary.sort(function (obj1, obj2) {
    var area1 = that.getPolygonArea(obj1.get("points"))
    var area2 = that.getPolygonArea(obj2.get("points"))
    return area1 - area2;
  })
  ary.forEach(function (obj) {
    canvasView.sendToBack(obj)
  })
  canvasView.renderAll()
}


})(typeof exports !== 'undefined' ? exports : this);